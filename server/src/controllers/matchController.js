import { getMatchesForNeed } from '../services/matchService.js';
import { successResponse, errorResponse } from '../utils/response.js';

// @desc    Get matches for a specific need
// @route   POST /api/match/:needId
// @access  Private/NGO_Admin
export const getMatches = async (req, res, next) => {
  try {
    const matches = await getMatchesForNeed(req.params.needId);
    successResponse(res, { matches });
  } catch (error) {
    if (error.message === 'Need not found') {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};
