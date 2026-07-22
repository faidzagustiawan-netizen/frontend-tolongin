export interface TaxonomyEntry {
  tag: string;
  query: string;
  platform: string;
  urlTemplate: string;
}

const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/results?search_query=";

export const LEARNING_TAXONOMY: Record<string, TaxonomyEntry> = {
  // IT & Software Engineering
  "React Hooks": {
    tag: "React Hooks",
    query: "React Hooks Advanced Tutorial",
    platform: "FreeCodeCamp / YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}React+Hooks+Advanced+Tutorial+FreeCodeCamp`
  },
  "State Management": {
    tag: "State Management",
    query: "Redux Zustand State Management Tutorial",
    platform: "YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Redux+Zustand+State+Management+Tutorial`
  },
  "System Design": {
    tag: "System Design",
    query: "System Design Interview Concepts",
    platform: "YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}System+Design+Interview+Concepts`
  },
  "Data Structures": {
    tag: "Data Structures",
    query: "Data Structures and Algorithms",
    platform: "Coursera / YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Data+Structures+and+Algorithms`
  },

  // Marketing & Sales
  "SEO On-Page": {
    tag: "SEO On-Page",
    query: "SEO On-Page Certification",
    platform: "HubSpot Academy",
    urlTemplate: "https://academy.hubspot.com/courses/seo-training"
  },
  "Copywriting": {
    tag: "Copywriting",
    query: "Copywriting for Beginners",
    platform: "YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Copywriting+for+Beginners`
  },
  "Facebook Ads": {
    tag: "Facebook Ads",
    query: "Meta Blueprint Facebook Ads",
    platform: "Meta Blueprint",
    urlTemplate: "https://www.facebook.com/business/learn"
  },

  // UI/UX Design
  "Usability Testing": {
    tag: "Usability Testing",
    query: "Usability Testing Guide",
    platform: "NN/g / YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Usability+Testing+Nielsen+Norman+Group`
  },
  "Figma Prototyping": {
    tag: "Figma Prototyping",
    query: "Figma Prototyping Advanced",
    platform: "Figma Learn",
    urlTemplate: "https://help.figma.com/hc/en-us/categories/360002042553-Prototyping"
  },

  // Finance & Data
  "Financial Modeling": {
    tag: "Financial Modeling",
    query: "Financial Modeling Fundamentals",
    platform: "Corporate Finance Institute",
    urlTemplate: "https://corporatefinanceinstitute.com/"
  },
  "SQL Joins": {
    tag: "SQL Joins",
    query: "SQL Joins Tutorial DataCamp",
    platform: "DataCamp / YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}SQL+Joins+Tutorial`
  },

  // Soft Skills
  "Leadership": {
    tag: "Leadership",
    query: "Leadership Skills Training",
    platform: "LinkedIn Learning / YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Leadership+Skills+Training`
  },
  "Communication": {
    tag: "Communication",
    query: "Effective Professional Communication",
    platform: "YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}Effective+Professional+Communication`
  }
};

/**
 * Mendapatkan rekomendasi belajar berdasarkan kelemahan (tag)
 */
export function getLearningRecommendation(weaknessTag: string): TaxonomyEntry {
  // Jika tag ditemukan di taxonomy, kembalikan.
  // Pencarian bisa dibuat case-insensitive.
  const entryKey = Object.keys(LEARNING_TAXONOMY).find(
    k => k.toLowerCase() === weaknessTag.toLowerCase()
  );

  if (entryKey) {
    return LEARNING_TAXONOMY[entryKey];
  }

  // Fallback default jika tag tidak ada di kamus
  return {
    tag: weaknessTag,
    query: `${weaknessTag} Tutorial Lengkap`,
    platform: "YouTube",
    urlTemplate: `${DEFAULT_YOUTUBE_URL}${encodeURIComponent(weaknessTag + " Tutorial")}`
  };
}
