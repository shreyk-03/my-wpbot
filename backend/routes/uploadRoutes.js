const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// Multer error handling interceptor wrapped around standard upload process
const handleMulterUpload = (req, res, next) => {
  const upload = uploadMiddleware.single('file');
  
  upload(req, res, (err) => {
    if (err) {
      // In case multer rejects the file or reaches limit boundaries
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error occurred.'
      });
    }
    next();
  });
};

router.post('/', handleMulterUpload, uploadController.uploadExcel);
router.get('/', uploadController.getExcelRecords);

module.exports = router;
