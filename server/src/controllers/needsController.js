import Need from '../models/Need.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Create a new need
// @route   POST /api/needs
// @access  Private/NGO_Admin
export const createNeed = async (req, res, next) => {
  try {
    const { title, description, category, location, urgency, peopleAffected } = req.body;

    const need = await Need.create({
      title,
      description,
      category,
      location,
      urgency,
      peopleAffected,
      createdBy: req.user._id
    });

    successResponse(res, { data: need }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all needs
// @route   GET /api/needs
// @access  Private
export const getNeeds = async (req, res, next) => {
  try {
    const { sort, category, status, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category.toLowerCase();
    }
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }
    // Full-text search across title and description
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    let needsQuery = Need.find(query).populate('createdBy', 'name email');

    if (sort === 'priority') {
      needsQuery = needsQuery.sort({ priorityScore: -1 });
    } else if (sort === 'urgency') {
      needsQuery = needsQuery.sort({ urgency: -1 });
    } else if (sort === 'peopleAffected') {
      needsQuery = needsQuery.sort({ peopleAffected: -1 });
    } else {
      needsQuery = needsQuery.sort({ createdAt: -1 });
    }

    const needs = await needsQuery;
    successResponse(res, { data: needs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single need
// @route   GET /api/needs/:id
// @access  Private
export const getNeedById = async (req, res, next) => {
  try {
    const need = await Need.findById(req.params.id).populate('createdBy', 'name email');

    if (need) {
      successResponse(res, { data: need });
    } else {
      errorResponse(res, 'Need not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a need
// @route   PATCH /api/needs/:id
// @access  Private/NGO_Admin
export const updateNeed = async (req, res, next) => {
  try {
    const need = await Need.findById(req.params.id);

    if (!need) {
      return errorResponse(res, 'Need not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    const isOwner = need.createdBy.toString() === req.user._id.toString();
    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Not authorized to update this need', 403);
    }

    // Use findById + save so the pre-save hook recalculates priorityScore
    const allowedFields = ['title', 'description', 'category', 'urgency', 'peopleAffected', 'location', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) need[field] = req.body[field];
    });
    await need.save();

    successResponse(res, { data: need });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a need
// @route   DELETE /api/needs/:id
// @access  Private/NGO_Admin
export const deleteNeed = async (req, res, next) => {
  try {
    const need = await Need.findById(req.params.id);

    if (!need) {
      return errorResponse(res, 'Need not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    const isOwner = need.createdBy.toString() === req.user._id.toString();
    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Not authorized to delete this need', 403);
    }

    await need.deleteOne();
    successResponse(res, { message: 'Need removed' });
  } catch (error) {
    next(error);
  }
};
