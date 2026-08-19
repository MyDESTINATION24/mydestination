import express from 'express';
import { getAllArticles, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import upload from '../../../utils/multer.js';

const router = express.Router();

// Public route to get all articles
router.get('/', getAllArticles);

// Management routes. These were unauthenticated: anyone on the internet
// could publish, rewrite or delete every article on the site, and new
// ones surface on the public landing page.
router.post('/', protect, authorizedRoles('admin', 'superadmin'), upload.single('image'), createArticle);
router.put('/:id', protect, authorizedRoles('admin', 'superadmin'), upload.single('image'), updateArticle);
router.delete('/:id', protect, authorizedRoles('admin', 'superadmin'), deleteArticle);

export default router;
