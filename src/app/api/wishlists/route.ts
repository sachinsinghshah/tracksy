import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's wishlists with item counts
    const { data: wishlists, error } = await supabase
      .from("wishlists")
      .select(`
        *,
        wishlist_items(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wishlists:", error);
      return NextResponse.json(
        { error: "Failed to fetch wishlists" },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlists || []);
  } catch (error) {
    console.error("Error in wishlists API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { name, description, is_public } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Wishlist name is required" },
        { status: 400 }
      );
    }

    // Create new wishlist
    const { data: wishlist, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating wishlist:", error);
      return NextResponse.json(
        { error: "Failed to create wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error in wishlist creation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}