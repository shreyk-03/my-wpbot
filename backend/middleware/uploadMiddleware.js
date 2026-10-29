const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the temporary uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// disk configuration specifying temporary storage and names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// Accept both modern (.xlsx) and legacy (.xls) Excel workbooks.
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Extension Rejected: Only .xlsx and .xls files are supported.'), false);
  }

  cb(null, true);
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB Upload Limit
  }
});

module.exports = uploadMiddleware;
