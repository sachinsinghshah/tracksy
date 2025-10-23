# Cron Jobs - Quick Start Guide

Get your automated price checking up and running in 5 minutes.

## Prerequisites

- ✅ Next.js app deployed to Vercel
- ✅ Supabase database configured
- ✅ Products added to your database

## Step 1: Generate CRON_SECRET

**Option A: Using OpenSSL (Linux/Mac)**

```bash
openssl rand -hex 32
```

**Option B: Using Node.js (Any platform)**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Using PowerShell (Windows)**

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copy the generated string - you'll need it in the next step.

## Step 2: Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** (paste the secret you generated)
   - **Environment:** Production (or All)
5. Click **Save**

## Step 3: Verify vercel.json

Your project already has `vercel.json` configured:

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

This runs every 6 hours at: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM (UTC)

## Step 4: Deploy

```bash
git add .
git commit -m "Configure cron jobs"
git push origin main
```

Vercel will automatically deploy and configure your cron job.

## Step 5: Verify Setup

### Check Cron Job is Registered

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Cron Jobs**
3. You should see: `/api/cron/check-prices` with schedule `0 */6 * * *`

### Test the Cron Job Manually

**Using the test script:**

```bash
# Set environment variable (use your actual secret)
export CRON_SECRET="your-generated-secret"

# Test locally
./scripts/test-cron.sh

# Test production
./scripts/test-cron.sh prod https://your-app.vercel.app
```

**Using curl:**

```bash
curl -X POST https://your-app.vercel.app/api/cron/check-prices \
  -H "Authorization: Bearer your-cron-secret"
```

**Expected response:**

```json
{
  "message": "Price check completed",
  "totalProducts": 5,
  "successful": 5,
  "failed": 0,
  "duration": "18s"
}
```

### Check Health

```bash
curl https://your-app.vercel.app/api/health
```

**Expected response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-23T14:30:00.000Z",
  "cronJob": {
    "lastExecution": "2025-10-23T12:00:00.000Z",
    "hoursSinceLastCheck": 2.5,
    "nextScheduledCheck": "Every 6 hours (0 */6 * * *)"
  },
  "stats": {
    "activeProducts": 5,
    "lastCheckedProduct": "Apple iPhone 15 Pro"
  },
  "message": "Cron job is running normally"
}
```

## Step 6: Monitor Execution

### View Logs in Vercel

1. Go to **Deployments** → Select latest deployment
2. Click **Functions**
3. Filter by `/api/cron/check-prices`
4. View execution logs

### Set Up Notifications

1. Go to **Settings** → **Notifications**
2. Enable:
   - ✅ Failed Deployments
   - ✅ Function Errors
3. Add your email or Slack webhook

## Troubleshooting

### Cron Job Not Running

**Problem:** No logs appearing, no price updates

**Solution:**

1. Check `vercel.json` is committed to repository
2. Verify environment variable is set: `CRON_SECRET`
3. Ensure deployment succeeded (check Vercel dashboard)
4. Wait for next scheduled execution (max 6 hours)

### 401 Unauthorized Error

**Problem:** Cron job returns "Unauthorized"

**Solution:**

1. Verify `CRON_SECRET` matches in Vercel dashboard
2. Redeploy after adding/changing environment variables
3. Check for typos or extra spaces in secret

### Function Timeout

**Problem:** Cron job times out before completing

**Solution:**

1. Reduce number of products (add `.limit(10)` in route.ts)
2. Increase delay between scrapes (change to 5 seconds)
3. Upgrade Vercel plan for longer timeout (60s on Pro)

### High Failure Rate

**Problem:** Many products failing to scrape

**Solution:**

1. Increase delay between requests (5-10 seconds)
2. Check if Amazon is blocking your IP
3. Update scraper user agents
4. Review error logs for specific issues

## Next Steps

### Optional: Add Email Alerts

To send email notifications when prices drop:

1. **Update vercel.json:**

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

2. **Add Resend API Key to Vercel:**
   - Settings → Environment Variables
   - Add: `RESEND_API_KEY=your-key`

3. **Implement email sending** in `src/app/api/cron/send-alerts/route.ts`

### Optional: Adjust Schedule

Change the schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */3 * * *" // Every 3 hours (more frequent)
    }
  ]
}
```

**Common schedules:**

- Every 3 hours: `0 */3 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at 9 AM UTC: `0 9 * * *`
- Twice daily (9AM, 9PM): `0 9,21 * * *`

Use [Crontab Guru](https://crontab.guru/) to test schedules.

### Optional: Set Up Monitoring

**Free monitoring services:**

- [UptimeRobot](https://uptimerobot.com/) - Monitor health endpoint
- [Cronitor](https://cronitor.io/) - Cron job monitoring
- [Sentry](https://sentry.io/) - Error tracking

**Add to health endpoint:**

```bash
# Check every 15 minutes
https://your-app.vercel.app/api/health
```

Alert if status is not "healthy".

## Summary

You now have:

- ✅ Automated price checking every 6 hours
- ✅ Secure cron endpoint with authentication
- ✅ Health monitoring endpoint
- ✅ Testing scripts for validation
- ✅ Comprehensive logging

Your price tracker will automatically:

1. Check all active products every 6 hours
2. Update prices in database
3. Record price history
4. Create alerts when prices drop below targets

## Common Commands

```bash
# Generate new secret
openssl rand -hex 32

# Test local cron
export CRON_SECRET="your-secret"
./scripts/test-cron.sh

# Test production cron
./scripts/test-cron.sh prod https://your-app.vercel.app

# Check health
curl https://your-app.vercel.app/api/health

# View Vercel logs (requires Vercel CLI)
vercel logs --follow
```

## Need Help?

- 📖 **Detailed Guide:** [CRON_JOBS_SETUP.md](./CRON_JOBS_SETUP.md)
- 🔧 **Vercel Config:** [VERCEL_CONFIGURATION.md](./VERCEL_CONFIGURATION.md)
- ✅ **Implementation Notes:** [CRON_JOBS_COMPLETE.md](./CRON_JOBS_COMPLETE.md)
- 📚 **Development Docs:** [DEVELOPMENT.md](./DEVELOPMENT.md)

---

**Estimated Setup Time:** 5 minutes  
**Last Updated:** October 23, 2025
