const prisma = require('../config/prisma');

exports.getRecommendations = async (req, res, next) => {
  try {
    const { priority, status, category } = req.query;

    const where = {};
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (category) where.category = category;

    const recommendations = await prisma.recommendation.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
    });

    const counts = await prisma.recommendation.groupBy({
      by: ['priority'],
      _count: true
    });

    return res.status(200).json({
      success: true,
      recommendations,
      counts
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.recommendation.update({
      where: { id },
      data: { status }
    });

    return res.status(200).json({ success: true, recommendation: updated });
  } catch (error) {
    next(error);
  }
};

exports.createRecommendation = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority = 'MEDIUM',
      category = 'ENERGY',
      supportingData,
      relatedFeature,
      suggestedAction
    } = req.body;

    if (!title || !description || !suggestedAction) {
      return res.status(400).json({ success: false, message: 'Title, description and suggestedAction are required' });
    }

    const created = await prisma.recommendation.create({
      data: {
        title,
        description,
        priority,
        category,
        supportingData: supportingData || 'Identified via environmental data correlation analysis',
        relatedFeature: relatedFeature || 'Station General Operations',
        suggestedAction,
        status: 'OPEN'
      }
    });

    return res.status(201).json({ success: true, recommendation: created });
  } catch (error) {
    next(error);
  }
};

