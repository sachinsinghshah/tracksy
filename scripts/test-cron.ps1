# PowerShell Script to Test Cron Job
# Usage: 
#   Local: .\scripts\test-cron.ps1
#   Production: .\scripts\test-cron.ps1 -Environment prod -Url "https://your-app.vercel.app"

param(
    [string]$Environment = "local",
    [string]$Url = ""
)

Write-Host "`n=== Price Tracker - Cron Job Test Script ===" -ForegroundColor Yellow
Write-Host ""

# Check if CRON_SECRET is set
if (-not $env:CRON_SECRET) {
    Write-Host "Error: CRON_SECRET environment variable is not set" -ForegroundColor Red
    Write-Host "Please set it first:" -ForegroundColor Yellow
    Write-Host '  $env:CRON_SECRET = "your-secret-here"'
    Write-Host "  or load from .env.local file"
    exit 1
}

# Determine endpoint URL
if ($Environment -eq "prod" -or $Environment -eq "production") {
    if ([string]::IsNullOrEmpty($Url)) {
        Write-Host "Error: Production URL required" -ForegroundColor Red
        Write-Host "Usage: .\test-cron.ps1 -Environment prod -Url https://your-app.vercel.app" -ForegroundColor Yellow
        exit 1
    }
    $endpoint = "$Url/api/cron/check-prices"
    $envName = "PRODUCTION"
}
else {
    $endpoint = "http://localhost:3000/api/cron/check-prices"
    $envName = "LOCAL"
}

Write-Host "Environment: $envName" -ForegroundColor Yellow
Write-Host "Endpoint: $endpoint" -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $env:CRON_SECRET"
    "Content-Type"  = "application/json"
}

Write-Host "Triggering cron job..." -ForegroundColor Yellow
Write-Host ""

# Make request
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method POST -Headers $headers -UseBasicParsing
    
    Write-Host "Response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Success! HTTP $($response.StatusCode)" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Unexpected status! HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Response:" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
        
        # Try to read error response body
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host $responseBody
        Write-Host ""
    }
    Write-Host "✗ Failed! $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Yellow
Write-Host ""

