"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface RefreshPriceButtonProps {
  productId: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function RefreshPriceButton({
  productId,
  size = "sm",
  variant = "outline",
}: RefreshPriceButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh price");
      }

      toast.success("Price updated!", {
        description: `Current price: ${data.data.price}`,
      });

      router.refresh();
    } catch (error) {
      toast.error("Failed to refresh price", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      size={size}
      variant={variant}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {size !== "icon" && (isRefreshing ? "Refreshing..." : "Refresh Price")}
    </Button>
  );
}
