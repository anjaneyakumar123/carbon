const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, activityController.getActivities);
router.post('/', verifyToken, requireRole('ADMIN', 'OFFICER'), activityController.createActivity);
router.put('/:id', verifyToken, requireRole('ADMIN', 'OFFICER'), activityController.updateActivity);
router.delete('/:id', verifyToken, requireRole('ADMIN'), activityController.deleteActivity);

module.exports = router;

