# Vercel Configuration Guide

This document explains the `vercel.json` configuration for the Price Tracker application.

## Overview

The `vercel.json` file configures Vercel-specific features including cron jobs, environment settings, and deployment options.

## Cron Jobs Configuration

### Current Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Recommended Multi-Job Configuration

For production with email alerts:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/send-alerts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Explanation:**

- **Check Prices**: Runs every 6 hours to scrape product prices
- **Send Alerts**: Runs every 15 minutes to send pending email notifications

### Advanced Configuration Options

#### 1. Multiple Schedules for Different Priorities

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */3 * * *",
      "description": "High-priority products (checked every 3 hours)"
    },
    {
      "path": "/api/cron/check-prices-low-priority",
      "schedule": "0 */12 * * *",
      "description": "Low-priority products (checked every 12 hours)"
    },
    {
      "path": "/api/cron/send-alerts",
      "schedule": "*/15 * * * *",
      "description": "Send email alerts for price drops"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * 0",
      "description": "Weekly cleanup - Sunday 2 AM UTC"
    }
  ]
}
```

#### 2. Region-Specific Execution

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *",
      "region": "iad1"
    }
  ]
}
```

**Available Regions:**

- `iad1` - Washington, D.C., USA (default)
- `sfo1` - San Francisco, USA
- `lhr1` - London, UK
- `fra1` - Frankfurt, Germany
- `sin1` - Singapore

**Choose based on:**

- Your database location (minimize latency)
- Target e-commerce sites (Amazon.com vs Amazon.co.uk)
- User base location

## Environment-Specific Configuration

### Development vs Production

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */12 * * *"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Schedule Recommendations by Use Case

### Conservative (Avoid Rate Limiting)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

**Best for:** New projects, high product count, testing phase

### Balanced (Recommended)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Best for:** Most production use cases, moderate product count

### Aggressive (Maximum Freshness)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

**Best for:** Time-sensitive deals, flash sales, premium users

### Alert-Only (Separate from Scraping)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/send-alerts",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Best for:** Ensuring alerts are sent quickly after price drops

## Schedule Patterns Cheatsheet

```
Cron Format: [minute] [hour] [day] [month] [day-of-week]

Every 5 minutes:          */5 * * * *
Every 15 minutes:         */15 * * * *
Every 30 minutes:         */30 * * * *
Every hour:               0 * * * *
Every 2 hours:            0 */2 * * *
Every 3 hours:            0 */3 * * *
Every 6 hours:            0 */6 * * *
Every 12 hours:           0 */12 * * *
Daily at midnight:        0 0 * * *
Daily at 2 AM:            0 2 * * *
Daily at 9 AM:            0 9 * * *
Twice daily (9AM, 9PM):   0 9,21 * * *
Weekdays at 9 AM:         0 9 * * 1-5
Weekends only:            0 0 * * 0,6
First day of month:       0 0 1 * *
Every Sunday:             0 0 * * 0
Every Monday 9 AM:        0 9 * * 1
```

## Testing Your Configuration

### 1. Validate Cron Syntax

Use [Crontab Guru](https://crontab.guru/) to validate your schedule.

Example: `0 */6 * * *`

- Visit: https://crontab.guru/#0_*/6_*__\__
- Verify the human-readable output

### 2. Test Locally

```bash
# Check syntax
cat vercel.json | jq .

# Validate JSON
npx vercel dev
```

### 3. Deploy to Preview

```bash
vercel --prod=false
```

Check preview deployment to verify cron jobs are detected.

## Monitoring & Debugging

### View Cron Job Status

1. **Vercel Dashboard**
   - Go to Project → Settings → Cron Jobs
   - View configured jobs and schedules
   - See last execution time

2. **Function Logs**
   - Go to Project → Deployments → Functions
   - Filter by `/api/cron/*`
   - View execution logs

3. **Health Check**
   - Visit: `https://your-app.vercel.app/api/health`
   - Check `lastExecution` timestamp
   - Verify `hoursSinceLastCheck` is reasonable

### Common Issues

#### Cron Jobs Not Running

**Symptoms:**

- No logs in function viewer
- Health check shows stale data

**Solutions:**

1. Verify `vercel.json` is in repository root
2. Check JSON syntax is valid
3. Confirm deployment succeeded
4. Review Vercel plan (Hobby has limits)
5. Check for deployment errors

#### Jobs Timing Out

**Symptoms:**

- Partial execution
- Timeout errors in logs

**Solutions:**

1. Reduce products per run (add `.limit()`)
2. Increase delay between scrapes
3. Upgrade Vercel plan (longer timeouts)
4. Split into multiple smaller jobs

## Cost Optimization

### Function Execution Limits

**Hobby Plan:**

- 100 GB-hours/month included
- 10-second timeout

**Pro Plan:**

- 1,000 GB-hours/month included
- 60-second timeout

### Calculate Your Usage

```
Formula: (Products × 3 seconds × Runs per Day × 30 days) / 3600

Example 1 (Small):
  10 products × 3s × 4 runs/day × 30 days = 3,600 seconds = 1 hour/month ✅

Example 2 (Medium):
  50 products × 3s × 4 runs/day × 30 days = 18,000 seconds = 5 hours/month ✅

Example 3 (Large):
  200 products × 3s × 4 runs/day × 30 days = 72,000 seconds = 20 hours/month ⚠️

Example 4 (Enterprise):
  1000 products × 3s × 8 runs/day × 30 days = 720,000 seconds = 200 hours/month ❌
```

### Optimization Strategies

1. **Smart Scheduling**

   ```typescript
   // Check popular products more often
   const priority = product.views > 100 ? "high" : "low";
   ```

2. **Batch Processing**

   ```typescript
   // Process only 50 products per run
   .limit(50)
   .order("last_checked", { ascending: true })
   ```

3. **Skip Recent Checks**
   ```typescript
   // Skip products checked in last 4 hours
   const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
   .filter("last_checked", "lt", fourHoursAgo.toISOString())
   ```

## Security Best Practices

### 1. Protect Cron Endpoints

✅ Always use `CRON_SECRET` authentication
✅ Validate Authorization header
✅ Return 401 for invalid requests

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2. Rate Limiting

✅ Implement delays between requests
✅ Respect target site's terms of service
✅ Use legitimate user agents

```typescript
await delay(3000); // 3 seconds between products
```

### 3. Error Handling

✅ Catch all exceptions
✅ Log errors for monitoring
✅ Return appropriate status codes

```typescript
try {
  // ... cron logic
} catch (error) {
  console.error("[Cron] Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

## Additional Configuration Options

### Headers

```json
{
  "headers": [
    {
      "source": "/api/cron/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    }
  ]
}
```

### Redirects

```json
{
  "redirects": [
    {
      "source": "/cron/:path*",
      "destination": "/api/cron/:path*",
      "permanent": false
    }
  ]
}
```

## Example: Complete Production Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/send-alerts",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * 0"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Crontab Guru](https://crontab.guru/) - Schedule tester
- [Vercel Limits](https://vercel.com/docs/platform/limits)

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0
