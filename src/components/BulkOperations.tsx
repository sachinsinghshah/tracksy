"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Trash2, 
  Pause, 
  Play, 
  Tag, 
  Download, 
  Upload,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

interface BulkOperationsProps {
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
  onProductsUpdate: () => void;
}

export function BulkOperations({ 
  selectedProducts, 
  onSelectionChange, 
  onProductsUpdate 
}: BulkOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const hasSelection = selectedProducts.length > 0;

  const handleBulkAction = async (action: string, data?: any) => {
    if (!hasSelection) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          productIds: selectedProducts,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to perform bulk action");
      }

      toast.success(`${action} completed successfully`, {
        description: `${selectedProducts.length} products updated`,
      });

      onSelectionChange([]);
      onProductsUpdate();
    } catch (error) {
      toast.error(`Failed to ${action}`, {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    handleBulkAction("delete");
    setShowDeleteDialog(false);
  };

  const handleUpdateCategory = () => {
    handleBulkAction("updateCategory", { category: selectedCategory });
    setShowCategoryDialog(false);
    setSelectedCategory("");
  };

  const handleExport = async () => {
    if (!hasSelection) return;

    try {
      const response = await fetch("/api/products/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export products");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Products exported successfully");
    } catch (error) {
      toast.error("Failed to export products", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    }
  };

  const categories = [
    "Electronics",
    "Clothing & Fashion",
    "Home & Garden",
    "Books & Media",
    "Sports & Outdoors",
    "Health & Beauty",
    "Toys & Games",
    "Automotive",
    "Food & Grocery",
    "Office Supplies",
    "Jewelry & Watches",
    "Pet Supplies",
    "Travel & Luggage",
    "Baby & Kids",
    "Tools & Hardware",
    "Other",
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {hasSelection && (
          <Badge variant="secondary" className="mr-2">
            {selectedProducts.length} selected
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!hasSelection || isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="mr-2 h-4 w-4" />
              )}
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleBulkAction("activate")}>
              <Play className="mr-2 h-4 w-4" />
              Activate Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("deactivate")}>
              <Pause className="mr-2 h-4 w-4" />
              Pause Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCategoryDialog(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Update Category
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Products</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProducts.length} selected products? 
              This action cannot be undone and will also delete all associated price history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Update Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category</DialogTitle>
            <DialogDescription>
              Select a category for {selectedProducts.length} selected products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                setSelectedCategory("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={!selectedCategory || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Tag className="mr-2 h-4 w-4" />
                  Update Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}