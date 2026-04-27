import express from 'express';
import { createNeed, getNeeds, getNeedById, updateNeed, deleteNeed } from '../controllers/needsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('ngo_admin', 'coordinator'), createNeed)
  .get(protect, getNeeds);

router.route('/:id')
  .get(protect, getNeedById)
  .patch(protect, authorize('ngo_admin', 'coordinator'), updateNeed)
  .delete(protect, authorize('ngo_admin', 'coordinator'), deleteNeed);

export default router;
