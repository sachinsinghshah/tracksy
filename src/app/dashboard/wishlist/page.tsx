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
import { Heart, ArrowLeft, ExternalLink, Trash2, Plus, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DeleteWishlistButton } from "@/components/DeleteWishlistButton";
import { AddToWishlistForm } from "@/components/AddToWishlistForm";

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's wishlist
  const { data: wishlist, error } = await (supabase as any)
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist:", error);
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
            <h1 className="text-xl font-bold">Wishlist</h1>
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
          <h2 className="text-3xl font-bold tracking-tight">Your Wishlist</h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            {wishlist?.length || 0} item{wishlist?.length !== 1 ? "s" : ""} saved for later
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Add to Wishlist Form */}
          <div className="lg:col-span-1">
            <AddToWishlistForm />
          </div>

          {/* Wishlist Items */}
          <div className="lg:col-span-2">
            {!wishlist || wishlist.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Heart className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
                  <h3 className="mb-2 text-lg font-semibold">Your wishlist is empty</h3>
                  <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                    Add items to your wishlist to save them for later tracking.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {wishlist.map((item: any) => (
                  <Card key={item.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2 text-base">
                            {item.title || "Untitled Item"}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {item.site}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          <Heart className="mr-1 h-3 w-3" />
                          Wishlist
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {item.image_url && (
                        <div className="mb-4 aspect-square w-full overflow-hidden rounded-md bg-[hsl(var(--color-muted))]">
                          <img
                            src={item.image_url}
                            alt={item.title || "Item"}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      
                      {item.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
                            <strong>Notes:</strong> {item.notes}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-[hsl(var(--color-muted-foreground))]">
                          <span>Added:</span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="border-t border-[hsl(var(--color-border))] p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Item
                            </Button>
                          </a>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              // TODO: Add to tracking functionality
                              console.log("Add to tracking:", item);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Track Price
                          </Button>
                        </div>
                        <DeleteWishlistButton itemId={item.id} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}