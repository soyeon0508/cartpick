export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface Admin {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: string;
}

export interface LoginResponse {
  admin: Admin;
  tokens: AuthTokens;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

// Product types
export interface Product {
  id: number;
  countryId: number;
  brandId: number | null;
  categoryId: number;
  name: string;
  normalizedName: string;
  description: string | null;
  imageUrl: string | null;
  barcode: string | null;
  volumeValue: string | null;
  volumeUnit: string | null;
  packageType: string | null;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
  category?: Category;
}

// Brand types
export interface Brand {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category types
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
  createdAt: string;
  updatedAt: string;
  parent?: Category;
}

// Retailer types
export interface Retailer {
  id: number;
  countryId: number;
  name: string;
  slug: string;
  retailerType: 'convenience_store' | 'supermarket' | 'warehouse' | 'online';
  logoUrl: string | null;
  launchStatus: 'active' | 'coming_soon' | 'inactive';
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// RetailerProduct types
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
  createdAt: string;
  updatedAt: string;
  retailer?: Retailer;
}

// Report types
export interface ReviewReport {
  id: number;
  reviewId: number;
  reporterUserId: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  review: {
    body: string;
    user: {
      nickname: string;
    };
  };
  reporter: {
    nickname: string;
  };
}

// Dashboard types
export interface DashboardStats {
  totalProducts: number;
  totalReviews: number;
  newReviewsToday: number;
  pendingReports: number;
}