import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Update user availability
// @route   PATCH /api/users/availability
// @access  Private
export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    
    if (typeof availability !== 'boolean') {
      return errorResponse(res, 'Availability must be a boolean', 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 'User not found', 404);

    user.profile.availability = availability;
    await user.save();

    successResponse(res, { 
      message: 'Availability updated', 
      data: { availability: user.profile.availability } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (skills, etc.)
// @route   PATCH /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { skills, profileComplete, contactNumber, address, city } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (skills !== undefined) {
      // Validate skills array format
      if (!Array.isArray(skills)) {
        return errorResponse(res, 'Skills must be an array', 400);
      }
      user.profile.skills = skills;
    }

    if (profileComplete !== undefined) user.profile.profileComplete = profileComplete;
    if (contactNumber !== undefined) user.profile.contactNumber = contactNumber;
    if (address !== undefined) user.profile.address = address;
    if (city !== undefined) user.profile.city = city;

    await user.save();

    successResponse(res, { 
      message: 'Profile updated', 
      data: user 
    });
  } catch (error) {
    next(error);
  }
};
