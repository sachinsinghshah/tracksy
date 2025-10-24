"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
}

interface WishlistButtonProps {
  productId: string;
  userWishlists?: Wishlist[];
  isInWishlist?: boolean;
}

export function WishlistButton({ 
  productId, 
  userWishlists = [], 
  isInWishlist = false 
}: WishlistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");

  const handleAddToWishlist = async (wishlistId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/wishlists/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wishlist_id: wishlistId,
          product_id: productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to wishlist");
      }

      toast.success("Added to wishlist!");
    } catch (error) {
      toast.error("Failed to add to wishlist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wishlists/items/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove from wishlist");
      }

      toast.success("Removed from wishlist!");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWishlistName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create wishlist");
      }

      const newWishlist = await response.json();
      await handleAddToWishlist(newWishlist.id);
      setNewWishlistName("");
      setDialogOpen(false);
      toast.success("Wishlist created and product added!");
    } catch (error) {
      toast.error("Failed to create wishlist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isInWishlist) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemoveFromWishlist}
        disabled={loading}
        className="gap-2"
      >
        <Heart className="h-4 w-4 fill-current text-red-500" />
        Remove from Wishlist
      </Button>
    );
  }

  if (userWishlists.length === 0) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="h-4 w-4" />
            Add to Wishlist
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Your First Wishlist</DialogTitle>
            <DialogDescription>
              Create a wishlist to organize your favorite products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Wishlist Name</label>
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="e.g., Holiday Shopping, Electronics"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateWishlist();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateWishlist}
                disabled={loading || !newWishlistName.trim()}
                className="flex-1"
              >
                Create & Add Product
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="gap-2">
          <Heart className="h-4 w-4" />
          Add to Wishlist
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {userWishlists.map((wishlist) => (
          <DropdownMenuItem
            key={wishlist.id}
            onClick={() => handleAddToWishlist(wishlist.id)}
          >
            {wishlist.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => setDialogOpen(true)}
          className="border-t"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Wishlist
        </DropdownMenuItem>
      </DropdownMenuContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wishlist</DialogTitle>
            <DialogDescription>
              Create a new wishlist to organize your products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Wishlist Name</label>
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="e.g., Holiday Shopping, Electronics"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateWishlist();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateWishlist}
                disabled={loading || !newWishlistName.trim()}
                className="flex-1"
              >
                Create & Add Product
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}