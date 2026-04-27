import Volunteer from '../models/Volunteer.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Create volunteer profile
// @route   POST /api/volunteers
// @access  Private/Volunteer
export const createVolunteerProfile = async (req, res, next) => {
  try {
    const { skills, location, availability } = req.body;

    const existingProfile = await Volunteer.findOne({ userId: req.user._id });

    if (existingProfile) {
      return errorResponse(res, 'Volunteer profile already exists', 400);
    }

    const volunteer = await Volunteer.create({
      userId: req.user._id,
      skills,
      location,
      availability
    });

    successResponse(res, { data: volunteer }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all volunteers
// @route   GET /api/volunteers
// @access  Private
export const getVolunteers = async (req, res, next) => {
  try {
    const { skill, available } = req.query;
    let query = {};

    if (skill && skill !== 'All') {
      query.skills = skill.toLowerCase();
    }
    if (available && available !== 'All') {
      query.availability = available === 'Available';
    }

    const volunteers = await Volunteer.find(query).populate('userId', 'name email');
    successResponse(res, { data: volunteers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer by ID
// @route   GET /api/volunteers/:id
// @access  Private
export const getVolunteerById = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).populate('userId', 'name email');

    if (volunteer) {
      successResponse(res, { data: volunteer });
    } else {
      errorResponse(res, 'Volunteer not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update volunteer profile
// @route   PATCH /api/volunteers/:id
// @access  Private
export const updateVolunteerProfile = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return errorResponse(res, 'Volunteer not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    if (volunteer.userId.toString() !== req.user._id.toString() && !ADMIN_ROLES.includes(req.user.role)) {
      return errorResponse(res, 'Not authorized to update this profile', 403);
    }

    const updatedVolunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    successResponse(res, { data: updatedVolunteer });
  } catch (error) {
    next(error);
  }
};
