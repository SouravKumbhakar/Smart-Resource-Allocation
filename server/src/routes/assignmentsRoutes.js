import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  completeAssignment,
  submitAssignment,
  approveAssignment,
  rejectAssignment,
} from '../controllers/assignmentsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAssignments);
router.post('/assign', protect, authorize('ngo_admin', 'coordinator'), createAssignment);
router.patch('/assign/:id/complete', protect, authorize('ngo_admin', 'coordinator', 'volunteer'), completeAssignment);

router.get('/:id', protect, getAssignmentById);
router.patch('/:id/submit', protect, authorize('volunteer'), submitAssignment);
router.patch('/:id/approve', protect, authorize('ngo_admin', 'coordinator'), approveAssignment);
router.patch('/:id/reject', protect, authorize('ngo_admin', 'coordinator'), rejectAssignment);

export default router;
