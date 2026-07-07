import Article from '../models/Article.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

// Get all articles
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new article
export const createArticle = async (req, res) => {
  try {
    const { title, excerpt, content } = req.body;
    let imageUrl = req.body.image; // Fallback to URL if provided

    // If a file is uploaded, use Cloudinary
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'articles');
      imageUrl = uploadResult.url;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    const newArticle = new Article({
      title,
      image: imageUrl,
      excerpt,
      content
    });

    await newArticle.save();

    res.status(201).json({
      success: true,
      data: newArticle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update an article
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If a new file is uploaded, update image on Cloudinary
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'articles');
      updateData.image = uploadResult.url;
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedArticle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedArticle = await Article.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
