import mongoose from 'mongoose';

const LandingPageConfigSchema = new mongoose.Schema({
  // 1. Hero Section
  hero: {
    titleLines: { type: [String], default: ["Experience", "Unforgettable", "travel", "Experiences"] },
    subText: { type: String, default: "Find amazing things to do. Anytime, anywhere." },
    buttonText: { type: String, default: "Explore Our Tours" },
    buttonLink: { type: String, default: "/welcome" }
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

  // 4. Categories
  categories: {
    items: [{
      title: String,
      type: String, // e.g., 'hotel', 'wedding', 'tour'
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
    milestones: [{
      title: String,
      description: String
    }]
  },

  // 7. Our Staff
  staff: {
    sectionTitle: { type: String, default: "OUR STAFF" },
    description: { type: String, default: "Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable." },
    items: [{
      name: String,
      role: String,
      description: String,
      image: String
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

  // 9. Footer
  footer: {
    companyName: { type: String, default: "My DESTINATION" },
    companyDescription: { type: String, default: "Your ultimate companion for unforgettable journeys." },
    address: { type: String, default: "1 My Address, My Street, New York City, NY, USA" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    paymentNote: { type: String, default: "The payment is encrypted and transmitted securely with an SSL protocol." },
    copyrightText: { type: String, default: "" }
  }
}, { timestamps: true });

const LandingPageConfig = mongoose.model('LandingPageConfig', LandingPageConfigSchema);
export default LandingPageConfig;
