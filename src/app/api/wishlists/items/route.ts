import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wishlist_id, product_id, notes } = await request.json();

    if (!wishlist_id || !product_id) {
      return NextResponse.json(
        { error: "Wishlist ID and Product ID are required" },
        { status: 400 }
      );
    }

    // Verify the wishlist belongs to the user
    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("id", wishlist_id)
      .eq("user_id", user.id)
      .single();

    if (wishlistError || !wishlist) {
      return NextResponse.json(
        { error: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Verify the product belongs to the user
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .eq("user_id", user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if item already exists in wishlist
    const { data: existingItem } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", wishlist_id)
      .eq("product_id", product_id)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: "Product already in wishlist" },
        { status: 409 }
      );
    }

    // Add item to wishlist
    const { data: wishlistItem, error } = await supabase
      .from("wishlist_items")
      .insert({
        wishlist_id,
        product_id,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding item to wishlist:", error);
      return NextResponse.json(
        { error: "Failed to add item to wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.error("Error in wishlist items API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}