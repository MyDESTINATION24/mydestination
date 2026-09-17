import WeddingVenue from '../models/WeddingVenue.js';

export const getVenues = async (req, res) => {
  try {
    const { destinationId } = req.query;
    const filter = { status: 'approved' };
    if (destinationId) filter.destination = destinationId;
    
    const venues = await WeddingVenue.find(filter)
      .populate('destination', 'name location')
      .sort({ createdAt: -1 });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVenueDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await WeddingVenue.findById(id)
      .populate('destination', 'name location image')
      .populate('vendor', 'name email phone avatar');
    
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    
    res.status(200).json(venue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminVenues = async (req, res) => {
  try {
    const venues = await WeddingVenue.find()
      .populate('destination', 'name location')
      .populate('vendor', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVenueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`📍 Updating Venue Status: ID=${id}, New Status=${status}`);
    console.log('📦 Request Body:', req.body);
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const item = await WeddingVenue.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Venue not found' });
    
    console.log(`✅ Venue status updated successfully`);
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('❌ Error updating venue status:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new venue (Vendor Side)
 */
export const createVenue = async (req, res) => {
  try {
    const { 
      name, 
      destinationId, 
      type, 
      capacity, 
      pricePerDay, 
      description, 
      image, 
      amenities,
      rentalHours,
      cancellationPolicy,
      outsideCatering,
      alcoholPolicy
    } = req.body;

    console.log(`📍 Creating new venue: ${name} for vendor: ${req.user.name}`);

    const venue = await WeddingVenue.create({
      name,
      vendor: req.user._id,
      vendorName: req.user.name,
      destination: destinationId,
      type,
      capacity,
      pricePerDay,
      description,
      image,
      amenities,
      rentalHours,
      cancellationPolicy,
      outsideCatering,
      alcoholPolicy,
      status: 'pending'
    });

    console.log(`✅ Venue created successfully: ${venue._id}`);
    res.status(201).json({ success: true, venue });
  } catch (error) {
    console.error('❌ Create Venue Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get venues for current vendor
 */
export const getVendorVenues = async (req, res) => {
  try {
    const venues = await WeddingVenue.find({ vendor: req.user._id })
      .populate('destination', 'name location')
      .sort({ createdAt: -1 });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update venue (Vendor Side)
 */
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Security: Remove status from update data to prevent self-approval.
    // Ownership and counters are not the vendor's to set either: vendor would
    // hand the venue to another account, the rest fake its popularity.
    ['status', 'vendor', '_id', 'rating', 'reviewCount', 'views', 'shortlistCount', 'createdAt', 'updatedAt']
      .forEach((field) => delete updateData[field]);

    const venue = await WeddingVenue.findOneAndUpdate(
      { _id: id, vendor: req.user._id },
      { ...updateData, status: 'pending' }, // Reset to pending after update
      { new: true }
    );

    if (!venue) return res.status(404).json({ message: 'Venue not found or not authorized' });

    res.status(200).json({ success: true, venue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete venue (Vendor Side)
 */
export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await WeddingVenue.findOneAndDelete({ _id: id, vendor: req.user._id });

    if (!venue) return res.status(404).json({ message: 'Venue not found or not authorized' });

    res.status(200).json({ success: true, message: 'Venue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
