const FAVOURITES_KEY = "wedding_fav_destinations";

export const budgetBuckets = [
  { label: "Intimate", range: "₹5L – ₹15L", description: "Perfect for small, intimate gatherings up to 100 guests" },
  { label: "Classic", range: "₹15L – ₹40L", description: "A beautiful celebration with 100–300 guests" },
  { label: "Grand", range: "₹40L – ₹1Cr", description: "A lavish affair with premium venues and 300+ guests" },
  { label: "Royal", range: "₹1Cr+", description: "No limits — palace weddings, celebrity planners, the works" },
];

export const getFavourites = () => {
  try { return JSON.parse(localStorage.getItem(FAVOURITES_KEY) || "[]"); }
  catch { return []; }
};

export const formatPrice = (price) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) {
    const lakhs = price / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return `₹${Number(price || 0).toLocaleString("en-IN")}`;
};
