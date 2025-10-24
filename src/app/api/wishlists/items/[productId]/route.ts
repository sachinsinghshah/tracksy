import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.productId;

    // Remove product from all user's wishlists
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("product_id", productId)
      .in("wishlist_id", 
        supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
      );

    if (error) {
      console.error("Error removing item from wishlist:", error);
      return NextResponse.json(
        { error: "Failed to remove item from wishlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in wishlist item deletion API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}