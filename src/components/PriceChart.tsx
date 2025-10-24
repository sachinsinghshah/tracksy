"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from "lucide-react";

interface PriceData {
  price: number;
  checked_at: string;
}

interface PriceChartProps {
  productId: string;
  productTitle?: string;
  currentPrice?: number;
  targetPrice?: number;
  currency?: string;
}

export function PriceChart({
  productId,
  productTitle,
  currentPrice,
  targetPrice,
  currency = "USD",
}: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    fetchPriceHistory();
  }, [productId, timeRange]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/products/${productId}/price-history?range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price history");
      }

      const data = await response.json();
      setPriceData(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load price data");
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: PriceData[]) => {
    return data.map((item) => ({
      ...item,
      date: formatDate(new Date(item.checked_at)),
      price: Number(item.price),
    }));
  };

  const calculatePriceChange = () => {
    if (priceData.length < 2) return null;

    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      change,
      changePercent,
      isPositive: change > 0,
    };
  };

  const getPriceStats = () => {
    if (priceData.length === 0) return null;

    const prices = priceData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    return { min, max, avg };
  };

  const priceChange = calculatePriceChange();
  const stats = getPriceStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>Loading price data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPriceHistory} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (priceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>No price data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <p className="text-muted-foreground">
              Price tracking will begin once the product is checked for the first time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData(priceData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price History
            </CardTitle>
            <CardDescription>
              {productTitle && (
                <span className="line-clamp-1">{productTitle}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {["7d", "30d", "90d", "all"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range as any)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Price Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-lg font-semibold">
              {currentPrice ? formatPrice(currentPrice, currency) : "—"}
            </p>
          </div>
          {priceChange && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Change</p>
              <div className="flex items-center justify-center gap-1">
                {priceChange.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : priceChange.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-lg font-semibold ${
                    priceChange.isPositive
                      ? "text-green-500"
                      : priceChange.change < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatPrice(Math.abs(priceChange.change), currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                ({priceChange.changePercent.toFixed(1)}%)
              </p>
            </div>
          )}
          {stats && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Lowest</p>
                <p className="text-lg font-semibold text-red-500">
                  {formatPrice(stats.min, currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Highest</p>
                <p className="text-lg font-semibold text-green-500">
                  {formatPrice(stats.max, currency)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Chart */}
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
                tickFormatter={(value) => formatPrice(value, currency, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm">
                          Price: {formatPrice(payload[0].value as number, currency)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
              {targetPrice && (
                <ReferenceLine
                  y={targetPrice}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  label={{ value: "Target", position: "topRight" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {priceData.length} data point{priceData.length !== 1 ? "s" : ""}
            </span>
          </div>
          {stats && (
            <div className="text-right">
              <span>Avg: {formatPrice(stats.avg, currency)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}