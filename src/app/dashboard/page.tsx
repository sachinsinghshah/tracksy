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
import { Package, TrendingDown, Bell, Clock, Heart, Settings, BarChart3 } from "lucide-react";
import { AddProductForm } from "@/components/AddProductForm";
import { getRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch real stats
  const { data: products } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("user_id", user.id);

  const totalProducts = products?.length || 0;
  const activeAlerts = products?.filter((p: any) => p.target_price).length || 0;
  const lastCheckedProduct = products?.find((p: any) => p.last_checked);

  const stats = {
    totalProducts,
    activeAlerts,
    priceDrops: 0, // TODO: Calculate from price_history
    lastChecked: lastCheckedProduct?.last_checked
      ? getRelativeTime(new Date(lastCheckedProduct.last_checked))
      : "Never",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Price Tracker</h1>
            <div className="flex gap-2">
              {totalProducts > 0 && (
                <Link href="/dashboard/products">
                  <Button variant="ghost" size="sm">
                    View All Products
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/wishlist">
                <Button variant="ghost" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back! 👋
          </h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            Here's an overview of your tracked products
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Products being tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAlerts}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Products with target prices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Drops</CardTitle>
              <TrendingDown className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.priceDrops}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                In the last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Checked
              </CardTitle>
              <Clock className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--color-muted-foreground))]">
                —
              </div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                {stats.lastChecked}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <AddProductForm />

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest price tracking updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Package className="h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
                <p className="text-center text-[hsl(var(--color-muted-foreground))]">
                  No products tracked yet. Add your first product to start
                  monitoring prices!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
