const prisma = require('../config/prisma');

exports.getActivities = async (req, res, next) => {
  try {
    const { category, scope, departmentId, page = 1, limit = 50 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (scope) where.scope = scope;
    if (departmentId) where.departmentId = departmentId;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [total, activities] = await Promise.all([
      prisma.activityRecord.count({ where }),
      prisma.activityRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          emissionFactor: true,
          department: true,
          emissionResults: true
        }
      })
    ]);

    // Aggregate emissions by scope
    const scopeAgg = await prisma.activityRecord.groupBy({
      by: ['scope'],
      _sum: {
        calculatedEmissionKgCO2: true
      },
      _count: true
    });

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      activities,
      scopeAgg
    });
  } catch (error) {
    next(error);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const {
      date,
      category,
      activityName,
      quantity,
      unit,
      scope = 'UNASSIGNED',
      emissionFactorId,
      departmentId,
      details
    } = req.body;

    if (!date || !category || !activityName || quantity === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Date, category, activityName, quantity and unit are required.'
      });
    }

    let calculatedEmission = null;
    let calculationStatus = 'PENDING';
    let factorUsed = null;

    if (emissionFactorId) {
      const factor = await prisma.emissionFactor.findUnique({
        where: { id: emissionFactorId }
      });

      if (factor && factor.isActive) {
        calculatedEmission = parseFloat(quantity) * factor.factor;
        calculationStatus = 'COMPLETED';
        factorUsed = factor;
      }
    }

    const activity = await prisma.activityRecord.create({
      data: {
        date: new Date(date),
        category,
        activityName,
        quantity: parseFloat(quantity),
        unit,
        scope,
        emissionFactorId: emissionFactorId || null,
        calculatedEmissionKgCO2: calculatedEmission,
        calculationStatus,
        details: details || null,
        departmentId: departmentId || null,
        createdBy: req.user ? req.user.name : 'Authorized Officer'
      },
      include: {
        emissionFactor: true,
        department: true
      }
    });

    // If calculation completed, record in emission_results
    if (calculatedEmission !== null && factorUsed) {
      await prisma.emissionResult.create({
        data: {
          activityRecordId: activity.id,
          emissionKgCO2: calculatedEmission,
          emissionKgCO2e: calculatedEmission * (factorUsed.co2eMultiplier || 1.0),
          factorUsed: factorUsed.factor,
          factorSource: factorUsed.source,
          notes: `Calculated via ${factorUsed.methodology} (${factorUsed.version})`
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_ACTIVITY_RECORD',
        entity: 'ActivityRecord',
        entityId: activity.id,
        details: { activityName, category, quantity, calculatedEmission }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Operational activity recorded successfully',
      activity
    });
  } catch (error) {
    next(error);
  }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      date,
      activityName,
      quantity,
      unit,
      scope,
      emissionFactorId,
      departmentId,
      details
    } = req.body;

    const existing = await prisma.activityRecord.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Activity record not found' });
    }

    let calculatedEmission = existing.calculatedEmissionKgCO2;
    let calculationStatus = existing.calculationStatus;
    const factorId = emissionFactorId !== undefined ? emissionFactorId : existing.emissionFactorId;
    const currentQty = quantity !== undefined ? parseFloat(quantity) : existing.quantity;

    if (factorId) {
      const factor = await prisma.emissionFactor.findUnique({ where: { id: factorId } });
      if (factor) {
        calculatedEmission = currentQty * factor.factor;
        calculationStatus = 'COMPLETED';
      }
    }

    const updated = await prisma.activityRecord.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        activityName: activityName || undefined,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit: unit || undefined,
        scope: scope || undefined,
        emissionFactorId: factorId || null,
        calculatedEmissionKgCO2: calculatedEmission,
        calculationStatus,
        details: details !== undefined ? details : undefined,
        departmentId: departmentId !== undefined ? departmentId : undefined
      },
      include: {
        emissionFactor: true,
        department: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Activity record updated successfully',
      activity: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.activityRecord.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Activity record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

