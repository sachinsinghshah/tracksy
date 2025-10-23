import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingDown, Bell, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))/95] backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-[hsl(var(--color-primary))]" />
            <span className="text-xl font-bold">Price Tracker</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Track Prices,{" "}
            <span className="text-[hsl(var(--color-primary))]">Save Money</span>
          </h1>
          <p className="mt-6 text-lg text-[hsl(var(--color-muted-foreground))]">
            Never miss a price drop again. Track products from your favorite
            e-commerce sites and get instant alerts when prices fall below your
            target.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Tracking Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))] py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Everything you need to save money
            </h2>
            <p className="mt-4 text-center text-[hsl(var(--color-muted-foreground))]">
              Powerful features to help you track and monitor product prices
            </p>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))]">
                  <TrendingDown className="h-6 w-6 text-[hsl(var(--color-primary-foreground))]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Price Tracking</h3>
                <p className="mt-2 text-sm text-[hsl(var(--color-muted-foreground))]">
                  Monitor prices from Amazon and other major retailers.
                  Automatic checks every 6 hours to catch the best deals.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))]">
                  <Bell className="h-6 w-6 text-[hsl(var(--color-primary-foreground))]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Smart Alerts</h3>
                <p className="mt-2 text-sm text-[hsl(var(--color-muted-foreground))]">
                  Set target prices and get instant email notifications when
                  products drop below your threshold.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))]">
                  <BarChart3 className="h-6 w-6 text-[hsl(var(--color-primary-foreground))]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Price History</h3>
                <p className="mt-2 text-sm text-[hsl(var(--color-muted-foreground))]">
                  View detailed price history charts to make informed decisions
                  about when to buy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="mt-16 space-y-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-primary))] text-sm font-bold text-[hsl(var(--color-primary-foreground))]">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold">Add Product URL</h3>
                <p className="mt-2 text-[hsl(var(--color-muted-foreground))]">
                  Paste the product link from Amazon or other supported
                  e-commerce sites.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-primary))] text-sm font-bold text-[hsl(var(--color-primary-foreground))]">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold">Set Target Price</h3>
                <p className="mt-2 text-[hsl(var(--color-muted-foreground))]">
                  Specify your desired price point and we'll monitor it for you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-primary))] text-sm font-bold text-[hsl(var(--color-primary-foreground))]">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold">Get Notified</h3>
                <p className="mt-2 text-[hsl(var(--color-muted-foreground))]">
                  Receive instant email alerts when the price drops below your
                  target.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted))] py-24">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to start saving?
          </h2>
          <p className="mt-4 text-lg text-[hsl(var(--color-muted-foreground))]">
            Join thousands of users tracking prices and saving money every day
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--color-border))] py-8">
        <div className="container px-4 text-center text-sm text-[hsl(var(--color-muted-foreground))]">
          <p>© 2025 Price Tracker. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
