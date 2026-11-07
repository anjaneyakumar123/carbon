const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/models', verifyToken, predictionController.getModels);
router.post('/predict', verifyToken, predictionController.predictEmission);
router.get('/history', verifyToken, predictionController.getPredictionHistory);
router.post('/train', verifyToken, requireRole('ADMIN'), predictionController.retrainModels);

module.exports = router;

