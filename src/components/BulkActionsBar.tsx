"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Pause, X } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedProducts: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkActionsBar({ 
  selectedProducts, 
  onClearSelection, 
  onRefresh 
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (selectedProducts.length === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_ids: selectedProducts,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete products");
      }

      toast.success(`${selectedProducts.length} products deleted successfully`);
      onClearSelection();
      onRefresh();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch("/api/products/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_ids: selectedProducts,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update products");
      }

      const action = isActive ? "activated" : "paused";
      toast.success(`${selectedProducts.length} products ${action} successfully`);
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast.error("Failed to update products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="flex items-center gap-2 rounded-lg border bg-background p-3 shadow-lg">
          <Badge variant="secondary" className="mr-2">
            {selectedProducts.length} selected
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatusChange(true)}
            disabled={loading}
          >
            <Play className="mr-2 h-4 w-4" />
            Activate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatusChange(false)}
            disabled={loading}
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Products</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all price history for these products.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Products"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}