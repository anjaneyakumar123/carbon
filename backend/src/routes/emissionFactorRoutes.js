const express = require('express');
const router = express.Router();
const emissionFactorController = require('../controllers/emissionFactorController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, emissionFactorController.getEmissionFactors);
router.post('/', verifyToken, requireRole('ADMIN', 'OFFICER'), emissionFactorController.createEmissionFactor);
router.put('/:id', verifyToken, requireRole('ADMIN', 'OFFICER'), emissionFactorController.updateEmissionFactor);

module.exports = router;

