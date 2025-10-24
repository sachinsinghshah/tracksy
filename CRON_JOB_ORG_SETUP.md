# Using cron-job.org for Price Checking

This guide shows how to use [cron-job.org](https://cron-job.org/) as an external cron service to trigger your price checking API endpoint.

## Why cron-job.org?

### Advantages over Vercel Cron Jobs:

- ✅ **No timeout limitations** - Your API route can run as long as needed
- ✅ **Puppeteer works perfectly** - No serverless function size issues
- ✅ **Free tier is generous** - Up to 60 executions per hour
- ✅ **Better monitoring** - Built-in execution history and notifications
- ✅ **More flexible** - Schedule from every minute to once per year
- ✅ **Status notifications** - Get notified when jobs fail
- ✅ **Easier debugging** - See full response data and timing

## Setup Instructions

### Step 1: Sign Up for cron-job.org

1. Go to [https://cron-job.org/](https://cron-job.org/)
2. Click **"Sign up"** (top right)
3. Create a free account
4. Verify your email address

**Free Tier Limits:**

- Unlimited cronjobs
- Up to 60 executions per hour per job
- Email notifications
- Execution history

### Step 2: Create Your Cron Job

1. **Login** to cron-job.org
2. Click **"Cronjobs"** in the sidebar
3. Click **"Create cronjob"**

#### Configure Your Job:

**Basic Settings:**

- **Title:** `Price Tracker - Check Prices`
- **Address (URL):** `https://trackey.vercel.app/api/cron/check-prices?secret=YOUR_CRON_SECRET`
  - Replace `YOUR_CRON_SECRET` with your actual `CRON_SECRET` value
  - Replace `trackey.vercel.app` with your actual Vercel URL

**Schedule:**

- Choose **"Every 6 hours"** from the dropdown
- Or use **Custom** for: `0 */6 * * *`

**Advanced Settings (Optional but Recommended):**

- **Request method:** `POST`
- **Request timeout:** `300` seconds (5 minutes)
- **Follow redirects:** Enable
- **Enable notifications:** Yes
  - **Notify on failure:** Enable
  - **Notify on success after failure:** Enable

**Save Responses:**

- Enable **"Save responses"** to see what your API returns

4. Click **"Create cronjob"**

### Step 3: Test Your Job

1. Find your newly created job in the list
2. Click the **"▶ Execute now"** button
3. Wait for execution to complete
4. Click on the execution to see:
   - Response status code (should be 200)
   - Response body (your API's JSON response)
   - Execution time
   - Any errors

**Expected Response:**

```json
{
  "message": "Price check completed",
  "totalProducts": 5,
  "successful": 5,
  "failed": 0,
  "duration": "18s"
}
```

### Step 4: Monitor Executions

**View History:**

1. Click on your cronjob
2. See **"Execution history"** tab
3. View all past executions with:
   - Timestamp
   - Status code
   - Response time
   - Response body

**Set Up Notifications:**

1. Go to **Settings** → **Notifications**
2. Add your email address
3. Choose notification preferences:
   - On failure
   - On success after previous failure
   - Weekly summary

## Security Considerations

### URL with Secret Parameter

Since we're using GET parameter for the secret, the URL is visible in cron-job.org logs. This is acceptable because:

- Only you can see the logs
- cron-job.org uses HTTPS
- Alternative is to use POST with Authorization header (see below)

### More Secure Option: POST with Authorization Header

If you want better security, configure the job with:

**Request Method:** `POST`

**Headers:** Add custom header

```
Authorization: Bearer YOUR_CRON_SECRET
```

**URL:** `https://trackey.vercel.app/api/cron/check-prices`

Your API endpoint already supports this method!

## Scheduling Options

### Pre-defined Schedules:

- **Every minute:** `* * * * *`
- **Every 5 minutes:** `*/5 * * * *`
- **Every 15 minutes:** `*/15 * * * *`
- **Every hour:** `0 * * * *`
- **Every 3 hours:** `0 */3 * * *`
- **Every 6 hours:** `0 */6 * * *` ✅ **Recommended**
- **Every 12 hours:** `0 */12 * * *`
- **Daily at 2 AM:** `0 2 * * *`
- **Twice daily (9AM, 9PM):** `0 9,21 * * *`

### Recommended Schedule:

**Every 6 hours** (`0 */6 * * *`) - This runs at:

- 12:00 AM (midnight)
- 6:00 AM
- 12:00 PM (noon)
- 6:00 PM

**All times are in your timezone** (you can select timezone in cron-job.org settings)

## Multiple Cron Jobs

You can create separate jobs for different tasks:

### 1. Price Check Job

- **Title:** `Price Tracker - Check Prices`
- **URL:** `https://trackey.vercel.app/api/cron/check-prices?secret=YOUR_SECRET`
- **Schedule:** Every 6 hours

### 2. Send Email Alerts Job (Once you implement email sending)

- **Title:** `Price Tracker - Send Alerts`
- **URL:** `https://trackey.vercel.app/api/cron/send-alerts?secret=YOUR_SECRET`
- **Schedule:** Every 15 minutes

### 3. Weekly Cleanup Job (Future)

- **Title:** `Price Tracker - Cleanup`
- **URL:** `https://trackey.vercel.app/api/cron/cleanup?secret=YOUR_SECRET`
- **Schedule:** Weekly on Sunday at 2 AM

## Monitoring & Alerts

### Enable Email Notifications

1. Go to **Settings** → **Email notifications**
2. Enable:
   - ✅ **Notify on failure**
   - ✅ **Notify on success after failure**
   - ✅ **Weekly execution summary**

### Status Pages (Premium Feature)

Create public status pages showing uptime:

- Requires paid plan
- Shows job execution success rate
- Can be embedded on your website

### Execution History

- View last 100 executions (free tier)
- See full response data
- Check execution times
- Identify patterns in failures

## Troubleshooting

### Job is Failing (HTTP 401)

**Problem:** Unauthorized error

**Solutions:**

1. Check `CRON_SECRET` is correct in URL
2. Ensure secret matches your `.env.local` and Vercel environment variables
3. Verify no typos or extra spaces

### Job is Timing Out

**Problem:** Execution exceeds timeout

**Solutions:**

1. Increase timeout in job settings (max 300 seconds)
2. Reduce number of products per run (add `.limit()` in your API)
3. Increase delay between scrapes

### Job Returns 500 Error

**Problem:** Internal server error

**Solutions:**

1. Check Vercel function logs for detailed error
2. Test API endpoint manually:
   ```bash
   curl https://trackey.vercel.app/api/cron/check-prices?secret=YOUR_SECRET
   ```
3. Check database connection
4. Verify all environment variables are set in Vercel

### Job Not Running on Schedule

**Problem:** Expected execution didn't happen

**Solutions:**

1. Check job is **enabled** (not paused)
2. Verify schedule syntax is correct
3. Check cron-job.org service status
4. Review execution history for errors

## Cost Comparison

### cron-job.org (Free Tier)

- ✅ **Cost:** FREE
- ✅ **Jobs:** Unlimited
- ✅ **Executions:** 60 per hour per job
- ✅ **Timeout:** Up to 300 seconds
- ✅ **History:** Last 100 executions

### Vercel Cron (Hobby Plan)

- ✅ **Cost:** FREE
- ❌ **Timeout:** 10 seconds only
- ❌ **Puppeteer:** Problematic
- ✅ **Native integration**

### Winner: cron-job.org 🏆

For web scraping with Puppeteer, **cron-job.org is the better choice** due to no timeout limitations and better monitoring.

## Alternative: Use Both

You can also use both services for different tasks:

**cron-job.org:**

- Heavy tasks (price scraping with Puppeteer)
- Long-running operations
- When you need detailed monitoring

**Vercel Cron:**

- Lightweight tasks (send emails, cleanup)
- Quick database queries
- Simple notifications

## Migration from Vercel Cron

If you were using Vercel Cron Jobs:

1. **Remove from `vercel.json`:**

   ```json
   {}
   ```

2. **Keep your API endpoints** - they still work!

3. **Set up jobs in cron-job.org** pointing to your API endpoints

4. **Update documentation** to reflect the change

5. **Test thoroughly** before removing Vercel cron config

## Health Check Integration

Use your health endpoint with uptime monitoring:

**Create a monitor job:**

- **URL:** `https://trackey.vercel.app/api/health`
- **Schedule:** Every 5 minutes
- **Alert if:** Response is not 200 or status is not "healthy"

This gives you:

- Uptime monitoring
- Quick detection if cron jobs stop working
- Public status page (if using paid plan)

## Best Practices

1. **Use descriptive job names** - Identify jobs easily
2. **Enable notifications** - Know when things break
3. **Save responses** - Debug issues quickly
4. **Set reasonable timeouts** - Allow enough time for scraping
5. **Monitor execution history** - Identify patterns
6. **Use POST with headers** - More secure than GET parameters
7. **Test after changes** - Use "Execute now" to verify
8. **Keep secrets secure** - Don't share logs publicly

## Quick Start Checklist

- [ ] Create cron-job.org account
- [ ] Verify email address
- [ ] Create "Check Prices" cronjob
- [ ] Set URL with your Vercel domain and CRON_SECRET
- [ ] Set schedule to every 6 hours
- [ ] Configure timeout to 300 seconds
- [ ] Enable failure notifications
- [ ] Test with "Execute now"
- [ ] Verify response is successful
- [ ] Monitor first few scheduled executions
- [ ] Set up health check monitor (optional)

## Resources

- **cron-job.org:** [https://cron-job.org/](https://cron-job.org/)
- **Documentation:** [https://cron-job.org/en/documentation/](https://cron-job.org/en/documentation/)
- **Status:** [https://status.cron-job.org/](https://status.cron-job.org/)
- **Support:** Contact form on website
- **Cron Expression Tester:** [https://crontab.guru/](https://crontab.guru/)

## FAQ

### Q: Is cron-job.org reliable?

**A:** Yes! In service since 2006 (15+ years), executes millions of jobs daily.

### Q: Will my CRON_SECRET be visible?

**A:** Only in your own job logs. Use POST with Authorization header for better security.

### Q: Can I use a custom domain?

**A:** Yes! Just use your domain in the URL instead of `trackey.vercel.app`.

### Q: What happens if Vercel is down?

**A:** cron-job.org will retry and notify you of the failure.

### Q: Can I pause a job temporarily?

**A:** Yes! Use the toggle switch next to each job.

### Q: How long are execution logs kept?

**A:** Last 100 executions on free tier.

### Q: Can I export execution history?

**A:** Not directly, but you can view and screenshot the history page.

---

## Next Steps

1. **Sign up for cron-job.org**
2. **Create your first cronjob**
3. **Test it works**
4. **Deploy your updated code** (with empty `vercel.json`)
5. **Monitor executions**

You now have a more reliable, flexible, and powerful cron job system! 🎉

---

**Last Updated:** October 24, 2025  
**Version:** 1.0.0
