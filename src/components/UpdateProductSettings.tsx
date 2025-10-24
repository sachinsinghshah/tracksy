"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UpdateProductSettingsProps {
  productId: string;
  initialTargetPrice: number | null;
  initialIsActive: boolean;
}

export function UpdateProductSettings({
  productId,
  initialTargetPrice,
  initialIsActive,
}: UpdateProductSettingsProps) {
  const [targetPrice, setTargetPrice] = useState<string>(
    initialTargetPrice != null ? String(initialTargetPrice) : ""
  );
  const [isActive, setIsActive] = useState<boolean>(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload: { targetPrice?: number | null; isActive?: boolean } = {};
      if (targetPrice === "") {
        payload.targetPrice = null; // Clear
      } else if (!isNaN(parseFloat(targetPrice))) {
        payload.targetPrice = parseFloat(targetPrice);
      }
      payload.isActive = isActive;

      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      toast.success("Settings updated");
    } catch (err) {
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="targetPrice">Target price</Label>
          <Input
            id="targetPrice"
            type="number"
            step="0.01"
            placeholder="99.99"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
          />
          <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
            Leave blank to clear the target price
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            className="h-4 w-4"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
