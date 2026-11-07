const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

router.get('/summary', verifyToken, reportController.getReportSummary);
router.get('/pdf', verifyToken, reportController.exportReportPDF);
router.get('/excel', verifyToken, reportController.exportReportExcel);

module.exports = router;

