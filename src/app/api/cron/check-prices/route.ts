import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAmazonProductWithRetry } from "@/lib/scrapers/amazon";

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting price check job...");

    // Create Supabase client with service role for cron jobs
    const supabase = createClient();

    // Fetch all active products
    const { data: products, error: fetchError } = await (supabase as any)
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("last_checked", { ascending: true, nullsFirst: true });

    if (fetchError) {
      console.error("[Cron] Error fetching products:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      console.log("[Cron] No active products to check");
      return NextResponse.json({
        message: "No active products to check",
        checked: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(`[Cron] Found ${products.length} active products to check`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ productId: string; error: string }> = [];

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(
        `[Cron] Processing product ${i + 1}/${products.length}: ${product.id}`
      );

      try {
        // Scrape the product
        const scrapeResult = await scrapeAmazonProductWithRetry(product.url);

        if (!scrapeResult.success || !scrapeResult.data) {
          console.error(
            `[Cron] Failed to scrape product ${product.id}:`,
            scrapeResult.error
          );
          errorCount++;
          errors.push({
            productId: product.id,
            error: scrapeResult.error || "Unknown error",
          });
          continue;
        }

        const scrapedData = scrapeResult.data;

        // Update product in database
        const { error: updateError } = await (supabase as any)
          .from("products")
          .update({
            title: scrapedData.title,
            current_price: scrapedData.price,
            original_price: product.original_price || scrapedData.price,
            image_url: scrapedData.imageUrl,
            currency: scrapedData.currency,
            last_checked: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (updateError) {
          console.error(
            `[Cron] Failed to update product ${product.id}:`,
            updateError
          );
          errorCount++;
          errors.push({
            productId: product.id,
            error: "Database update failed",
          });
          continue;
        }

        // Add to price history
        await (supabase as any).from("price_history").insert({
          product_id: product.id,
          price: scrapedData.price,
          checked_at: new Date().toISOString(),
        });

        // Check for price drop and create alert
        if (product.target_price && scrapedData.price < product.target_price) {
          console.log(
            `[Cron] Price drop detected for product ${product.id}! Current: ${scrapedData.price}, Target: ${product.target_price}`
          );

          // Create alert
          await (supabase as any).from("alerts").insert({
            product_id: product.id,
            user_id: product.user_id,
            old_price: product.current_price || scrapedData.price,
            new_price: scrapedData.price,
            email_sent: false,
          });
        }

        successCount++;
        console.log(
          `[Cron] Successfully processed product ${product.id} (${i + 1}/${products.length})`
        );
      } catch (error) {
        console.error(`[Cron] Error processing product ${product.id}:`, error);
        errorCount++;
        errors.push({
          productId: product.id,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }

      // Rate limiting: Wait 3 seconds between requests to avoid being blocked
      if (i < products.length - 1) {
        console.log("[Cron] Waiting 3 seconds before next product...");
        await delay(3000);
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      message: "Price check completed",
      totalProducts: products.length,
      successful: successCount,
      failed: errorCount,
      duration: `${Math.round(duration / 1000)}s`,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[Cron] Job completed:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Cron] Fatal error in cron job:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (with secret)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward to POST handler
  return POST(request);
}
