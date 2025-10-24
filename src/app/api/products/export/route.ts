import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    // Fetch products with price history
    const { data: products, error: productsError } = await (supabase as any)
      .from("products")
      .select(`
        *,
        price_history (
          price,
          checked_at
        )
      `)
      .eq("user_id", user.id)
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found" },
        { status: 404 }
      );
    }

    // Generate CSV content
    const csvHeaders = [
      "Product ID",
      "Title",
      "URL",
      "Site",
      "Category",
      "Current Price",
      "Original Price",
      "Target Price",
      "Currency",
      "Is Active",
      "Created At",
      "Last Checked",
      "Price History Count",
      "Lowest Price",
      "Highest Price",
      "Average Price",
    ];

    const csvRows = products.map((product: any) => {
      const priceHistory = product.price_history || [];
      const prices = priceHistory.map((ph: any) => ph.price);
      
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
      const highestPrice = prices.length > 0 ? Math.max(...prices) : null;
      const averagePrice = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length 
        : null;

      return [
        product.id,
        `"${(product.title || "").replace(/"/g, '""')}"`,
        product.url,
        product.site,
        product.category || "",
        product.current_price || "",
        product.original_price || "",
        product.target_price || "",
        product.currency || "USD",
        product.is_active ? "Yes" : "No",
        product.created_at,
        product.last_checked || "",
        priceHistory.length,
        lowestPrice || "",
        highestPrice || "",
        averagePrice ? averagePrice.toFixed(2) : "",
      ];
    });

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error in export API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}