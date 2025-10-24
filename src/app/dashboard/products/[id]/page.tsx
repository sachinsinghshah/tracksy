import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { UpdateProductSettings } from "@/components/UpdateProductSettings";
import { Download } from "lucide-react";

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

  const productId = params.id;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/${productId}`, {
    headers: {
      Cookie: (await (await import("next/headers")).cookies()).toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const { product, price_history } = await res.json();

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
        </div>
      </header>

      <main className="container flex-1 px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {product.title || "Product"}
                    </CardTitle>
                    <CardDescription className="mt-1">{product.site}</CardDescription>
                  </div>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="text-sm text-[hsl(var(--color-muted-foreground))]">Current</div>
                    <div className="text-lg font-semibold">
                      {product.current_price ? (
                        formatPrice(product.current_price, product.currency || "USD")
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--color-muted-foreground))]">Original</div>
                    <div className="text-lg">
                      {product.original_price ? (
                        formatPrice(product.original_price, product.currency || "USD")
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--color-muted-foreground))]">Target</div>
                    <div className="text-lg">
                      {product.target_price ? (
                        formatPrice(product.target_price, product.currency || "USD")
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
                <CardDescription>Track price changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceHistoryChart
                  data={(price_history || []).map((h: any) => ({
                    date: h.checked_at,
                    price: h.price,
                  }))}
                  currency={product.currency || "USD"}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <UpdateProductSettings
              productId={product.id}
              initialTargetPrice={product.target_price}
              initialIsActive={product.is_active}
            />

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full">View on site</Button>
                  </a>
                  <a href={`/api/products/${product.id}/history.csv`}>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Export CSV
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
