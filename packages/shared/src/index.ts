// ============================================
// CartPick Shared Constants & Utilities
// ============================================

// --- Constants ---

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const REVIEW_BODY_MIN_LENGTH = 10;
export const REVIEW_BODY_MAX_LENGTH = 2000;
export const REVIEW_TITLE_MAX_LENGTH = 100;

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const SUPPORTED_COUNTRY_CODES = ['KR'] as const;

export const CATEGORY_MAX_DEPTH = 2;

// --- Sort Options ---

export const PRODUCT_SORT_OPTIONS = [
  'rating',
  'review_count',
  'newest',
] as const;

export const REVIEW_SORT_OPTIONS = [
  'newest',
  'helpful',
  'rating_high',
  'rating_low',
] as const;

export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];
export type ReviewSortOption = (typeof REVIEW_SORT_OPTIONS)[number];

// --- Utilities ---

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
