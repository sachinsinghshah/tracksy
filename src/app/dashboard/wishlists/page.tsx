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
import { ArrowLeft, Heart, Plus, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatPrice, getRelativeTime } from "@/lib/utils";

export default async function WishlistsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's wishlists with products
  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select(`
      *,
      wishlist_items(
        *,
        products(*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlists:", error);
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
            <h1 className="text-xl font-bold">My Wishlists</h1>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Wishlists</h2>
            <p className="text-[hsl(var(--color-muted-foreground))]">
              {wishlists?.length || 0} wishlist{wishlists?.length !== 1 ? "s" : ""} created
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/wishlists/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Wishlist
            </Link>
          </Button>
        </div>

        {!wishlists || wishlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
              <h3 className="mb-2 text-lg font-semibold">No wishlists yet</h3>
              <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                Create your first wishlist to organize your favorite products.
              </p>
              <Button asChild>
                <Link href="/dashboard/wishlists/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Wishlist
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((wishlist: any) => (
              <Card key={wishlist.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/wishlists/${wishlist.id}`}
                          className="hover:underline"
                        >
                          {wishlist.name}
                        </Link>
                        {wishlist.is_public ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      {wishlist.description && (
                        <CardDescription className="mt-1">
                          {wishlist.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <Badge variant="secondary">
                        {wishlist.wishlist_items?.length || 0}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(wishlist.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Visibility:</span>
                      <Badge variant={wishlist.is_public ? "default" : "outline"}>
                        {wishlist.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>

                    {/* Preview of first few products */}
                    {wishlist.wishlist_items && wishlist.wishlist_items.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recent items:</span>
                        <div className="space-y-1">
                          {wishlist.wishlist_items.slice(0, 3).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              {item.products?.image_url && (
                                <img
                                  src={item.products.image_url}
                                  alt={item.products.title || "Product"}
                                  className="h-6 w-6 rounded object-cover"
                                />
                              )}
                              <span className="flex-1 truncate text-muted-foreground">
                                {item.products?.title || "Product"}
                              </span>
                              {item.products?.current_price && (
                                <span className="font-medium">
                                  {formatPrice(item.products.current_price, item.products.currency || "USD")}
                                </span>
                              )}
                            </div>
                          ))}
                          {wishlist.wishlist_items.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{wishlist.wishlist_items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="border-t border-[hsl(var(--color-border))] p-4">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/wishlists/${wishlist.id}`}>
                      View Wishlist
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}