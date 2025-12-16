export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// TikTok Products Types
export interface TikTokProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  affiliate_link: string;
  description: string;
  tags: string[];
}

export interface TikTokCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  products: TikTokProduct[];
}

export interface TikTokProductsData {
  categories: TikTokCategory[];
} 