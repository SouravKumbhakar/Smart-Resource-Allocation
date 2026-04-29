import User from '../models/User.js';
import Need from '../models/Need.js';
import Assignment from '../models/Assignment.js';
import NGO from '../models/NGO.js';
import { successResponse } from '../utils/response.js';

// @desc    Get platform-wide statistics for landing page
// @route   GET /api/stats
// @access  Public
export const getPlatformStats = async (req, res, next) => {
  try {
    // 1. People Helped: Sum of peopleAffected from completed needs
    const completedNeeds = await Need.find({ status: 'completed', isDeleted: false });
    const peopleHelped = completedNeeds.reduce((sum, need) => sum + (need.peopleAffected || 0), 0);

    // 2. Volunteers Connected: Count of active volunteers
    const volunteersCount = await User.countDocuments({ role: 'volunteer', isDeleted: false });

    // 3. NGOs Connected: Count of active NGOs
    const ngosCount = await NGO.countDocuments({ isDeleted: false });

    // 4. Tasks Completed: Count of completed assignments
    const tasksCompleted = await Assignment.countDocuments({ status: 'completed' });

    successResponse(res, { 
      data: {
        peopleHelped,
        volunteersCount,
        ngosCount,
        tasksCompleted
      } 
    });
  } catch (error) {
    next(error);
  }
};
