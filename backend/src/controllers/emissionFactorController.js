const prisma = require('../config/prisma');

exports.getEmissionFactors = async (req, res, next) => {
  try {
    const { category, isActive } = req.query;

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const factors = await prisma.emissionFactor.findMany({
      where,
      orderBy: [{ category: 'asc' }, { fuelOrActivityType: 'asc' }]
    });

    return res.status(200).json({ success: true, factors });
  } catch (error) {
    next(error);
  }
};

exports.createEmissionFactor = async (req, res, next) => {
  try {
    const {
      category,
      fuelOrActivityType,
      factor,
      unit,
      source,
      version = '1.0',
      methodology,
      co2eMultiplier = 1.0
    } = req.body;

    if (!category || !fuelOrActivityType || factor === undefined || !unit || !source) {
      return res.status(400).json({
        success: false,
        message: 'Category, fuelOrActivityType, factor, unit and source are required.'
      });
    }

    const created = await prisma.emissionFactor.create({
      data: {
        category,
        fuelOrActivityType,
        factor: parseFloat(factor),
        unit,
        source,
        version,
        methodology: methodology || 'Tier 1 Default Emission Modeling',
        co2eMultiplier: parseFloat(co2eMultiplier) || 1.0,
        isActive: true,
        isVerified: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Emission factor registered successfully',
      factor: created
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmissionFactor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      factor,
      unit,
      source,
      version,
      methodology,
      co2eMultiplier,
      isActive,
      isVerified
    } = req.body;

    const updated = await prisma.emissionFactor.update({
      where: { id },
      data: {
        factor: factor !== undefined ? parseFloat(factor) : undefined,
        unit: unit || undefined,
        source: source || undefined,
        version: version || undefined,
        methodology: methodology || undefined,
        co2eMultiplier: co2eMultiplier !== undefined ? parseFloat(co2eMultiplier) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Emission factor updated successfully',
      factor: updated
    });
  } catch (error) {
    next(error);
  }
};

