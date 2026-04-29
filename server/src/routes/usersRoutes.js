import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { successResponse } from '../utils/response.js';
import { updateAvailability, updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    successResponse(res, { data: users });
  } catch (error) {
    next(error);
  }
});

router.patch('/availability', protect, updateAvailability);
router.patch('/profile', protect, updateProfile);

export default router;
