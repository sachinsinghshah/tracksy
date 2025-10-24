import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendPriceDropEmail } from "@/lib/email";

/**
 * Cron job to send email alerts for price drops
 * Runs more frequently than price checks to ensure timely notifications
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Also check query parameter for compatibility with external cron services
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");

    if (!cronSecret) {
      console.error("[Alert Cron] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      );
    }

    // Check both Authorization header and query parameter
    const isAuthorized = 
      authHeader === `Bearer ${cronSecret}` || 
      querySecret === cronSecret;

    if (!isAuthorized) {
      console.error("[Alert Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Alert Cron] Starting email alert job...");

    const supabase = createServiceClient();

    // Fetch unsent alerts
    const { data: alerts, error: fetchError } = await (supabase as any)
      .from("alerts")
      .select(
        `
        *,
        products (
          id,
          title,
          url,
          image_url,
          currency
        ),
        users:user_id (
          id,
          email
        )
      `
      )
      .eq("email_sent", false)
      .order("sent_at", { ascending: true })
      .limit(20); // Process max 20 alerts per run

    if (fetchError) {
      console.error("[Alert Cron] Error fetching alerts:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch alerts" },
        { status: 500 }
      );
    }

    if (!alerts || alerts.length === 0) {
      console.log("[Alert Cron] No pending alerts to send");
      return NextResponse.json({
        message: "No pending alerts",
        sent: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(`[Alert Cron] Found ${alerts.length} alerts to send`);

    let successCount = 0;
    let errorCount = 0;

    // Send emails using Resend
    for (const alert of alerts) {
      try {
        console.log(`[Alert Cron] Processing alert ${alert.id}`);

        // Send email using Resend API
        const emailResult = await sendPriceDropEmail({
          to: alert.users.email,
          product: alert.products,
          oldPrice: alert.old_price,
          newPrice: alert.new_price,
        });

        if (!emailResult.success) {
          console.error(
            `[Alert Cron] Failed to send email for alert ${alert.id}:`,
            emailResult.error
          );
          errorCount++;
          continue;
        }

        // Mark alert as sent
        const { error: updateError } = await (supabase as any)
          .from("alerts")
          .update({ email_sent: true })
          .eq("id", alert.id);

        if (updateError) {
          console.error(
            `[Alert Cron] Failed to update alert ${alert.id}:`,
            updateError
          );
          errorCount++;
          continue;
        }

        successCount++;
        console.log(`[Alert Cron] Alert ${alert.id} sent successfully to ${alert.users.email}`);
      } catch (error) {
        console.error(`[Alert Cron] Error processing alert ${alert.id}:`, error);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      message: "Alert job completed",
      totalAlerts: alerts.length,
      sent: successCount,
      failed: errorCount,
      duration: `${Math.round(duration / 1000)}s`,
    };

    console.log("[Alert Cron] Job completed:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Alert Cron] Fatal error in cron job:", error);
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

