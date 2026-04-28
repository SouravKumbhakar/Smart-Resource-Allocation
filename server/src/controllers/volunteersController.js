import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { calculateDistance } from '../utils/geo.js';

// @desc    Get all volunteers
// @route   GET /api/volunteers
// @access  Private
export const getVolunteers = async (req, res, next) => {
  try {
    const { skill, available } = req.query;
    let query = { role: 'volunteer', isDeleted: false };

    if (skill && skill !== 'All') {
      query['profile.skills'] = skill.toLowerCase();
    }
    if (available && available !== 'All') {
      query['profile.availability'] = available === 'Available';
    }

    const volunteers = await User.find(query).select('-passwordHash');
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
    const volunteer = await User.findOne({ _id: req.params.id, role: 'volunteer', isDeleted: false }).select('-passwordHash');

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
    const volunteer = await User.findOne({ _id: req.params.id, role: 'volunteer', isDeleted: false });

    if (!volunteer) {
      return errorResponse(res, 'Volunteer not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    if (volunteer._id.toString() !== req.user._id.toString() && !ADMIN_ROLES.includes(req.user.role)) {
      return errorResponse(res, 'Not authorized to update this profile', 403);
    }

    if (req.body.skills) volunteer.profile.skills = req.body.skills;
    if (req.body.location) volunteer.profile.location = req.body.location;
    if (req.body.availability !== undefined) volunteer.profile.availability = req.body.availability;

    await volunteer.save();

    successResponse(res, { data: volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby volunteers sorted by distance
// @route   GET /api/volunteers/nearby
// @access  Private
export const getNearbyVolunteers = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return errorResponse(res, 'Latitude and Longitude are required', 400);
    }

    const targetLat = parseFloat(lat);
    const targetLng = parseFloat(lng);

    const volunteers = await User.find({ 
      role: 'volunteer', 
      isDeleted: false,
      status: 'active',
      'profile.location.lat': { $exists: true },
      'profile.location.lng': { $exists: true }
    }).select('-passwordHash');

    const volunteersWithDistance = volunteers.map(v => {
      const vObj = v.toObject();
      const distance = calculateDistance(
        targetLat, targetLng,
        v.profile.location.lat, v.profile.location.lng
      );
      return { ...vObj, distance };
    });

    volunteersWithDistance.sort((a, b) => a.distance - b.distance);

    successResponse(res, { data: volunteersWithDistance });
  } catch (error) {
    next(error);
  }
};
