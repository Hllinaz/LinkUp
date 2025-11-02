import express from 'express';
import { auth, requireAuth } from '../middleware/auth.js';
import {
  getComments,
  createComments
} from '../controllers/commentController.js';

const router = express.Router();

router.use(auth);

router.post('/:id', requireAuth, getComments);
router.post('/', requireAuth, createComments);

export default router;