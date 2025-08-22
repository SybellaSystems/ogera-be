
// cloudinary config


// multer middleware
const multer = require('multer');
const path = require('path');

module.exports = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== '.png') {
      cb(new Error('File type is not supported'), false);
      return;
    }
    cb(null, true);
  }
});


// router
const router = require('express').Router();
const cloudinary = require('../utils/cloudinary');
const upload = require('../utils/multer');
const path = require('path');

router.post('/', upload.single('image'), async (req, res) => {
    console.log('req.file:', req.file);

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const absolutePath = path.resolve(req.file.path);
        console.log("Uploading:", absolutePath);

        const result = await cloudinary.uploader.upload(absolutePath, {
            resource_type: "auto",
        });

        res.json(result);
    } catch (error) {
        console.error("Cloudinary error:", error);
        res.status(500).json({ error: 'Upload failed', details: error });
    }
});

module.exports = router;