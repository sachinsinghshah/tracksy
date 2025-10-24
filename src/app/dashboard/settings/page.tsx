import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user preferences (create default if doesn't exist)
  let { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no preferences exist, create default ones
  if (!preferences) {
    const { data: newPreferences } = await supabase
      .from("user_preferences")
      .insert({
        user_id: user.id,
        email_notifications: true,
        notification_frequency: "immediate",
        price_drop_threshold: 0,
        daily_digest: false,
        weekly_summary: true,
      })
      .select()
      .single();
    
    preferences = newPreferences;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-[hsl(var(--color-primary))] hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-[hsl(var(--color-muted-foreground))]">
              Manage your account preferences and notification settings
            </p>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Account Created</label>
                <div className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive price alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm initialPreferences={preferences} />
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Export Data</label>
                  <p className="text-sm text-muted-foreground">
                    Download all your tracked products and price history
                  </p>
                </div>
                <Link href="/dashboard/products">
                  <Button variant="outline">Export Products</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Alert History</label>
                  <p className="text-sm text-muted-foreground">
                    View all your price drop notifications
                  </p>
                </div>
                <Link href="/dashboard/alerts">
                  <Button variant="outline">View Alerts</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}