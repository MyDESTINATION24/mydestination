import mongoose from 'mongoose';

const LandingPageConfigSchema = new mongoose.Schema({
  // 1. Hero Section
  hero: {
    titleLines: { type: [String], default: ["We give you", "strong desire to travel &", "explore the world", "Tourism"] },
    subText: { type: String, default: "Embark on an unforgettable journey to the world's most breathtaking destinations. Discover new cultures, create lasting memories, and let your adventure begin." },
    textBlocks: {
      type: [{
        text: String,
        tag: { type: String, enum: ['h1', 'h2', 'h3', 'p'], default: 'h2' }
      }],
      default: []
    },
    buttonText: { type: String, default: "Explore Our Tours" },
    buttonLink: { type: String, default: "/welcome" },
    backgroundImages: [{ type: String }]
  },

  // 2. Top Destinations
  destinations: {
    sectionTitle: { type: String, default: "Select your perfect trips" },
    sectionHeading: { type: String, default: "TOP DESTINATION" },
    items: [{
      title: String,
      image: String,
      description: String,
      link: String
    }]
  },

  // 3. Latest Tour (Promo)
  latestTour: {
    subtitle: { type: String, default: "Last minute trip" },
    title: { type: String, default: "OUR LATEST TOUR" },
    dateText: { type: String, default: "Fri 15 March to Sun 17 March" },
    priceText: { type: String, default: "$125 per person" },
    buttonText: { type: String, default: "BOOK NOW" },
    buttonLink: { type: String, default: "/welcome" },
    backgroundImage: String,
    leftImage: String,
    rightImage: String
  },

  // 4. Premium Travel & Tours
  travelTips: {
    sectionSubtitle: { type: String, default: "PLAN YOUR JOURNEY" },
    sectionTitle: { type: String, default: "Premium Travel & Tours" },
    description: { type: String, default: "Experience the spiritual awakening of our exclusive Char Dham Yatra packages, or customize your dream destination getaway. We provide end-to-end luxury travel solutions, from comfortable taxi fleets to premium hotel stays." },
    image: { type: String, default: "" },
    buttonText: { type: String, default: "BOOK CAB NOW" },
    bulletPoints: [{ type: String }]
  },

  // 5. Categories
  categories: {
    items: [{
      title: String,
      type: { type: String }, // e.g., 'hotel', 'wedding', 'tour'
      image: String
    }]
  },

  // 5. Services
  services: {
    sectionSubtitle: { type: String, default: "We fulfill your needs" },
    sectionTitle: { type: String, default: "SERVICES" },
    items: [{
      title: String,
      description: String,
      iconUrl: String
    }]
  },

  // 6. About Us
  aboutUs: {
    sectionSubtitle: { type: String, default: "Our featured story" },
    sectionTitle: { type: String, default: "ABOUT US" },
    mainImage: String,
    sideImage: String,
    milestones: [{
      title: String,
      description: String
    }]
  },

  // 7. Our Staff
  staff: {
    sectionSubtitle: { type: String, default: "Tourism members" },
    sectionTitle: { type: String, default: "OUR STAFF" },
    description: { type: String, default: "Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable." },
    backgroundImage: { type: String, default: "" },
    buttonText: { type: String, default: "JOIN NOW" },
    items: [{
      name: String,
      role: String,
      description: String,
      image: String,
      email: String
    }]
  },

  // 8. Phase 4: Intro Video & Facilities
  introVideoAndFacilities: {
    bannerText: { type: String, default: "Destination events success" },
    videoLink: { type: String, default: "" },
    thumbnailImage: { type: String, default: "" },
    facilitiesSubtitle: { type: String, default: "FACILITIES" },
    facilitiesTitle: { type: String, default: "Core Features" },
    features: [{
      title: String,
      description: String,
      iconType: String // e.g. 'Star', 'Moon', 'MapPin'
    }]
  },

  // 8.5 Essential Accessories
  essentialAccessories: {
    sectionSubtitle: { type: String, default: "PREPARE FOR YOUR TRIP" },
    sectionTitle: { type: String, default: "Essential Accessories" },
    description: { type: String, default: "Don't forget to pack the essentials! From capturing beautiful moments with your camera, protecting your eyes with sunglasses, to carrying your belongings safely. We ensure you're fully prepared for the journey ahead." },
    backgroundImage: { type: String, default: "" }
  },

  // 9. Footer
  footer: {
    companyName: { type: String, default: "My DESTINATION" },
    companyDescription: { type: String, default: "Your ultimate companion for unforgettable journeys." },
    address: { type: String, default: "1 My Address, My Street, New York City, NY, USA" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    paymentNote: { type: String, default: "The payment is encrypted and transmitted securely with an SSL protocol." },
    copyrightText: { type: String, default: "" },
    paymentMethods: {
      paypal: { type: Boolean, default: true },
      mastercard: { type: Boolean, default: true },
      visa: { type: Boolean, default: true },
      stripe: { type: Boolean, default: true },
      applepay: { type: Boolean, default: true },
      googlepay: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

const LandingPageConfig = mongoose.model('LandingPageConfig', LandingPageConfigSchema);
export default LandingPageConfig;
