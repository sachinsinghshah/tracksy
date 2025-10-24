import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      console.error("Error fetching user preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        user_id: user.id,
        email_notifications: true,
        notification_frequency: "immediate",
        price_drop_threshold: 0,
        daily_digest: false,
        weekly_summary: true,
      };
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error in preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_notifications,
      notification_frequency,
      price_drop_threshold,
      daily_digest,
      weekly_summary,
    } = body;

    // Validate input
    if (typeof email_notifications !== "boolean") {
      return NextResponse.json(
        { error: "email_notifications must be a boolean" },
        { status: 400 }
      );
    }

    const validFrequencies = ["immediate", "hourly", "daily"];
    if (!validFrequencies.includes(notification_frequency)) {
      return NextResponse.json(
        { error: "Invalid notification frequency" },
        { status: 400 }
      );
    }

    if (typeof price_drop_threshold !== "number" || price_drop_threshold < 0) {
      return NextResponse.json(
        { error: "price_drop_threshold must be a non-negative number" },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const preferencesData = {
      user_id: user.id,
      email_notifications,
      notification_frequency,
      price_drop_threshold,
      daily_digest: daily_digest || false,
      weekly_summary: weekly_summary || false,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingPreferences) {
      // Update existing preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .update(preferencesData)
        .eq("user_id", user.id)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          ...preferencesData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error("Error saving user preferences:", result.error);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}