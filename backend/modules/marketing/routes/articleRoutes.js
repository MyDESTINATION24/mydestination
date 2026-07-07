import express from 'express';
import { getAllArticles, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';
import upload from '../../../utils/multer.js';

const router = express.Router();

// Public route to get all articles
router.get('/', getAllArticles);

// Management routes
router.post('/', upload.single('image'), createArticle);
router.put('/:id', upload.single('image'), updateArticle);
router.delete('/:id', deleteArticle);

export default router;
