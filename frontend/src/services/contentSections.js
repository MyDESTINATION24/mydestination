import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../shared/api/runtimeConfig';

// Homepage/navbar content sections (Blogs, Articles and any the CMS adds).
// Header and landing page both need them, so one request is shared.

// Shown until the API answers (and if it fails), so the navbar never renders
// without the tabs it always had.
export const DEFAULT_CONTENT_SECTIONS = [
  { _id: 'articles', kind: 'articles', slug: 'articles', navLabel: 'Articles', showInNav: true, showOnHome: true, order: 10,
    subtitle: 'Reads & Deep Dives', title: 'Travel Articles',
    description: 'Longer reads on destinations, culture and planning, written by our editors.', buttonText: 'Explore All Articles', homeLimit: 3 },
  { _id: 'blogs', kind: 'blogs', slug: 'blogs', navLabel: 'Blogs', showInNav: true, showOnHome: true, order: 20,
    subtitle: 'Stories & Insights', title: 'Latest Blogs & Travel Hacks',
    description: 'Handpicked travel guides, stay tips, and smart booking hacks from our team.', buttonText: 'Explore All Blogs', homeLimit: 3 },
];

let cachedPromise = null;

export const fetchContentSections = ({ force = false } = {}) => {
  if (!cachedPromise || force) {
    cachedPromise = axios.get(`${API_BASE_URL}/content-sections`)
      .then((res) => (res.data?.success && Array.isArray(res.data.data) ? res.data.data : DEFAULT_CONTENT_SECTIONS))
      .catch(() => {
        cachedPromise = null; // retry on next mount
        return DEFAULT_CONTENT_SECTIONS;
      });
  }
  return cachedPromise;
};

export const useContentSections = () => {
  const [sections, setSections] = useState(DEFAULT_CONTENT_SECTIONS);
  useEffect(() => {
    let alive = true;
    fetchContentSections().then((data) => { if (alive) setSections(data); });
    return () => { alive = false; };
  }, []);
  return sections;
};

/** Where a section's tab and "explore all" button lead. */
export const sectionPath = (section) => (
  section.kind === 'custom' ? `/sections/${section.slug}` : `/${section.slug}`
);

export const sectionItemPath = (section, itemId) => (
  section.kind === 'custom' ? `/sections/${section.slug}/${itemId}` : `/${section.slug}/${itemId}`
);
