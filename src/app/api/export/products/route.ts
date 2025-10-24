import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const productIds = searchParams.get("product_ids");

    // Build query
    let query = supabase
      .from("products")
      .select(`
        id,
        title,
        url,
        site,
        current_price,
        original_price,
        target_price,
        currency,
        is_active,
        last_checked,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by specific product IDs if provided
    if (productIds) {
      const ids = productIds.split(",").filter(id => id.trim());
      if (ids.length > 0) {
        query = query.in("id", ids);
      }
    }

    const { data: products, error } = await query;

    if (error) {
      console.error("Error fetching products for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found to export" },
        { status: 404 }
      );
    }

    // Format data for export
    const exportData = products.map(product => ({
      id: product.id,
      title: product.title || "N/A",
      url: product.url,
      site: product.site,
      current_price: product.current_price || 0,
      original_price: product.original_price || 0,
      target_price: product.target_price || 0,
      currency: product.currency || "USD",
      status: product.is_active ? "Active" : "Paused",
      last_checked: product.last_checked 
        ? new Date(product.last_checked).toISOString()
        : "Never",
      created_at: new Date(product.created_at).toISOString(),
    }));

    if (format === "json") {
      const jsonData = JSON.stringify(exportData, null, 2);
      
      return new NextResponse(jsonData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=products.json",
        },
      });
    } else {
      // CSV format
      const headers = [
        "ID",
        "Title",
        "URL",
        "Site",
        "Current Price",
        "Original Price", 
        "Target Price",
        "Currency",
        "Status",
        "Last Checked",
        "Created At"
      ];

      const csvRows = [
        headers.join(","),
        ...exportData.map(product => [
          product.id,
          `"${product.title.replace(/"/g, '""')}"`,
          `"${product.url}"`,
          product.site,
          product.current_price,
          product.original_price,
          product.target_price,
          product.currency,
          product.status,
          `"${product.last_checked}"`,
          `"${product.created_at}"`
        ].join(","))
      ];

      const csvData = csvRows.join("\n");

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=products.csv",
        },
      });
    }
  } catch (error) {
    console.error("Error in export API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}