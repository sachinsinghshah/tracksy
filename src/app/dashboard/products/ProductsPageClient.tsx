"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
import { Package, ArrowLeft, ExternalLink, CheckSquare } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/utils";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { RefreshPriceButton } from "@/components/RefreshPriceButton";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ProductFilters, FilterOptions } from "@/components/ProductFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExportButton } from "@/components/ExportButton";

interface Product {
  id: string;
  title: string | null;
  site: string;
  current_price: number | null;
  original_price: number | null;
  target_price: number | null;
  image_url: string | null;
  currency: string | null;
  last_checked: string | null;
  is_active: boolean;
  url: string;
  created_at: string;
}

export function ProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
    status: "all",
    priceRange: "all",
    sites: [],
    hasTarget: "all",
  });
  const router = useRouter();

  useEffect(() => {
    fetchUserAndProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchUserAndProducts = async () => {
    const supabase = createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/login");
      return;
    }

    setUser(user);

    // Fetch user's products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(products || []);
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.title?.toLowerCase().includes(searchTerm) ||
        product.site.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(product => 
        filters.status === "active" ? product.is_active : !product.is_active
      );
    }

    // Price range filter
    if (filters.priceRange !== "all" && filters.priceRange) {
      filtered = filtered.filter(product => {
        if (!product.current_price) return false;
        const price = product.current_price;
        
        switch (filters.priceRange) {
          case "under-50":
            return price < 50;
          case "50-100":
            return price >= 50 && price <= 100;
          case "100-500":
            return price > 100 && price <= 500;
          case "over-500":
            return price > 500;
          default:
            return true;
        }
      });
    }

    // Sites filter
    if (filters.sites.length > 0) {
      filtered = filtered.filter(product => 
        filters.sites.includes(product.site)
      );
    }

    // Target price filter
    if (filters.hasTarget !== "all") {
      filtered = filtered.filter(product => 
        filters.hasTarget === "yes" ? product.target_price !== null : product.target_price === null
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "price":
          aValue = a.current_price || 0;
          bValue = b.current_price || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case "last_checked":
          aValue = new Date(a.last_checked || 0).getTime();
          bValue = new Date(b.last_checked || 0).getTime();
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
      setSelectAll(true);
    } else {
      setSelectedProducts([]);
      setSelectAll(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setSelectedProducts([]);
    setSelectAll(false);
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
    setSelectAll(false);
  };

  const handleRefresh = () => {
    fetchUserAndProducts();
  };

  // Get unique sites for filter
  const availableSites = [...new Set(products.map(p => p.site))];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
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
            <h1 className="text-xl font-bold">Tracked Products</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Products</h2>
            <p className="text-[hsl(var(--color-muted-foreground))]">
              {filteredProducts.length} of {products.length} product{products.length !== 1 ? "s" : ""} shown
            </p>
          </div>
          
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select all
                  </label>
                </div>
                {selectedProducts.length > 0 && (
                  <Badge variant="secondary">
                    {selectedProducts.length} selected
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedProducts.length > 0 && (
                  <ExportButton 
                    selectedProducts={selectedProducts}
                    exportType="selected"
                  />
                )}
                <ExportButton exportType="all" />
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        {products.length > 0 && (
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableSites={availableSites}
          />
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
              <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
              <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                Start tracking products by adding an Amazon URL from your dashboard.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
              <h3 className="mb-2 text-lg font-semibold">No products match your filters</h3>
              <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                Try adjusting your search or filter criteria to see more results.
              </p>
              <Button onClick={() => handleFiltersChange({
                search: "",
                sortBy: "created_at",
                sortOrder: "desc",
                status: "all",
                priceRange: "all",
                sites: [],
                hasTarget: "all",
              })}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => 
                          handleProductSelect(product.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-base">
                          {product.title || "Product Title"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {product.site}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
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
                          ? formatPrice(product.current_price, product.currency || "USD")
                          : "—"}
                      </span>
                    </div>
                    {product.original_price && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                          Original:
                        </span>
                        <span className="text-sm line-through">
                          {formatPrice(product.original_price, product.currency || "USD")}
                        </span>
                      </div>
                    )}
                    {product.target_price && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
                          Target:
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--color-primary))]">
                          {formatPrice(product.target_price, product.currency || "USD")}
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
                        <Button variant="default" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <DeleteProductButton productId={product.id} />
                    </div>
                    <RefreshPriceButton productId={product.id} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BulkActionsBar
        selectedProducts={selectedProducts}
        onClearSelection={handleClearSelection}
        onRefresh={handleRefresh}
      />
    </div>
  );
}