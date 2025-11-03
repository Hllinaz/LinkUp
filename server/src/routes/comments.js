import express from 'express';
import { auth, requireAuth } from '../middleware/auth.js';
import {
  getComments,
  createComments
} from '../controllers/commentController.js';

const router = express.Router();

router.use(auth);

router.get('/:id', requireAuth, getComments);
router.post('/:id', requireAuth, createComments);

export default router;