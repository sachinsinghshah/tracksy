import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_ids } = await request.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    // Verify all products belong to the user
    const { data: products, error: verifyError } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .in("id", product_ids);

    if (verifyError) {
      console.error("Error verifying products:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify products" },
        { status: 500 }
      );
    }

    if (!products || products.length !== product_ids.length) {
      return NextResponse.json(
        { error: "Some products not found or don't belong to user" },
        { status: 404 }
      );
    }

    // Delete products (cascade will handle price_history and alerts)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("user_id", user.id)
      .in("id", product_ids);

    if (deleteError) {
      console.error("Error deleting products:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      deleted_count: product_ids.length 
    });
  } catch (error) {
    console.error("Error in bulk delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_ids, is_active, target_price } = await request.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    // Verify all products belong to the user
    const { data: products, error: verifyError } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .in("id", product_ids);

    if (verifyError) {
      console.error("Error verifying products:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify products" },
        { status: 500 }
      );
    }

    if (!products || products.length !== product_ids.length) {
      return NextResponse.json(
        { error: "Some products not found or don't belong to user" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (typeof is_active === "boolean") {
      updateData.is_active = is_active;
    }
    if (typeof target_price === "number") {
      updateData.target_price = target_price;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Update products
    const { error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("user_id", user.id)
      .in("id", product_ids);

    if (updateError) {
      console.error("Error updating products:", updateError);
      return NextResponse.json(
        { error: "Failed to update products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      updated_count: product_ids.length 
    });
  } catch (error) {
    console.error("Error in bulk update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}