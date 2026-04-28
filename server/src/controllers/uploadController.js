import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { successResponse, errorResponse } from '../utils/response.js';

// Cloudinary is auto-configured from CLOUDINARY_URL env var
// No manual config needed — the SDK reads CLOUDINARY_URL automatically

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// @desc    Upload an image to Cloudinary
// @route   POST /api/upload
// @access  Private (any authenticated role)
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file provided', 400);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'reliefops/submissions', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    successResponse(res, { url: result.secure_url }, 200);
  } catch (error) {
    next(error);
  }
};
