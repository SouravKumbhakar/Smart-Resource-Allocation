import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return errorResponse(res, 'User already exists', 400);
    }

    // Security: public registration only allows 'volunteer' role.
    // Admin/coordinator accounts must be created by an existing admin.
    const SAFE_PUBLIC_ROLES = ['volunteer'];
    const assignedRole = SAFE_PUBLIC_ROLES.includes(role) ? role : 'volunteer';

    const user = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook hashes it
      role: assignedRole
    });

    if (assignedRole === 'volunteer') {
      import('../models/Volunteer.js').then(({ default: Volunteer }) => {
        Volunteer.create({
          userId: user._id,
          skills: [],
          location: { lat: 0, lng: 0 },
          availability: true,
          completedCount: 0
        }).catch(err => console.error('Failed to create volunteer profile:', err));
      });
    }

    if (user) {
      successResponse(res, {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: generateToken(user._id)
      }, 201);
    } else {
      errorResponse(res, 'Invalid user data', 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      successResponse(res, {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: generateToken(user._id)
      });
    } else {
      errorResponse(res, 'Invalid email or password', 401);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (user) {
      successResponse(res, { user });
    } else {
      errorResponse(res, 'User not found', 404);
    }
  } catch (error) {
    next(error);
  }
};
