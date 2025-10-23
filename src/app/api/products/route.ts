import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import {
  addProductSchema,
  extractAmazonProductId,
  getAmazonSite,
  normalizeAmazonUrl,
} from "@/lib/validators/product";

// GET - Fetch all user's tracked products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: products, error } = await (supabase as any)
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add new product to track
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
    const validation = addProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url, targetPrice } = validation.data;

    // Extract product ID
    const productId = extractAmazonProductId(url);
    if (!productId) {
      return NextResponse.json(
        { 
          error: "Could not find product ID in URL. Please make sure you're using a product page URL (e.g., amazon.com/dp/B08N5WRWNW), not a search results page." 
        },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = normalizeAmazonUrl(url);
    const site = getAmazonSite(url);

    // Check if product already exists for this user
    const { data: existingProduct } = await (supabase as any)
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", normalizedUrl)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: "You are already tracking this product" },
        { status: 400 }
      );
    }

    // Insert product into database
    const productData = {
      user_id: user.id,
      url: normalizedUrl,
      site,
      target_price: targetPrice,
      is_active: true,
    };

    const { data: product, error } = await (supabase as any)
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting product:", error);
      return NextResponse.json(
        { error: "Failed to add product" },
        { status: 500 }
      );
    }

    // Trigger initial scrape in the background
    if (product) {
      // Don't await - let it run in background
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ productId: product.id }),
      }).catch((err) => {
        console.error("Failed to trigger scrape:", err);
      });
    }

    return NextResponse.json(
      {
        message: "Product added successfully. Fetching product details...",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove product
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
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Delete product (RLS will ensure user can only delete their own products)
    const { error } = await (supabase as any)
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

