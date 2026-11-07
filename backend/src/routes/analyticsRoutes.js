const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

router.get('/correlation', verifyToken, analyticsController.getCorrelationMatrix);
router.get('/scatter', verifyToken, analyticsController.getScatterSamples);
router.get('/renewable', verifyToken, analyticsController.getRenewableAnalytics);

module.exports = router;

