const axios = require('axios');
const prisma = require('../config/prisma');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

exports.getModels = async (req, res, next) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/models`, { timeout: 4000 });
    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    // Return saved metadata if ML service is unreachable
    console.warn('ML Service unreachable, querying DB for metadata:', error.message);
    const dbModels = await prisma.modelMetadata.findMany({
      orderBy: { r2Score: 'desc' }
    });
    return res.status(200).json({
      success: true,
      data: {
        models: dbModels,
        bestModel: dbModels[0]?.modelName || 'Linear Regression',
        fallback: true
      }
    });
  }
};

exports.predictEmission = async (req, res, next) => {
  try {
    const inputFeatures = req.body;

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, inputFeatures, { timeout: 6000 });
    const result = response.data;

    // Persist in prediction_history
    const history = await prisma.predictionHistory.create({
      data: {
        inputFeatures,
        predictedEmissionKgCO2: result.predicted_emission_kgCO2,
        modelUsed: result.model_used,
        modelMetrics: {
          r2: result.model_r2_score,
          rmse: result.model_rmse
        },
        createdBy: req.user ? req.user.name : 'Environmental Analyst'
      }
    });

    return res.status(200).json({
      success: true,
      result,
      historyId: history.id
    });
  } catch (error) {
    console.error('Prediction API error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute prediction from ML service',
      error: error.response?.data || error.message
    });
  }
};

exports.getPredictionHistory = async (req, res, next) => {
  try {
    const history = await prisma.predictionHistory.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

exports.retrainModels = async (req, res, next) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/train`, {}, { timeout: 60000 });
    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    next(error);
  }
};

