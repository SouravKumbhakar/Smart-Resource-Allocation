import User from '../models/User.js';
import Need from '../models/Need.js';
import Volunteer from '../models/Volunteer.js';
import Assignment from '../models/Assignment.js';
import AuditLog from '../models/AuditLog.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Helper: log an action to AuditLog
export const logAction = async (action, performedBy, targetModel, targetId, details = {}) => {
  try {
    await AuditLog.create({ action, performedBy, targetModel, targetId, details });
  } catch (err) {
    console.error('[AuditLog] Failed to write:', err.message);
  }
};

// @desc    Get system-wide KPI stats
// @route   GET /api/admin/stats
// @access  Super Admin
export const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalNeeds, totalVolunteers, totalAssignments,
      activeNeeds, completedAssignments, highPriorityNeeds,
      availableVolunteers, ngoAdmins,
    ] = await Promise.all([
      User.countDocuments(),
      Need.countDocuments(),
      Volunteer.countDocuments(),
      Assignment.countDocuments(),
      Need.countDocuments({ status: 'open' }),
      Assignment.countDocuments({ status: 'completed' }),
      Need.countDocuments({ urgency: { $gte: 4 }, status: 'open' }),
      Volunteer.countDocuments({ availability: true }),
      User.countDocuments({ role: 'ngo_admin' }),
    ]);

    const completionRate = totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    // Need trends by category
    const needsByCategory = await Need.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Assignment trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const assignmentTrend = await Assignment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    successResponse(res, {
      data: {
        overview: {
          totalUsers, totalNeeds, totalVolunteers, totalAssignments,
          activeNeeds, completedAssignments, highPriorityNeeds,
          availableVolunteers, ngoAdmins, completionRate,
        },
        needsByCategory,
        assignmentTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with full details
// @route   GET /api/admin/users
// @access  Super Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    // Enrich volunteers with completedCount
    const enriched = await Promise.all(users.map(async u => {
      const userObj = u.toObject();
      if (u.role === 'volunteer') {
        const vol = await Volunteer.findOne({ userId: u._id }).select('completedCount availability skills');
        userObj.volunteerProfile = vol || null;
      }
      return userObj;
    }));

    successResponse(res, { data: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role
// @route   PATCH /api/admin/users/:id/role
// @access  Super Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const VALID_ROLES = ['volunteer', 'ngo_admin', 'coordinator', 'super_admin'];

    if (!VALID_ROLES.includes(role)) {
      return errorResponse(res, `Invalid role: ${role}`, 400);
    }

    // Prevent demotion of the last super_admin
    if (req.user._id.toString() === req.params.id) {
      return errorResponse(res, 'You cannot change your own role', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAction('UPDATE_USER_ROLE', req.user._id, 'User', user._id, {
      from: previousRole, to: role, targetEmail: user.email,
    });

    successResponse(res, { data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Super Admin
export const deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Also clean up volunteer profile if exists
    await Volunteer.deleteOne({ userId: user._id });
    await user.deleteOne();

    await logAction('DELETE_USER', req.user._id, 'User', user._id, {
      deletedEmail: user.email, deletedRole: user.role,
    });

    successResponse(res, { message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs (paginated)
// @route   GET /api/admin/audit-logs
// @access  Super Admin
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    successResponse(res, {
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get NGO performance metrics
// @route   GET /api/admin/ngo-performance
// @access  Super Admin
export const getNgoPerformance = async (req, res, next) => {
  try {
    // Get all ngo_admin users
    const ngoAdmins = await User.find({ role: 'ngo_admin' }).select('-passwordHash');

    const performance = await Promise.all(ngoAdmins.map(async admin => {
      const needs = await Need.find({ createdBy: admin._id });
      const needIds = needs.map(n => n._id);

      const [totalNeeds, completedNeeds, activeNeeds, assignments] = await Promise.all([
        Promise.resolve(needs.length),
        Need.countDocuments({ createdBy: admin._id, status: 'completed' }),
        Need.countDocuments({ createdBy: admin._id, status: 'open' }),
        Assignment.find({ needId: { $in: needIds } }).populate('needId', 'title'),
      ]);

      const completionRate = totalNeeds > 0
        ? Math.round((completedNeeds / totalNeeds) * 100)
        : 0;

      const totalPeopleImpacted = needs.reduce((sum, n) => sum + (n.peopleAffected || 0), 0);

      return {
        admin: { id: admin._id, name: admin.name, email: admin.email },
        metrics: {
          totalNeeds, completedNeeds, activeNeeds,
          completionRate, totalPeopleImpacted,
          totalAssignments: assignments.length,
        },
      };
    }));

    successResponse(res, { data: performance });
  } catch (error) {
    next(error);
  }
};
