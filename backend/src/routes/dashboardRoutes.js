const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.get('/summary', verifyToken, dashboardController.getSummary);
router.get('/trends', verifyToken, dashboardController.getTrends);
router.get('/distribution', verifyToken, dashboardController.getDistribution);
router.get('/breakdowns', verifyToken, dashboardController.getBreakdowns);

module.exports = router;

