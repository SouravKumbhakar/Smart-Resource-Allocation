import express from 'express';
import { createVolunteerProfile, getVolunteers, getVolunteerById, updateVolunteerProfile } from '../controllers/volunteersController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('volunteer'), createVolunteerProfile)
  .get(protect, getVolunteers);

router.route('/:id')
  .get(protect, getVolunteerById)
  .patch(protect, updateVolunteerProfile);

export default router;
