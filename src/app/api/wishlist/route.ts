import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const addToWishlistSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
  title: z.string().optional(),
  image_url: z.string().url().optional(),
  site: z.string().min(1, "Site is required"),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Fetch user's wishlist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: wishlist, error } = await (supabase as any)
      .from("wishlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wishlist:", error);
      return NextResponse.json(
        { error: "Failed to fetch wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ wishlist: wishlist || [] });
  } catch (error) {
    console.error("Error in GET /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = addToWishlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url, title, image_url, site, currency, notes } = validation.data;

    // Check if item already exists in wishlist
    const { data: existingItem } = await (supabase as any)
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: "This item is already in your wishlist" },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistData = {
      user_id: user.id,
      url,
      title: title || null,
      image_url: image_url || null,
      site,
      currency: currency || null,
      notes: notes || null,
    };

    const { data: wishlistItem, error } = await (supabase as any)
      .from("wishlist")
      .insert(wishlistData)
      .select()
      .single();

    if (error) {
      console.error("Error adding to wishlist:", error);
      return NextResponse.json(
        { error: "Failed to add to wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Item added to wishlist successfully",
        wishlistItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Delete wishlist item (RLS will ensure user can only delete their own items)
    const { error } = await (supabase as any)
      .from("wishlist")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting wishlist item:", error);
      return NextResponse.json(
        { error: "Failed to delete wishlist item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Item removed from wishlist successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}