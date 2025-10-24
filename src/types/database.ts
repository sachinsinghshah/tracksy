export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string | null;
          current_price: number | null;
          original_price: number | null;
          target_price: number | null;
          image_url: string | null;
          site: string;
          currency: string | null;
          last_checked: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string | null;
          current_price?: number | null;
          original_price?: number | null;
          target_price?: number | null;
          image_url?: string | null;
          site: string;
          currency?: string | null;
          last_checked?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string | null;
          current_price?: number | null;
          original_price?: number | null;
          target_price?: number | null;
          image_url?: string | null;
          site?: string;
          currency?: string | null;
          last_checked?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      price_history: {
        Row: {
          id: string;
          product_id: string;
          price: number;
          checked_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          price: number;
          checked_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          price?: number;
          checked_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          old_price: number;
          new_price: number;
          sent_at: string;
          email_sent: boolean;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          old_price: number;
          new_price: number;
          sent_at?: string;
          email_sent?: boolean;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          old_price?: number;
          new_price?: number;
          sent_at?: string;
          email_sent?: boolean;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          product_id: string;
          added_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          product_id: string;
          added_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          product_id?: string;
          added_at?: string;
          notes?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          notification_frequency: string;
          price_drop_threshold: number;
          daily_digest: boolean;
          weekly_summary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          notification_frequency?: string;
          price_drop_threshold?: number;
          daily_digest?: boolean;
          weekly_summary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean;
          notification_frequency?: string;
          price_drop_threshold?: number;
          daily_digest?: boolean;
          weekly_summary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"];
export type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];



