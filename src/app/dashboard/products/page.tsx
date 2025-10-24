"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ArrowLeft, ExternalLink, Trash2, Eye } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/utils";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { RefreshPriceButton } from "@/components/RefreshPriceButton";
import { ProductCategoryFilter } from "@/components/ProductCategoryFilter";
import { BulkOperations } from "@/components/BulkOperations";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect("/login");
      }
      
      setUser(user);
      
      // Parse categories from search params
      const selectedCategories = searchParams.get("categories")
        ? searchParams.get("categories")!.split(",")
        : [];

      // Build query
      let query = supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id);

      // Apply category filter if specified
      if (selectedCategories.length > 0) {
        query = query.in("category", selectedCategories);
      }

      const { data: products, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(products || []);
      }
      
      setLoading(false);
    }

    fetchData();
  }, [searchParams]);

  const handleCategoriesChange = (categories: string[]) => {
    const params = new URLSearchParams();
    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    }
    const newUrl = categories.length > 0
      ? `/dashboard/products?${params.toString()}`
      : "/dashboard/products";
    router.push(newUrl);
  };

  const handleProductsUpdate = () => {
    // Refresh the page data
    window.location.reload();
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: any) => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
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
              <h1 className="text-xl font-bold">Tracked Products</h1>
            </div>
          </div>
        </header>
        <main className="container flex-1 px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  const selectedCategories = searchParams.get("categories")
    ? searchParams.get("categories")!.split(",")
    : [];

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
            <h1 className="text-xl font-bold">Tracked Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {user?.email}
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
          <h2 className="text-3xl font-bold tracking-tight">Your Products</h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            {products?.length || 0} product{products?.length !== 1 ? "s" : ""}{" "}
            being tracked
          </p>
        </div>

        {/* Category Filter and Bulk Operations */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <ProductCategoryFilter
              selectedCategories={selectedCategories}
              onCategoriesChange={handleCategoriesChange}
              productCount={products?.length}
            />
            <BulkOperations
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
              onProductsUpdate={handleProductsUpdate}
            />
          </div>
          
          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProducts.length === products.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all products
              </span>
            </div>
          )}
        </div>

        {!products || products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
              <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
              <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                Start tracking products by adding an Amazon URL from your
                dashboard.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title || "Product Title"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {product.site}
                          {product.category && (
                            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                              {product.category}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {product.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {product.image_url && (
                    <div className="mb-4 aspect-square w-full overflow-hidden rounded-md bg-[hsl(var(--color-muted))]">
                      <img
                        src={product.image_url}
                        alt={product.title || "Product"}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                        Current:
                      </span>
                      <span className="text-lg font-bold">
                        {product.current_price
                          ? formatPrice(
                              product.current_price,
                              product.currency || "USD"
                            )
                          : "—"}
                      </span>
                    </div>
                    {product.original_price && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                          Original:
                        </span>
                        <span className="text-sm line-through">
                          {formatPrice(
                            product.original_price,
                            product.currency || "USD"
                          )}
                        </span>
                      </div>
                    )}
                    {product.target_price && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                          Target:
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--color-primary))]">
                          {formatPrice(
                            product.target_price,
                            product.currency || "USD"
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between pt-2 text-xs text-[hsl(var(--color-muted-foreground))]">
                      <span>Last checked:</span>
                      <span>
                        {product.last_checked
                          ? getRelativeTime(new Date(product.last_checked))
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-[hsl(var(--color-border))] p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/products/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Product
                        </Button>
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <RefreshPriceButton productId={product.id} />
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}