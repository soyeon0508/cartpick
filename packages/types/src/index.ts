// ============================================
// CartPick Shared Type Definitions
// ============================================

// --- Enums ---

export enum RetailerType {
  CONVENIENCE_STORE = 'convenience_store',
  SUPERMARKET = 'supermarket',
  WAREHOUSE = 'warehouse',
  ONLINE = 'online',
}

export enum LaunchStatus {
  ACTIVE = 'active',
  COMING_SOON = 'coming_soon',
  INACTIVE = 'inactive',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum ModerationStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  HIDDEN = 'hidden',
  REJECTED = 'rejected',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum SocialProvider {
  KAKAO = 'kakao',
  APPLE = 'apple',
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FALSE_INFO = 'false_info',
  ADVERTISEMENT = 'advertisement',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum SourceType {
  MANUAL = 'manual',
  CRAWLED = 'crawled',
  USER_SUBMITTED = 'user_submitted',
}

// --- GTM Enums ---

export enum BadgeCode {
  FIRST_REVIEWER = 'first_reviewer',
  EARLY_ADOPTER = 'early_adopter',
  TOP_REVIEWER = 'top_reviewer',
  HELPFUL_REVIEWER = 'helpful_reviewer',
}

export enum NotificationType {
  REVIEW_LIKED = 'review_liked',
  BADGE_AWARDED = 'badge_awarded',
  NEW_PRODUCT = 'new_product',
  REVIEW_REPLY = 'review_reply',
}

export enum AnalyticsEventType {
  PRODUCT_VIEWED = 'product_viewed',
  REVIEW_COMPOSE_STARTED = 'review_compose_started',
  REVIEW_SUBMITTED = 'review_submitted',
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULT_CLICKED = 'search_result_clicked',
  RETAILER_VIEWED = 'retailer_viewed',
  CATEGORY_VIEWED = 'category_viewed',
}

// --- Domain Types ---

export interface Country {
  id: number;
  code: string;
  nameKo: string;
  nameEn: string;
  currencyCode: string;
  languageCode: string;
  isActive: boolean;
}

export interface Retailer {
  id: number;
  countryId: number;
  name: string;
  slug: string;
  retailerType: RetailerType;
  logoUrl: string | null;
  launchStatus: LaunchStatus;
  displayOrder: number;
  isActive: boolean;
}

export interface Brand {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  countryId: number;
  parentId: number | null;
  name: string;
  slug: string;
  depth: number;
  displayOrder: number;
  iconUrl: string | null;
  isActive: boolean;
}

export interface Product {
  id: number;
  countryId: number;
  brandId: number;
  categoryId: number;
  name: string;
  normalizedName: string;
  summaryLine: string | null;
  description: string | null;
  imageUrl: string | null;
  barcode: string | null;
  volumeValue: number | null;
  volumeUnit: string | null;
  packageType: string | null;
  status: ProductStatus;
  reviewCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerProduct {
  id: number;
  retailerId: number;
  productId: number;
  retailerProductName: string | null;
  retailerProductUrl: string | null;
  price: number | null;
  salePrice: number | null;
  currencyCode: string;
  isAvailable: boolean;
  isNew: boolean;
  isLimited: boolean;
  sourceType: SourceType;
  lastSyncedAt: string | null;
}

export interface User {
  id: number;
  email: string | null;
  socialProvider: SocialProvider;
  socialId: string;
  nickname: string;
  profileImageUrl: string | null;
  countryId: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ReviewTagCode {
  TASTE_GOOD = 'taste_good',
  TASTE_BAD = 'taste_bad',
  TASTE_SWEET = 'taste_sweet',
  TASTE_SPICY = 'taste_spicy',
  VALUE_GOOD = 'value_good',
  VALUE_BAD = 'value_bad',
  AMOUNT_LARGE = 'amount_large',
  AMOUNT_SMALL = 'amount_small',
  REPURCHASE_YES = 'repurchase_yes',
  CONTROVERSIAL = 'controversial',
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  retailerId: number | null;
  rating: number;
  title: string | null;
  body: string;
  tags: ReviewTagCode[];
  repurchaseIntent: boolean;
  moderationStatus: ModerationStatus;
  reportedCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  retailerId?: number | null;
  rating: number;
  body?: string;
  tags?: ReviewTagCode[];
}

export interface CreateReviewResponse {
  review: Pick<Review, 'id' | 'rating' | 'body' | 'tags' | 'repurchaseIntent' | 'createdAt'>;
  awardedBadges: Array<{
    code: BadgeCode;
    name: string;
    iconUrl: string | null;
  }>;
}

// --- API Response Types ---

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}

export interface ProductDetailResponse {
  product: Product & {
    brand: Pick<Brand, 'id' | 'name' | 'logoUrl'>;
    category: Pick<Category, 'id' | 'name'>;
    ratingDistribution: Record<number, number>;
    averageScores: {
      taste: number;
      value: number;
      amount: number;
    };
    tagCounts: Record<string, number>;
    repurchaseRate: number;
    myReview: {
      exists: boolean;
      reviewId: number | null;
    };
    retailers: Array<{
      retailerId: number;
      retailerName: string;
      price: number | null;
      salePrice: number | null;
      isAvailable: boolean;
      isNew: boolean;
      reviewCountFromHere: number;
    }>;
  };
}

export interface ReviewListResponse {
  reviews: Array<
    Review & {
      user: Pick<User, 'id' | 'nickname' | 'profileImageUrl'> & {
        badges: BadgeCode[];
      };
      retailer: Pick<Retailer, 'id' | 'name'> | null;
      isLikedByMe: boolean;
    }
  >;
  pagination: {
    nextCursor: string | null;
    hasNext: boolean;
  };
  summary: {
    totalCount: number;
    filteredCount: number;
  };
}

// --- GTM Domain Types ---

export interface BadgeType {
  id: number;
  code: BadgeCode;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeTypeId: number;
  productId: number | null;
  awardedAt: string;
  badgeType?: BadgeType;
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  properties: Record<string, unknown>;
  occurredAt: string;
}

// --- Home Section Types ---

export enum HomeSectionType {
  NEW_THIS_WEEK = 'new_this_week',
  TRENDING = 'trending',
  POPULAR_BY_RETAILER = 'popular_by_retailer',
  CATEGORIES = 'categories',
  ON_SALE = 'on_sale',
}

export enum ProductStatusBadge {
  NEW = 'new',
  HOT = 'hot',
  FIRST_REVIEW = 'first_review',
  SALE = 'sale',
  CONTROVERSIAL = 'controversial',
}

export enum ProductCardCta {
  FIRST_REVIEW = 'first_review',
  VIEW_REVIEWS = 'view_reviews',
  VIEW_DEAL = 'view_deal',
}

export interface HomeProductCard {
  id: number;
  name: string;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  brand?: Pick<Brand, 'id' | 'name'>;
  retailer?: Pick<Retailer, 'id' | 'name' | 'slug'>;
  price?: number | null;
  salePrice?: number | null;
  statusBadge?: ProductStatusBadge;
  trendingMetric?: string;
  cta?: ProductCardCta;
}

export type HomeSection =
  | {
      type: HomeSectionType.NEW_THIS_WEEK;
      title: string;
      emoji: string;
      products: HomeProductCard[];
    }
  | {
      type: HomeSectionType.TRENDING;
      title: string;
      emoji: string;
      products: HomeProductCard[];
    }
  | {
      type: HomeSectionType.POPULAR_BY_RETAILER;
      title: string;
      emoji: string;
      retailer: Pick<Retailer, 'id' | 'name' | 'slug'>;
      products: HomeProductCard[];
      moreUrl: string;
    }
  | {
      type: HomeSectionType.CATEGORIES;
      title: string;
      emoji: string;
      categories: Array<Pick<Category, 'id' | 'name' | 'slug' | 'iconUrl'>>;
    }
  | {
      type: HomeSectionType.ON_SALE;
      title: string;
      emoji: string;
      products: HomeProductCard[];
    };

export interface HomeResponse {
  sections: HomeSection[];
}
