import express from 'express';
import { auth, requireAuth } from '../middleware/auth.js';
import { 
    getUser,
    isFollowing,
    Follow,
    Unfollow,
    isMe,
    getMe,
    putMe,
    getInterests,
    createInterests
} from '../controllers/userController.js';

const router = express.Router();

router.use(auth);

router.get('/me/interests', requireAuth, getInterests);
router.put('/me/interests', requireAuth, createInterests);
router.get('/me/:id', requireAuth, isMe);
router.get('/follow/:id', requireAuth, isFollowing);
router.post('/follow/:id', requireAuth, Follow);
router.delete('/follow/:id', requireAuth, Unfollow);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, putMe);
router.get('/:id', getUser);

export default router;