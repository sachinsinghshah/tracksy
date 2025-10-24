"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPriceCompact } from "@/lib/utils";
import { Package, TrendingDown, DollarSign } from "lucide-react";

interface CategoryBreakdownProps {
  categoryStats: Record<string, {
    count: number;
    totalValue: number;
    averagePrice: number;
    priceDrops: number;
  }>;
}

export function CategoryBreakdown({ categoryStats }: CategoryBreakdownProps) {
  const categories = Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count);

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
          <CardDescription>
            Products organized by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <p className="text-muted-foreground">
              No categorized products yet. Add categories to your products to see insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalProducts = categories.reduce((sum, [, stats]) => sum + stats.count, 0);
  const totalValue = categories.reduce((sum, [, stats]) => sum + stats.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Category Breakdown
        </CardTitle>
        <CardDescription>
          Products organized by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map(([category, stats]) => {
            const percentage = (stats.count / totalProducts) * 100;
            const valuePercentage = (stats.totalValue / totalValue) * 100;
            const priceDropRate = (stats.priceDrops / stats.count) * 100;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category}</span>
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatPriceCompact(stats.totalValue, "USD")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPriceCompact(stats.averagePrice, "USD")} avg
                    </p>
                  </div>
                </div>
                
                {/* Progress bar for product count */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Additional stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{percentage.toFixed(1)}% of products</span>
                    <span>{valuePercentage.toFixed(1)}% of value</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>{priceDropRate.toFixed(0)}% dropped</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPriceCompact(totalValue, "USD")}</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}