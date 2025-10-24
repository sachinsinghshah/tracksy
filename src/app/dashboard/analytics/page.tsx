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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Calendar, Target } from "lucide-react";
import { formatPrice, formatPriceCompact } from "@/lib/utils";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's products
  const { data: products, error: productsError } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  // Fetch price history for analytics
  const { data: priceHistory, error: historyError } = await (supabase as any)
    .from("price_history")
    .select(`
      price,
      checked_at,
      products!inner (
        id,
        title,
        category,
        currency,
        user_id
      )
    `)
    .eq("products.user_id", user.id)
    .gte("checked_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("checked_at", { ascending: true });

  if (historyError) {
    console.error("Error fetching price history:", historyError);
  }

  // Calculate analytics data
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p: any) => p.is_active).length || 0;
  const productsWithTargets = products?.filter((p: any) => p.target_price).length || 0;
  
  // Calculate total potential savings
  const totalSavings = products?.reduce((sum: number, product: any) => {
    if (product.current_price && product.original_price) {
      return sum + (product.original_price - product.current_price);
    }
    return sum;
  }, 0) || 0;

  // Calculate average price drop
  const priceDrops = products?.filter((p: any) => 
    p.current_price && p.original_price && p.current_price < p.original_price
  ).length || 0;

  const averagePriceDrop = priceDrops > 0 
    ? products?.reduce((sum: number, product: any) => {
        if (product.current_price && product.original_price && product.current_price < product.original_price) {
          const drop = ((product.original_price - product.current_price) / product.original_price) * 100;
          return sum + drop;
        }
        return sum;
      }, 0) / priceDrops || 0
    : 0;

  // Calculate category breakdown
  const categoryStats = products?.reduce((acc: any, product: any) => {
    const category = product.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        totalValue: 0,
        averagePrice: 0,
        priceDrops: 0,
      };
    }
    acc[category].count++;
    if (product.current_price) {
      acc[category].totalValue += product.current_price;
    }
    if (product.current_price && product.original_price && product.current_price < product.original_price) {
      acc[category].priceDrops++;
    }
    return acc;
  }, {}) || {};

  // Calculate average prices per category
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    stats.averagePrice = stats.totalValue / stats.count;
  });

  // Calculate monthly spending trends
  const monthlyData = priceHistory?.reduce((acc: any, entry: any) => {
    const date = new Date(entry.checked_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalSpent: 0,
        averagePrice: 0,
        priceChecks: 0,
      };
    }
    
    acc[monthKey].totalSpent += entry.price;
    acc[monthKey].priceChecks++;
    acc[monthKey].averagePrice = acc[monthKey].totalSpent / acc[monthKey].priceChecks;
    
    return acc;
  }, {}) || {};

  const monthlyTrends = Object.values(monthlyData).sort((a: any, b: any) => 
    a.month.localeCompare(b.month)
  );

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
            <h1 className="text-xl font-bold">Analytics</h1>
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
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            Insights into your price tracking activity and savings
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                {activeProducts} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPriceCompact(totalSavings, "USD")}
              </div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Potential savings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Price Drops</CardTitle>
              <TrendingDown className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{priceDrops}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Products with lower prices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Drop</CardTitle>
              <Target className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averagePriceDrop.toFixed(1)}%
              </div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Average price reduction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Price Trends Chart */}
          <div className="lg:col-span-2">
            <AnalyticsChart data={monthlyTrends} />
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-1">
            <CategoryBreakdown categoryStats={categoryStats} />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest price tracking updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products?.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {product.title || "Untitled Product"}
                        </p>
                        <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                          {product.category || "Uncategorized"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {product.current_price 
                            ? formatPrice(product.current_price, product.currency || "USD")
                            : "—"
                          }
                        </p>
                        <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                          {product.last_checked 
                            ? new Date(product.last_checked).toLocaleDateString()
                            : "Never checked"
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}