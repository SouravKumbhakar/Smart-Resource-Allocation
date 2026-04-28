import Assignment from '../models/Assignment.js';
import Need from '../models/Need.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getMatchesForNeed } from '../services/matchService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAction } from '../controllers/adminController.js';

// @desc    Assign volunteer to a need
// @route   POST /api/assignments/assign
// @access  Private/NGO_Admin, Coordinator
export const createAssignment = async (req, res, next) => {
  try {
    const { needId, volunteerId } = req.body;
    const need = await Need.findById(needId);
    if (!need) return errorResponse(res, 'Need not found', 404);
    if (need.status === 'assigned' || need.status === 'completed')
      return errorResponse(res, 'Need is already assigned or completed', 409);

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') return errorResponse(res, 'Volunteer not found', 404);
    if (!volunteer.profile?.availability) return errorResponse(res, 'Volunteer is not available', 409);

    const matches = await getMatchesForNeed(needId);
    const matchData = matches.find(m => m.volunteerId.toString() === volunteerId);

    const assignment = await Assignment.create({
      needId, volunteerId,
      matchScore: matchData ? matchData.score : 0,
      scoreBreakdown: matchData ? matchData.matchExplanation : [],
      status: 'active'
    });

    need.status = 'assigned';
    need.assignedVolunteerId = volunteerId;
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
  } catch (error) { next(error); }
};

// @desc    Get all assignments (role-scoped)
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'volunteer') {
      query.volunteerId = req.user._id;
    } else if (req.user.role === 'ngo_admin' || req.user.role === 'coordinator') {
      const needs = await Need.find({ ngoId: req.user.profile.assignedNgoId });
      const needIds = needs.map(n => n._id);
      query.needId = { $in: needIds };
    }
    const assignments = await Assignment.find(query)
      .populate('needId', 'title description category status urgency peopleAffected location assignedVolunteerId')
      .populate('volunteerId', 'name email');
    successResponse(res, { data: assignments });
  } catch (error) { next(error); }
};

// @desc    Get single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('needId', 'title description category status urgency peopleAffected location assignedVolunteerId createdAt')
      .populate('volunteerId', 'name email profile');
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);
    if (req.user.role === 'volunteer' && assignment.volunteerId._id.toString() !== req.user._id.toString())
      return errorResponse(res, 'Not authorized', 403);
    successResponse(res, { data: assignment });
  } catch (error) { next(error); }
};

// @desc    Volunteer submits task proof
// @route   PATCH /api/assignments/:id/submit
// @access  Private/Volunteer
export const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);
    if (assignment.volunteerId.toString() !== req.user._id.toString())
      return errorResponse(res, 'Not authorized', 403);
    if (assignment.status !== 'active')
      return errorResponse(res, 'Assignment is not in an active state', 400);

    const { text, images = [] } = req.body;
    if (!text?.trim()) return errorResponse(res, 'Submission text is required', 400);

    assignment.submission = { text: text.trim(), images, submittedAt: new Date() };
    assignment.status = 'submitted';
    assignment.adminFeedback = undefined;
    await assignment.save();

    const need = await Need.findById(assignment.needId).populate('ngoId');
    if (need?.ngoId?.adminId) {
      await Notification.create({
        userId: need.ngoId.adminId,
        title: 'Task Submitted for Review',
        message: `A volunteer submitted proof for: ${need.title}`,
        type: 'status_updated',
        linkId: assignment._id
      });
    }

    await logAction('ASSIGNMENT_SUBMITTED', req.user._id, 'Assignment', assignment._id, { needId: assignment.needId });
    successResponse(res, { data: assignment });
  } catch (error) { next(error); }
};

// @desc    Admin approves submitted assignment
// @route   PATCH /api/assignments/:id/approve
// @access  Private/NGO_Admin, Coordinator
export const approveAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);
    if (assignment.status !== 'submitted')
      return errorResponse(res, 'Assignment is not in submitted state', 400);

    assignment.status = 'completed';
    assignment.completedAt = new Date();
    await assignment.save();

    const need = await Need.findById(assignment.needId).populate('ngoId');
    if (need) {
      need.status = 'completed';
      need.completedAt = new Date();
      await need.save();
      if (need.ngoId?.adminId) {
        await Notification.create({
          userId: need.ngoId.adminId,
          title: 'Task Completed',
          message: `Task approved and completed: ${need.title}`,
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

    await Notification.create({
      userId: assignment.volunteerId,
      title: 'Task Approved!',
      message: `Your submission was approved for: ${need?.title}`,
      type: 'status_updated',
      linkId: assignment._id
    });

    await logAction('ASSIGNMENT_APPROVED', req.user._id, 'Assignment', assignment._id, {
      needId: assignment.needId, volunteerId: assignment.volunteerId,
    });
    successResponse(res, { data: assignment });
  } catch (error) { next(error); }
};

// @desc    Admin rejects submitted assignment
// @route   PATCH /api/assignments/:id/reject
// @access  Private/NGO_Admin, Coordinator
export const rejectAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResponse(res, 'Assignment not found', 404);
    if (assignment.status !== 'submitted')
      return errorResponse(res, 'Assignment is not in submitted state', 400);

    const { feedback } = req.body;
    assignment.status = 'active';
    assignment.adminFeedback = feedback || 'Your submission was rejected. Please resubmit.';
    assignment.submission = undefined;
    await assignment.save();

    await Notification.create({
      userId: assignment.volunteerId,
      title: 'Submission Rejected',
      message: assignment.adminFeedback,
      type: 'status_updated',
      linkId: assignment._id
    });

    await logAction('ASSIGNMENT_REJECTED', req.user._id, 'Assignment', assignment._id, { feedback });
    successResponse(res, { data: assignment });
  } catch (error) { next(error); }
};

// @desc    Mark assignment complete (legacy direct route)
// @route   PATCH /api/assignments/assign/:id/complete
// @access  Private/NGO_Admin, Coordinator
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
      need.completedAt = Date.now();
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
  } catch (error) { next(error); }
};
