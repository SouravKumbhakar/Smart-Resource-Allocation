import Assignment from '../models/Assignment.js';
import Need from '../models/Need.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getMatchesForNeed } from '../services/matchService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAction } from '../controllers/adminController.js';

// @desc    Assign volunteer to a need
// @route   POST /api/assign
// @access  Private/NGO_Admin
export const createAssignment = async (req, res, next) => {
  try {
    const { needId, volunteerId } = req.body;

    const need = await Need.findById(needId);
    if (!need) return errorResponse(res, 'Need not found', 404);
    if (need.status === 'assigned' || need.status === 'completed') {
      return errorResponse(res, 'Need is already assigned or completed', 409);
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') return errorResponse(res, 'Volunteer not found', 404);
    if (!volunteer.profile?.availability) {
      return errorResponse(res, 'Volunteer is not available', 409);
    }

    const matches = await getMatchesForNeed(needId);
    const matchData = matches.find(m => m.volunteerId.toString() === volunteerId);

    const assignment = await Assignment.create({
      needId,
      volunteerId,
      matchScore: matchData ? matchData.score : 0,
      scoreBreakdown: matchData ? matchData.matchExplanation : [],
      status: 'active'
    });

    // Atomic update of need and volunteer
    need.status = 'assigned';
    await need.save();

    volunteer.profile.availability = false;
    await volunteer.save();

    await Notification.create({
      userId: volunteer._id,
      title: 'New Assignment',
      message: `You have been assigned to: ${need.title}`,
      type: 'assignment_created',
      linkId: assignment._id
    });

    await logAction('ASSIGNMENT_CREATED', req.user._id, 'Assignment', assignment._id, {
      needTitle: need.title, volunteerId, matchScore: assignment.matchScore,
    });

    successResponse(res, { data: assignment }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'volunteer') {
      query.volunteerId = req.user._id;
    } else if (req.user.role === 'ngo_admin' || req.user.role === 'coordinator') {
      // Find all needs belonging to this NGO
      const needs = await Need.find({ ngoId: req.user.profile.assignedNgoId });
      const needIds = needs.map(n => n._id);
      query.needId = { $in: needIds };
    }

    const assignments = await Assignment.find(query)
      .populate('needId', 'title category status')
      .populate('volunteerId', 'name email');
    
    successResponse(res, { data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark assignment as complete
// @route   PATCH /api/assign/:id/complete
// @access  Private
export const completeAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);
    if (assignment.status === 'completed') return errorResponse(res, 'Already completed', 400);

    assignment.status = 'completed';
    assignment.completedAt = Date.now();
    await assignment.save();

    const need = await Need.findById(assignment.needId).populate('ngoId');
    if (need) {
      need.status = 'completed';
      await need.save();
      
      if (need.ngoId) {
        await Notification.create({
          userId: need.ngoId.adminId,
          title: 'Task Completed',
          message: `Volunteer finished task: ${need.title}`,
          type: 'status_updated',
          linkId: assignment._id
        });
      }
    }

    const volunteer = await User.findById(assignment.volunteerId);
    if (volunteer) {
      volunteer.profile.availability = true;
      volunteer.profile.completedCount = (volunteer.profile.completedCount || 0) + 1;
      await volunteer.save();
    }

    await logAction('COMPLETE_ASSIGNMENT', req.user._id, 'Assignment', assignment._id, {
      needId: assignment.needId, volunteerId: assignment.volunteerId,
    });

    successResponse(res, { data: assignment });
  } catch (error) {
    next(error);
  }
};
