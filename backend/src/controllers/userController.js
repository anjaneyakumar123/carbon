const prisma = require('../config/prisma');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        department: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, departmentId } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: role || undefined,
        departmentId: departmentId !== undefined ? departmentId : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        department: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_USER_ROLE',
        entity: 'User',
        entityId: id,
        details: { newRole: role, departmentId }
      }
    });

    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

