import express from 'express';
import { getVolunteers, getVolunteerById, updateVolunteerProfile, getNearbyVolunteers } from '../controllers/volunteersController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/nearby', protect, getNearbyVolunteers);

router.route('/')
  .get(protect, getVolunteers);

router.route('/:id')
  .get(protect, getVolunteerById)
  .patch(protect, updateVolunteerProfile);

export default router;
