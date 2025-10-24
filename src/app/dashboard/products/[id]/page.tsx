import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
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
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Target } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/utils";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { RefreshPriceButton } from "@/components/RefreshPriceButton";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { WishlistButton } from "@/components/WishlistButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

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
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch user's wishlists for the wishlist button
  const { data: wishlists } = await (supabase as any)
    .from("wishlists")
    .select("id, name, description")
    .eq("user_id", user.id);

  // Check if product is in any wishlist
  const { data: wishlistItems } = await (supabase as any)
    .from("wishlist_items")
    .select("wishlist_id")
    .eq("product_id", product.id)
    .in("wishlist_id", (wishlists || []).map((w: any) => w.id));

  const isInWishlist = wishlistItems && wishlistItems.length > 0;

  // Calculate savings if there's an original price
  const savings = product.original_price && product.current_price 
    ? product.original_price - product.current_price 
    : 0;
  
  const savingsPercent = product.original_price && savings > 0
    ? ((savings / product.original_price) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Product Details</h1>
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
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Product Overview */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">
                        {product.title || "Product Title"}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2">
                        <span>{product.site}</span>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Paused"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {product.image_url && (
                      <div className="aspect-square overflow-hidden rounded-lg bg-[hsl(var(--color-muted))]">
                        <img
                          src={product.image_url}
                          alt={product.title || "Product"}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Current Price</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {product.current_price
                            ? formatPrice(product.current_price, product.currency || "USD")
                            : "Price not available"}
                        </div>
                        {savings > 0 && (
                          <div className="text-sm text-green-600">
                            You save {formatPrice(savings, product.currency || "USD")} ({savingsPercent}%)
                          </div>
                        )}
                      </div>

                      {product.target_price && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Target Price</span>
                          </div>
                          <div className="text-lg font-semibold text-[hsl(var(--color-primary))]">
                            {formatPrice(product.target_price, product.currency || "USD")}
                          </div>
                          {product.current_price && product.current_price <= product.target_price && (
                            <Badge variant="default" className="bg-green-500">
                              Target Reached! 🎉
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Last Checked</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.last_checked
                            ? getRelativeTime(new Date(product.last_checked))
                            : "Never"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on {product.site}
                    </Button>
                  </a>
                  <RefreshPriceButton productId={product.id} />
                  <WishlistButton 
                    productId={product.id}
                    userWishlists={wishlists || []}
                    isInWishlist={isInWishlist}
                  />
                  <DeleteProductButton productId={product.id} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added:</span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  {product.original_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Price:</span>
                      <span className="line-through">
                        {formatPrice(product.original_price, product.currency || "USD")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{product.currency || "USD"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                      {product.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Price History Chart */}
          <PriceHistoryChart
            productId={product.id}
            currentPrice={product.current_price}
            currency={product.currency || "USD"}
            targetPrice={product.target_price}
          />
        </div>
      </main>
    </div>
  );
}