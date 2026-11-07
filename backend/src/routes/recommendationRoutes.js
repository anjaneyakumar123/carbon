const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, recommendationController.getRecommendations);
router.patch('/:id/status', verifyToken, requireRole('ADMIN', 'OFFICER'), recommendationController.updateStatus);
router.post('/', verifyToken, requireRole('ADMIN', 'OFFICER'), recommendationController.createRecommendation);

module.exports = router;

