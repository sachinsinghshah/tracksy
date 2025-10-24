import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = context.params.id;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Ensure ownership
    const { data: product, error: productError } = await (supabase as any)
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: history, error } = await (supabase as any)
      .from("price_history")
      .select("price, checked_at")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch price history" },
        { status: 500 }
      );
    }

    const rows = [["checked_at", "price"], ...(history || []).map((h: any) => [h.checked_at, h.price])];
    const csv = rows.map((r) => r.join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=price-history-${productId}.csv`,
      },
    });
  } catch (error) {
    console.error("GET /api/products/[id]/history.csv error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
