import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAmazonProductWithRetry } from "@/lib/scrapers/amazon";

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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch product from database
    const { data: product, error: fetchError } = await (supabase as any)
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    console.log(`[API] Starting scrape for product: ${product.id}`);

    // Scrape the product
    const scrapeResult = await scrapeAmazonProductWithRetry(product.url);

    if (!scrapeResult.success || !scrapeResult.data) {
      console.error(`[API] Scrape failed:`, scrapeResult.error);
      return NextResponse.json(
        { error: scrapeResult.error || "Failed to scrape product" },
        { status: 500 }
      );
    }

    const scrapedData = scrapeResult.data;
    console.log(`[API] Scrape successful:`, scrapedData);

    // Update product in database
    const { error: updateError } = await (supabase as any)
      .from("products")
      .update({
        title: scrapedData.title,
        current_price: scrapedData.price,
        original_price: product.original_price || scrapedData.price, // Set original price if first time
        image_url: scrapedData.imageUrl,
        currency: scrapedData.currency,
        last_checked: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error(`[API] Failed to update product:`, updateError);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    // Add to price history
    const { error: historyError } = await (supabase as any)
      .from("price_history")
      .insert({
        product_id: productId,
        price: scrapedData.price,
        checked_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error(`[API] Failed to add price history:`, historyError);
      // Don't fail the request if price history fails
    }

    // Check if price dropped below target
    if (product.target_price && scrapedData.price < product.target_price) {
      console.log(
        `[API] Price drop detected! Current: ${scrapedData.price}, Target: ${product.target_price}`
      );

      // Create alert
      const { error: alertError } = await (supabase as any)
        .from("alerts")
        .insert({
          product_id: productId,
          user_id: user.id,
          old_price: product.current_price || scrapedData.price,
          new_price: scrapedData.price,
          email_sent: false, // TODO: Send email in future
        });

      if (alertError) {
        console.error(`[API] Failed to create alert:`, alertError);
      }
    }

    return NextResponse.json({
      message: "Product scraped successfully",
      data: scrapedData,
    });
  } catch (error) {
    console.error("[API] Error in scrape endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

