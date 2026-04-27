import express from 'express';
import { getMatches } from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/:needId')
  .post(protect, authorize('ngo_admin', 'coordinator'), getMatches);

export default router;
