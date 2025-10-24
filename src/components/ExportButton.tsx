"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Database } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  selectedProducts?: string[];
  exportType?: "all" | "selected";
}

export function ExportButton({ selectedProducts = [], exportType = "all" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      
      if (exportType === "selected" && selectedProducts.length > 0) {
        params.append("product_ids", selectedProducts.join(","));
      }

      const response = await fetch(`/api/export/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = exportType === "selected" 
        ? `selected-products-${timestamp}.${format}`
        : `all-products-${timestamp}.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Products exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || (exportType === "selected" && selectedProducts.length === 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDisabled} className="gap-2">
          <Download className="h-4 w-4" />
          Export {exportType === "selected" ? `(${selectedProducts.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Export {exportType === "selected" ? "Selected" : "All"} Products
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled={loading}>
          <FileText className="mr-2 h-4 w-4" />
          CSV Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} disabled={loading}>
          <Database className="mr-2 h-4 w-4" />
          JSON Format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}