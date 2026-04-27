import User from '../models/User.js';
import NGO from '../models/NGO.js';
import AuditLog from '../models/AuditLog.js';
import generateToken from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, inviteCode, profile } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, 'User already exists', 400);
    }

    if (role === 'coordinator') {
      return errorResponse(res, 'Coordinators must be provisioned by an NGO Admin.', 403);
    }

    let assignedRole = role || 'volunteer';
    let status = 'active';

    if (assignedRole === 'super_admin') {
      if (inviteCode !== process.env.SUPER_ADMIN_SECRET) {
        return errorResponse(res, 'Invalid admin invite code', 403);
      }
      status = 'active';
    } else if (assignedRole === 'ngo_admin') {
      status = 'pending';
    } else if (assignedRole === 'volunteer') {
      status = 'active';
    } else {
      assignedRole = 'volunteer';
      status = 'active';
    }

    const userProfile = profile || {};
    if (assignedRole === 'volunteer') {
      userProfile.availability = true;
      userProfile.completedCount = 0;
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: assignedRole,
      status,
      profile: userProfile
    });

    if (assignedRole === 'ngo_admin' && profile?.organizationName) {
      const ngo = await NGO.create({
        name: profile.organizationName,
        location: profile.organizationLocation || 'Global',
        contactNumber: profile.contactNumber || '',
        adminId: user._id,
        status: 'pending'
      });
      user.profile.assignedNgoId = ngo._id;
      await user.save();
    }

    await AuditLog.create({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      targetModel: 'User',
      targetId: user._id,
      details: { role: assignedRole, status }
    });

    if (user) {
      successResponse(res, {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
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

    if (!user || !(await user.matchPassword(password))) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (user.isDeleted) {
      return errorResponse(res, 'Account disabled', 403);
    }

    if (user.status === 'suspended') {
      return errorResponse(res, 'Account suspended. Contact support.', 403);
    }

    successResponse(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      token: generateToken(user._id)
    });
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
