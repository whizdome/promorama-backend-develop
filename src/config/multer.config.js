const multer = require('multer');
const httpError = require('http-errors');

const multerUpload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size: 10MB
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'text/csv'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new httpError.BadRequest(
          'Invalid file type. Only JPEG, JPG, PNG, and CSV files are allowed',
        ),
        false,
      );
    }

    return callback(null, true);
  },
});

module.exports = { multerUpload };
