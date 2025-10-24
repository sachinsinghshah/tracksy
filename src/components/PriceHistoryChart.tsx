"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatPrice } from "@/lib/utils";
import { useMemo } from "react";

interface PriceHistoryChartProps {
  data: Array<{ date: string; price: number }>;
  currency?: string;
}

export function PriceHistoryChart({ data, currency = "USD" }: PriceHistoryChartProps) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        date: new Date(d.date).toLocaleDateString(),
        price: d.price,
      })),
    [data]
  );

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="text-[hsl(var(--color-border))]" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatPrice(v, currency)} width={80} />
          <Tooltip
            formatter={(value: number) => [formatPrice(value, currency), "Price"]}
            labelFormatter={(label) => label}
          />
          <Line type="monotone" dataKey="price" stroke="hsl(var(--color-primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
