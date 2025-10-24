import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Package, Calendar, DollarSign, Target, TrendingUp } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/utils";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { RefreshPriceButton } from "@/components/RefreshPriceButton";
import { PriceChart } from "@/components/PriceChart";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const supabase = await createClient();
  const productId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the specific product
  const { data: product, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", user.id)
    .single();

  if (error || !product) {
    notFound();
  }

  // Calculate price change if we have price history
  const { data: priceHistory } = await supabase
    .from("price_history")
    .select("price, checked_at")
    .eq("product_id", productId)
    .order("checked_at", { ascending: false })
    .limit(2);

  const priceChange = priceHistory && priceHistory.length >= 2 
    ? {
        change: priceHistory[0].price - priceHistory[1].price,
        changePercent: ((priceHistory[0].price - priceHistory[1].price) / priceHistory[1].price) * 100,
        isPositive: priceHistory[0].price > priceHistory[1].price,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Products
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Product Details</h1>
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
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-3 text-lg">
                      {product.title || "Product Title"}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {product.site}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {product.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Image */}
                {product.image_url && (
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-[hsl(var(--color-muted))]">
                    <img
                      src={product.image_url}
                      alt={product.title || "Product"}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                {/* Price Information */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                      Current Price:
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-bold">
                        {product.current_price
                          ? formatPrice(product.current_price, product.currency || "USD")
                          : "—"}
                      </span>
                      {priceChange && (
                        <div className={`flex items-center gap-1 text-sm ${
                          priceChange.isPositive ? "text-green-500" : "text-red-500"
                        }`}>
                          <TrendingUp className={`h-4 w-4 ${
                            priceChange.isPositive ? "" : "rotate-180"
                          }`} />
                          <span>
                            {formatPrice(Math.abs(priceChange.change), product.currency || "USD")}
                            ({priceChange.changePercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {product.original_price && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                        Original Price:
                      </span>
                      <span className="text-sm line-through">
                        {formatPrice(product.original_price, product.currency || "USD")}
                      </span>
                    </div>
                  )}

                  {product.target_price && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                        Target Price:
                      </span>
                      <span className="text-sm font-medium text-[hsl(var(--color-primary))]">
                        {formatPrice(product.target_price, product.currency || "USD")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Stats */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--color-muted-foreground))]">Last checked:</span>
                    <span>
                      {product.last_checked
                        ? getRelativeTime(new Date(product.last_checked))
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--color-muted-foreground))]">Added:</span>
                    <span>
                      {getRelativeTime(new Date(product.created_at))}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on {product.site}
                    </Button>
                  </a>
                  <RefreshPriceButton productId={product.id} />
                  <DeleteProductButton productId={product.id} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <div className="lg:col-span-2">
            <PriceChart
              productId={product.id}
              productTitle={product.title}
              currentPrice={product.current_price}
              targetPrice={product.target_price}
              currency={product.currency}
            />
          </div>
        </div>
      </main>
    </div>
  );
}