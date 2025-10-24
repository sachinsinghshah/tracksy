"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PricePoint {
  id: string;
  product_id: string;
  price: number;
  checked_at: string;
}

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number | null;
  currency: string;
  targetPrice?: number | null;
}

export function PriceHistoryChart({
  productId,
  currentPrice,
  currency,
  targetPrice,
}: PriceHistoryChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPriceHistory() {
      try {
        const response = await fetch(`/api/products/${productId}/history`);
        if (!response.ok) {
          throw new Error("Failed to fetch price history");
        }
        const data = await response.json();
        setPriceHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchPriceHistory();
  }, [productId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Failed to load price history
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                No price history available yet
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Price history will appear after the first price check
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = priceHistory.map((point) => ({
    date: new Date(point.checked_at).toLocaleDateString(),
    price: point.price,
    timestamp: new Date(point.checked_at).getTime(),
  }));

  // Calculate price trend
  const firstPrice = priceHistory[0]?.price;
  const lastPrice = priceHistory[priceHistory.length - 1]?.price;
  const priceDiff = lastPrice && firstPrice ? lastPrice - firstPrice : 0;
  const priceChangePercent =
    firstPrice && lastPrice ? ((priceDiff / firstPrice) * 100).toFixed(1) : "0";

  const getTrendIcon = () => {
    if (priceDiff > 0) return <TrendingUp className="h-4 w-4" />;
    if (priceDiff < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (priceDiff > 0) return "destructive";
    if (priceDiff < 0) return "default";
    return "secondary";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            {formatPrice(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Price History</CardTitle>
          <Badge variant={getTrendColor() as any} className="gap-1">
            {getTrendIcon()}
            {priceDiff !== 0 && (
              <>
                {priceDiff > 0 ? "+" : ""}
                {priceChangePercent}%
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatPrice(value, currency)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))" }}
              />
              {targetPrice && (
                <Line
                  type="monotone"
                  dataKey={() => targetPrice}
                  stroke="hsl(var(--destructive))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {targetPrice && (
          <div className="mt-2 text-xs text-muted-foreground">
            Dashed line shows your target price of {formatPrice(targetPrice, currency)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}