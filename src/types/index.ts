export interface ScrapedProduct {
  title: string;
  price: number;
  imageUrl: string;
  availability: boolean;
  currency: string;
}

export interface ProductWithHistory {
  id: string;
  url: string;
  title: string | null;
  current_price: number | null;
  original_price: number | null;
  target_price: number | null;
  image_url: string | null;
  site: string;
  last_checked: string | null;
  is_active: boolean;
  created_at: string;
  price_history: Array<{
    id: string;
    price: number;
    checked_at: string;
  }>;
}

export interface AddProductInput {
  url: string;
  targetPrice?: number;
}

export interface UpdateProductInput {
  targetPrice?: number;
  isActive?: boolean;
}

export type SupportedSite = "amazon" | "walmart" | "bestbuy";

export interface ScraperResult {
  success: boolean;
  data?: ScrapedProduct;
  error?: string;
}



