import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationsController.js';
import { protect, requireActive } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireActive);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .patch(markAllAsRead);

router.route('/:id/read')
  .patch(markAsRead);

export default router;
