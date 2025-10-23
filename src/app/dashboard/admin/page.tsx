"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function triggerCronJob() {
    setIsRunning(true);
    setResult(null);

    try {
      const cronSecret = prompt("Enter CRON_SECRET:");
      if (!cronSecret) {
        toast.error("CRON_SECRET required");
        return;
      }

      const response = await fetch("/api/cron/check-prices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run cron job");
      }

      setResult(data);
      toast.success("Cron job completed!", {
        description: `Checked ${data.totalProducts} products in ${data.duration}`,
      });
    } catch (error) {
      toast.error("Failed to run cron job", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Admin Tools</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manual Cron Job Trigger</CardTitle>
          <CardDescription>
            Manually trigger the price checking cron job for all active products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={triggerCronJob}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Cron Job...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Price Check Now
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Results:</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Products:</span>
                  <span className="font-medium">{result.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Successful:</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {result.successful}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="flex items-center gap-1 font-medium text-red-600">
                    <XCircle className="h-4 w-4" />
                    {result.failed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{result.duration}</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-red-600">
                    Errors:
                  </h4>
                  {result.errors.map((err: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded bg-red-50 p-2 text-xs text-red-900"
                    >
                      <div className="font-medium">
                        Product: {err.productId}
                      </div>
                      <div>{err.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Cron Schedule</CardTitle>
          <CardDescription>
            Automatic price checking configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Schedule:</span>
              <span className="font-mono">0 */6 * * *</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frequency:</span>
              <span>Every 6 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint:</span>
              <span className="font-mono">/api/cron/check-prices</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600">Active (when deployed)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
