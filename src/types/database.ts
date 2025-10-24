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
          category: string | null;
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
          category?: string | null;
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
          category?: string | null;
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
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string | null;
          image_url: string | null;
          site: string;
          currency: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title?: string | null;
          image_url?: string | null;
          site: string;
          currency?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string | null;
          image_url?: string | null;
          site?: string;
          currency?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type WishlistItem = Database["public"]["Tables"]["wishlist"]["Row"];