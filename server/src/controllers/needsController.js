import Need from '../models/Need.js';
import AuditLog from '../models/AuditLog.js';
import { successResponse, errorResponse } from '../utils/response.js';

const getTenantFilter = (user) => {
  if (user.role === 'super_admin') return { isDeleted: false };
  if (user.role === 'volunteer') return { isDeleted: false, status: 'open' };
  
  // Enforce isolation: NGO Admins/Coordinators can only query their own NGO
  return { 
    isDeleted: false, 
    ngoId: user.profile?.assignedNgoId 
  };
};

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
      createdBy: req.user._id,
      ngoId: req.user.profile?.assignedNgoId
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
    
    // Strict NGO Isolation
    let query = { ...getTenantFilter(req.user) };

    if (!query.ngoId && req.user.role !== 'super_admin' && req.user.role !== 'volunteer') {
      return errorResponse(res, 'User is not assigned to an NGO', 403);
    }

    if (category && category !== 'All') {
      query.category = category.toLowerCase();
    }
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }
    
    // Full-text search using $text index
    let sortObj = {};
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
      sortObj = { score: { $meta: "textScore" } };
    }

    let needsQuery = Need.find(query).populate('createdBy', 'name email').populate('ngoId', 'name');

    if (!search || !search.trim()) {
      if (sort === 'priority') {
        sortObj = { priorityScore: -1 };
      } else if (sort === 'urgency') {
        sortObj = { urgency: -1 };
      } else if (sort === 'peopleAffected') {
        sortObj = { peopleAffected: -1 };
      } else {
        sortObj = { createdAt: -1 };
      }
    }
    
    needsQuery = needsQuery.sort(sortObj);

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
    const query = { _id: req.params.id, ...getTenantFilter(req.user) };
    const need = await Need.findOne(query).populate('createdBy', 'name email').populate('ngoId', 'name');

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
    const query = { _id: req.params.id, ...getTenantFilter(req.user) };
    const need = await Need.findOne(query);

    if (!need) {
      return errorResponse(res, 'Need not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    const isOwner = need.createdBy.toString() === req.user._id.toString();
    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (!isOwner && !isAdmin && req.user.role !== 'super_admin') {
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
    const query = { _id: req.params.id, ...getTenantFilter(req.user) };
    const need = await Need.findOne(query);

    if (!need) {
      return errorResponse(res, 'Need not found', 404);
    }

    const ADMIN_ROLES = ['ngo_admin', 'coordinator'];
    const isOwner = need.createdBy.toString() === req.user._id.toString();
    const isAdmin = ADMIN_ROLES.includes(req.user.role);

    if (!isOwner && !isAdmin && req.user.role !== 'super_admin') {
      return errorResponse(res, 'Not authorized to delete this need', 403);
    }

    // Soft delete
    need.isDeleted = true;
    need.status = 'completed'; // or whatever soft delete implies logically
    await need.save();
    
    await AuditLog.create({
      action: 'NEED_SOFT_DELETED',
      performedBy: req.user._id,
      targetModel: 'Need',
      targetId: need._id,
      details: { title: need.title }
    });
    successResponse(res, { message: 'Need removed' });
  } catch (error) {
    next(error);
  }
};
