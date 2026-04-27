import User from '../models/User.js';
import Need from '../models/Need.js';
import NGO from '../models/NGO.js';
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
      totalUsers, totalNeeds, totalVolunteersCount, totalAssignments,
      activeNeeds, completedAssignments, highPriorityNeeds,
      availableVolunteers, ngoAdmins,
    ] = await Promise.all([
      User.countDocuments(),
      Need.countDocuments(),
      User.countDocuments({ role: 'volunteer', 'profile.availability': true }), // total volunteers is somewhat combined here
      Assignment.countDocuments(),
      Need.countDocuments({ status: 'open' }),
      Assignment.countDocuments({ status: 'completed' }),
      Need.countDocuments({ urgency: { $gte: 4 }, status: 'open' }),
      User.countDocuments({ role: 'volunteer', 'profile.availability': true }),
      User.countDocuments({ role: 'ngo_admin' }),
    ]);

    const totalVolunteers = totalVolunteersCount; // mapped correctly now

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

    const enriched = users.map(u => {
      const userObj = u.toObject();
      if (u.role === 'volunteer') {
        userObj.volunteerProfile = {
          completedCount: u.profile?.completedCount || 0,
          availability: u.profile?.availability || false,
          skills: u.profile?.skills || []
        };
      }
      return userObj;
    });

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

    // Soft delete user instead of hard delete
    user.isDeleted = true;
    user.status = 'deleted';
    await user.save();

    await logAction('DELETE_USER', req.user._id, 'User', user._id, {
      deletedEmail: user.email, deletedRole: user.role,
    });

    successResponse(res, { message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's status (approve/suspend)
// @route   PATCH /api/admin/users/:id/status
// @access  Super Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['active', 'pending', 'suspended', 'deleted'];

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status: ${status}`, 400);
    }

    if (req.user._id.toString() === req.params.id) {
      return errorResponse(res, 'You cannot change your own status', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    const previousStatus = user.status;
    user.status = status;
    if (status === 'deleted') user.isDeleted = true;
    if (status === 'active') user.isDeleted = false;
    await user.save();

    // If approving NGO admin, also approve the NGO entity
    if (user.role === 'ngo_admin' && status === 'active' && user.profile?.assignedNgoId) {
      const ngo = await NGO.findById(user.profile.assignedNgoId);
      if (ngo) {
        ngo.status = 'active';
        await ngo.save();
        await logAction('NGO_APPROVED', req.user._id, 'NGO', ngo._id, { ngoName: ngo.name });
      }
    }

    // If suspending NGO admin, suspend NGO
    if (user.role === 'ngo_admin' && status === 'suspended' && user.profile?.assignedNgoId) {
      const ngo = await NGO.findById(user.profile.assignedNgoId);
      if (ngo) {
        ngo.status = 'suspended';
        await ngo.save();
        await logAction('NGO_SUSPENDED', req.user._id, 'NGO', ngo._id, { ngoName: ngo.name });
      }
    }

    await logAction('UPDATE_USER_STATUS', req.user._id, 'User', user._id, {
      from: previousStatus, to: status, targetEmail: user.email,
    });

    successResponse(res, { data: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
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
        Need.countDocuments({ ngoId: admin.profile?.assignedNgoId, status: 'completed' }),
        Need.countDocuments({ ngoId: admin.profile?.assignedNgoId, status: 'open' }),
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
