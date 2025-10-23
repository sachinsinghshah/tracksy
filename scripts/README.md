# Test Scripts

This directory contains helper scripts for testing and managing the Price Tracker application.

## Available Scripts

### test-cron.sh (Bash)

Test the cron job endpoint on Linux/Mac/WSL.

**Usage:**

```bash
# Test local development server
export CRON_SECRET="your-secret"
./scripts/test-cron.sh

# Test production deployment
./scripts/test-cron.sh prod https://your-app.vercel.app
```

**Requirements:**

- `curl` (installed by default on most systems)
- `jq` (optional, for pretty JSON output)
- `CRON_SECRET` environment variable

**Make executable (if needed):**

```bash
chmod +x scripts/test-cron.sh
```

### test-cron.ps1 (PowerShell)

Test the cron job endpoint on Windows.

**Usage:**

```powershell
# Test local development server
$env:CRON_SECRET = "your-secret"
.\scripts\test-cron.ps1

# Test production deployment
.\scripts\test-cron.ps1 -Environment prod -Url "https://your-app.vercel.app"
```

**Requirements:**

- PowerShell 5.1+ (included in Windows)
- `CRON_SECRET` environment variable

**Set environment variable:**

```powershell
# Temporary (current session only)
$env:CRON_SECRET = "your-secret"

# Permanent (user level)
[System.Environment]::SetEnvironmentVariable('CRON_SECRET', 'your-secret', 'User')
```

## Loading Environment Variables

### From .env.local (Bash)

```bash
# Export all variables from .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Or use source (if using bash/zsh)
source .env.local
```

### From .env.local (PowerShell)

```powershell
# Load .env.local variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value)
    }
}
```

## Testing Workflow

### 1. Local Testing

```bash
# Start dev server
npm run dev

# In another terminal
export CRON_SECRET="your-local-secret"
./scripts/test-cron.sh
```

**Expected output:**

```
=== Price Tracker - Cron Job Test Script ===

Environment: LOCAL
Endpoint: http://localhost:3000/api/cron/check-prices
Timestamp: Wed Oct 23 14:30:00 UTC 2025

Triggering cron job...

Response:
{
  "message": "Price check completed",
  "totalProducts": 5,
  "successful": 5,
  "failed": 0,
  "duration": "18s"
}

✓ Success! HTTP 200

=== Test Complete ===
```

### 2. Production Testing

```bash
# Use production secret
export CRON_SECRET="your-production-secret"
./scripts/test-cron.sh prod https://your-app.vercel.app
```

### 3. CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Test Cron Endpoint
  env:
    CRON_SECRET: ${{ secrets.CRON_SECRET }}
  run: |
    ./scripts/test-cron.sh prod https://your-app.vercel.app
```

## Troubleshooting

### "Permission denied" error (Bash)

```bash
chmod +x scripts/test-cron.sh
```

### "jq: command not found" (Bash)

The script will still work, but JSON won't be pretty-printed.

**Install jq:**

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (WSL)
sudo apt-get install jq
```

### "CRON_SECRET environment variable is not set"

```bash
# Set it temporarily
export CRON_SECRET="your-secret"

# Or load from .env.local
source .env.local
```

### Connection refused (Local)

Make sure your development server is running:

```bash
npm run dev
```

### 401 Unauthorized

- Verify `CRON_SECRET` matches the one in your `.env.local` or Vercel dashboard
- Check for typos or extra spaces
- Ensure environment variables are loaded

### SSL/TLS errors (Production)

```bash
# Use --insecure flag if testing with self-signed cert
curl --insecure -X POST ...
```

## Advanced Usage

### Test with custom headers

```bash
curl -X POST http://localhost:3000/api/cron/check-prices \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -v  # Verbose output
```

### Test with timeout

```bash
# Timeout after 60 seconds
curl --max-time 60 -X POST ...
```

### Save response to file

```bash
./scripts/test-cron.sh > cron-test-result.json
```

### Test in loop (monitor over time)

```bash
# Test every 5 minutes for 1 hour
for i in {1..12}; do
  echo "Test $i at $(date)"
  ./scripts/test-cron.sh
  sleep 300
done
```

## Creating Additional Test Scripts

### Example: Test Health Endpoint

**scripts/test-health.sh**

```bash
#!/bin/bash

URL="${1:-http://localhost:3000}"
ENDPOINT="$URL/api/health"

echo "Testing health endpoint: $ENDPOINT"
curl -s "$ENDPOINT" | jq .
```

**Usage:**

```bash
./scripts/test-health.sh
./scripts/test-health.sh https://your-app.vercel.app
```

### Example: Batch Product Testing

**scripts/test-all-products.sh**

```bash
#!/bin/bash

# Test scraping for each product
PRODUCTS=(
  "https://www.amazon.com/dp/B0ABCD123"
  "https://www.amazon.com/dp/B0EFGH456"
)

for url in "${PRODUCTS[@]}"; do
  echo "Testing: $url"
  curl -X POST http://localhost:3000/api/scrape \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" | jq .
  sleep 3
done
```

## Script Development Tips

### Debugging

Add `set -x` to see each command as it executes:

```bash
#!/bin/bash
set -x  # Enable debugging
# ... rest of script
```

### Error handling

Use `set -e` to exit on first error:

```bash
#!/bin/bash
set -e  # Exit on error
# ... rest of script
```

### Logging

Add timestamp to logs:

```bash
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $@"
}

log "Starting cron test"
```

## Related Documentation

- [CRON_QUICK_START.md](../CRON_QUICK_START.md) - Quick setup guide
- [CRON_JOBS_SETUP.md](../CRON_JOBS_SETUP.md) - Complete cron documentation
- [VERCEL_CONFIGURATION.md](../VERCEL_CONFIGURATION.md) - Vercel config guide

---

**Last Updated:** October 23, 2025
