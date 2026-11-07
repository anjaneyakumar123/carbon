const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN'), userController.getUsers);
router.patch('/:id/role', verifyToken, requireRole('ADMIN'), userController.updateUserRole);
router.get('/audit-logs', verifyToken, requireRole('ADMIN'), userController.getAuditLogs);

module.exports = router;

