import Assignment from '../models/Assignment.js';
import Need from '../models/Need.js';
import Volunteer from '../models/Volunteer.js';
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

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) return errorResponse(res, 'Volunteer not found', 404);
    if (!volunteer.availability) {
      return errorResponse(res, 'Volunteer is not available', 409);
    }

    // Get the score by running match again or receiving it from body, but best to recompute
    const matches = await getMatchesForNeed(needId);
    const matchData = matches.find(m => m.volunteerId.toString() === volunteerId);

    const assignment = await Assignment.create({
      needId,
      volunteerId,
      matchScore: matchData ? matchData.score : 0,
      scoreBreakdown: matchData ? matchData.scoreBreakdown : {},
      status: 'active'
    });

    // Atomic update of need and volunteer
    need.status = 'assigned';
    await need.save();

    volunteer.availability = false;
    await volunteer.save();

    await logAction('CREATE_ASSIGNMENT', req.user._id, 'Assignment', assignment._id, {
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
    const assignments = await Assignment.find()
      .populate('needId', 'title category status')
      .populate({
        path: 'volunteerId',
        populate: { path: 'userId', select: 'name email' }
      });
    
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

    const need = await Need.findById(assignment.needId);
    if (need) {
      need.status = 'completed';
      await need.save();
    }

    const volunteer = await Volunteer.findById(assignment.volunteerId);
    if (volunteer) {
      volunteer.availability = true;
      volunteer.completedCount += 1;
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
