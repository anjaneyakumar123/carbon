const express = require('express');
const router = express.Router();
const multer = require('multer');
const datasetController = require('../controllers/datasetController');
const { verifyToken, requireRole } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.get('/', verifyToken, datasetController.getRecords);
router.get('/dictionary', verifyToken, datasetController.getDataDictionary);
router.get('/summary', verifyToken, datasetController.getDatasetSummary);
router.get('/export', verifyToken, datasetController.exportData);
router.get('/:id', verifyToken, datasetController.getRecordById);
router.post('/import', verifyToken, requireRole('ADMIN', 'OFFICER'), upload.single('file'), datasetController.uploadAndImport);

module.exports = router;

