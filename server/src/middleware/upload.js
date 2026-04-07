const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPG, PNG and WEBP files are allowed'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
