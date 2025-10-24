import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, TrendingDown, Mail, MailX } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function AlertsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's alerts with product information
  const { data: alerts, error } = await supabase
    .from("alerts")
    .select(`
      *,
      products (
        id,
        title,
        site,
        image_url,
        currency,
        url
      )
    `)
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("Error fetching alerts:", error);
  }

  // Get summary stats
  const totalAlerts = alerts?.length || 0;
  const emailsSent = alerts?.filter(alert => alert.email_sent).length || 0;
  const recentAlerts = alerts?.filter(alert => {
    const alertDate = new Date(alert.sent_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return alertDate >= weekAgo;
  }).length || 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))]">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Price Alerts</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-[hsl(var(--color-primary))] hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Price Alert History</h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            Track all your price drop notifications and email alerts
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlerts}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                All time price alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailsSent}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Email notifications delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingDown className="h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentAlerts}</div>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                Price drops in last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        {!alerts || alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="mb-4 h-16 w-16 text-[hsl(var(--color-muted-foreground))]" />
              <h3 className="mb-2 text-lg font-semibold">No price alerts yet</h3>
              <p className="mb-4 text-center text-[hsl(var(--color-muted-foreground))]">
                Price alerts will appear here when your tracked products drop below their target prices.
              </p>
              <Link href="/dashboard">
                <Button>Add Products to Track</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: any) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {alert.products?.image_url && (
                      <div className="h-16 w-16 overflow-hidden rounded-md bg-[hsl(var(--color-muted))] shrink-0">
                        <img
                          src={alert.products.image_url}
                          alt={alert.products.title || "Product"}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold line-clamp-2">
                            {alert.products?.title || "Product"}
                          </h3>
                          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
                            {alert.products?.site}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.email_sent ? "default" : "secondary"}>
                            {alert.email_sent ? (
                              <>
                                <Mail className="mr-1 h-3 w-3" />
                                Email Sent
                              </>
                            ) : (
                              <>
                                <MailX className="mr-1 h-3 w-3" />
                                Email Failed
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[hsl(var(--color-muted-foreground))]">Price dropped from:</span>
                          <span className="font-medium line-through">
                            {formatPrice(alert.old_price, alert.products?.currency || "USD")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[hsl(var(--color-muted-foreground))]">to:</span>
                          <span className="font-bold text-green-600">
                            {formatPrice(alert.new_price, alert.products?.currency || "USD")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[hsl(var(--color-muted-foreground))]">Savings:</span>
                          <span className="font-medium text-green-600">
                            {formatPrice(alert.old_price - alert.new_price, alert.products?.currency || "USD")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[hsl(var(--color-muted-foreground))]">
                          {getRelativeTime(new Date(alert.sent_at))}
                        </span>
                        <div className="flex gap-2">
                          {alert.products?.url && (
                            <a
                              href={alert.products.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                View Product
                              </Button>
                            </a>
                          )}
                          {alert.products?.id && (
                            <Link href={`/dashboard/products/${alert.products.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}