import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Health check endpoint to monitor cron job status
 * Returns information about the last price check execution
 */
export async function GET() {
  try {
    const supabase = createClient();

    // Get the most recently checked product
    const { data: products, error } = await (supabase as any)
      .from("products")
      .select("last_checked, title")
      .order("last_checked", { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to query database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const lastCheck = products?.[0]?.last_checked;
    const hoursSinceLastCheck = lastCheck
      ? (Date.now() - new Date(lastCheck).getTime()) / 3600000
      : null;

    // Count active products
    const { count: activeCount } = await (supabase as any)
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Determine health status
    // Healthy if checked within last 7 hours (allowing for some delay)
    const isHealthy = hoursSinceLastCheck !== null && hoursSinceLastCheck < 7;

    return NextResponse.json({
      status: isHealthy ? "healthy" : "warning",
      timestamp: new Date().toISOString(),
      cronJob: {
        lastExecution: lastCheck || "never",
        hoursSinceLastCheck:
          hoursSinceLastCheck !== null
            ? Math.round(hoursSinceLastCheck * 10) / 10
            : null,
        nextScheduledCheck: "Every 6 hours (0 */6 * * *)",
      },
      stats: {
        activeProducts: activeCount || 0,
        lastCheckedProduct: products?.[0]?.title || null,
      },
      message: isHealthy
        ? "Cron job is running normally"
        : hoursSinceLastCheck === null
          ? "No products have been checked yet"
          : "Warning: Cron job may not be running (last check > 7 hours ago)",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

