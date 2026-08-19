import express from 'express';
import { getAllBlogs, createBlog, updateBlog, deleteBlog } from '../controllers/blogController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import upload from '../../../utils/multer.js';

const router = express.Router();

// Public route to get all blogs
router.get('/', getAllBlogs);

// Management routes. These were unauthenticated: anyone on the internet
// could publish, rewrite or delete every blog on the site, and new
// ones surface on the public landing page.
router.post('/', protect, authorizedRoles('admin', 'superadmin'), upload.single('image'), createBlog);
router.put('/:id', protect, authorizedRoles('admin', 'superadmin'), upload.single('image'), updateBlog);
router.delete('/:id', protect, authorizedRoles('admin', 'superadmin'), deleteBlog);

export default router;

