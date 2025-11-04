import express from 'express';
import { auth, requireAuth} from '../middleware/auth.js';
import {
    getRecommendations,
    getCommunities,
    getTop,
    getGraph
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(auth);

router.get('/recommendations', requireAuth, getRecommendations)
router.get('/communities', getCommunities)
router.get('/top', requireAuth, getTop);
router.get('/graph/:username', getGraph);


export default router;