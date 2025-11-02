import express from 'express';
import { auth, requireAuth } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import { 
  getPosts, 
  createPost, 
  getPost, 
  deletePost 
} from '../controllers/postController.js';

const router = express.Router();

router.use(auth);

router.get('/', requireAuth, getPosts);
router.post('/', requireAuth, upload.single('file'), createPost);
router.get('/:id', requireAuth, getPost);
router.delete('/:id', requireAuth, deletePost);

export default router;