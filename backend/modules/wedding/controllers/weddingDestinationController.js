import WeddingDestination from '../models/WeddingDestination.js';
import WeddingCategory from '../models/WeddingCategory.js';
import { uploadToCloudinary, uploadBase64ToCloudinary } from '../../../utils/cloudinary.js';

export const getDestinations = async (req, res) => {
  try {
    const destinations = await WeddingDestination.find({ status: 'active' });
    res.status(200).json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid Destination ID' });
    }
    
    let destination;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      destination = await WeddingDestination.findById(id);
    } else {
      // Try slug, or name (case-insensitive)
      destination = await WeddingDestination.findOne({ 
        $or: [
          { slug: id.toLowerCase() },
          { name: { $regex: new RegExp(`^${id}$`, 'i') } }
        ]
      });
    }

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.status(200).json(destination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addDestination = async (req, res) => {
  try {
    const { name, location, category, startingPrice, originalStartingPrice, avgCost, bestSeason, description, image } = req.body;
    
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      try {
        const uploadResponse = await uploadBase64ToCloudinary(image, 'wedding/destinations');
        imageUrl = uploadResponse.url;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed, falling back to saving base64 string directly.', uploadError.message);
        imageUrl = image; // Fallback to storing the base64 string directly
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const newDest = await WeddingDestination.create({
      name,
      slug,
      location,
      category,
      startingPrice,
      // Only stored when it genuinely exceeds the price charged, so a
      // destination cannot advertise a discount it does not give.
      originalStartingPrice:
        Number(originalStartingPrice) > Number(startingPrice) ? Number(originalStartingPrice) : null,
      avgCost,
      bestSeason,
      description,
      image: imageUrl
    });

    res.status(201).json(newDest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.image && updates.image.startsWith('data:image')) {
      try {
        const uploadResponse = await uploadBase64ToCloudinary(updates.image, 'wedding/destinations');
        updates.image = uploadResponse.url;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed, falling back to base64.', uploadError.message);
        // Leave updates.image as the base64 string
      }
    }

    if (updates.originalStartingPrice !== undefined) {
      const orig = Number(updates.originalStartingPrice);
      const existing = await WeddingDestination.findById(id);
      const start = Number(updates.startingPrice !== undefined ? updates.startingPrice : existing?.startingPrice);
      updates.originalStartingPrice = (orig && start && orig > start) ? orig : null;
    }

    const updated = await WeddingDestination.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;
    await WeddingDestination.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Destination deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Category Controllers
export const getCategories = async (req, res) => {
  try {
    const items = await WeddingCategory.find({ status: 'active' });
    res.status(200).json({ success: true, categories: items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, parentCategory, type, image, bgColor, textColor } = req.body;
    
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      try {
        const uploadResponse = await uploadBase64ToCloudinary(image, 'wedding/categories');
        imageUrl = uploadResponse.url;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed for category image, using fallback.', uploadError.message);
        imageUrl = image;
      }
    }

    const newCat = await WeddingCategory.create({
      name, slug, description, icon, parentCategory, type, image: imageUrl, bgColor, textColor
    });
    res.status(201).json({ success: true, category: newCat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.image && updates.image.startsWith('data:image')) {
      try {
        const uploadResponse = await uploadBase64ToCloudinary(updates.image, 'wedding/categories');
        updates.image = uploadResponse.url;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed for category image update, using fallback.', uploadError.message);
      }
    }

    const updated = await WeddingCategory.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ success: true, category: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await WeddingCategory.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
