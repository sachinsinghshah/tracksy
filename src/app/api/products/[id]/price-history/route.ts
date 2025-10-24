import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("range") || "30d";

    // Get user to verify ownership
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, user_id")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate date filter based on time range
    let dateFilter = new Date();
    switch (timeRange) {
      case "7d":
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case "30d":
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case "90d":
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case "all":
      default:
        dateFilter = new Date(0); // All time
        break;
    }

    // Get price history for the product
    const { data: priceHistory, error: historyError } = await supabase
      .from("price_history")
      .select("price, checked_at")
      .eq("product_id", productId)
      .gte("checked_at", dateFilter.toISOString())
      .order("checked_at", { ascending: true });

    if (historyError) {
      console.error("Error fetching price history:", historyError);
      return NextResponse.json(
        { error: "Failed to fetch price history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: priceHistory || [],
    });
  } catch (error) {
    console.error("Error in price history API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}