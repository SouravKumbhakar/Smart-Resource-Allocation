import express from 'express';
import { createAssignment, getAssignments, completeAssignment } from '../controllers/assignmentsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getAssignments);

router.post('/assign', protect, authorize('ngo_admin', 'coordinator'), createAssignment);
router.patch('/assign/:id/complete', protect, authorize('ngo_admin', 'coordinator', 'volunteer'), completeAssignment);

export default router;
