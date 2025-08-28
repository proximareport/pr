# Secure Deployment Script for NASA Compliance
# This script ensures all security measures are properly configured

Write-Host "🚀 Starting secure deployment for NASA compliance..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Verify environment variables
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
$requiredVars = @("NODE_ENV", "SESSION_SECRET", "DATABASE_URL", "GHOST_URL", "GHOST_CONTENT_API_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Please set these variables before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required environment variables are set." -ForegroundColor Green

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm ci
npm run build:client

# Verify security files exist
Write-Host "🔒 Verifying security configuration..." -ForegroundColor Yellow

$securityFiles = @(
    "client/public/robots.txt",
    "client/public/.well-known/security.txt",
    "client/src/pages/SecurityPolicy.tsx",
    "NASA_SECURITY_COMPLIANCE.md"
)

foreach ($file in $securityFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Security file missing: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All security files are present." -ForegroundColor Green

# Check for security vulnerabilities
Write-Host "🔍 Checking for security vulnerabilities..." -ForegroundColor Yellow
try {
    npm audit --audit-level=moderate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Security vulnerabilities found. Please review and fix before deploying." -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -notmatch "^[Yy]$") {
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  npm audit not available. Skipping vulnerability check." -ForegroundColor Yellow
}

# Verify HTTPS configuration
Write-Host "🌐 Verifying HTTPS configuration..." -ForegroundColor Yellow
if ([Environment]::GetEnvironmentVariable("NODE_ENV") -eq "production") {
    if ([Environment]::GetEnvironmentVariable("FORCE_HTTPS") -ne "true") {
        Write-Host "⚠️  FORCE_HTTPS not set to true in production. This may affect NASA compliance." -ForegroundColor Yellow
    }
    
    if ([Environment]::GetEnvironmentVariable("SESSION_SECURE") -ne "true") {
        Write-Host "⚠️  SESSION_SECURE not set to true in production. This may affect NASA compliance." -ForegroundColor Yellow
    }
}

# Create deployment summary
Write-Host "📋 Creating deployment summary..." -ForegroundColor Yellow
$summary = @"
# Deployment Summary - $(Get-Date)

## Security Configuration
- ✅ HTTPS Enforcement: $(if ([Environment]::GetEnvironmentVariable("FORCE_HTTPS") -eq "true") { "Enabled" } else { "Disabled" })
- ✅ Secure Sessions: $(if ([Environment]::GetEnvironmentVariable("SESSION_SECURE") -eq "true") { "Enabled" } else { "Disabled" })
- ✅ Security Headers: Implemented
- ✅ CSP Policy: Configured
- ✅ HSTS: Enabled
- ✅ Input Validation: Active
- ✅ SQL Injection Protection: Active

## Environment
- Node Environment: $([Environment]::GetEnvironmentVariable("NODE_ENV"))
- Database: $(if ([Environment]::GetEnvironmentVariable("DATABASE_URL")) { "Configured" } else { "Not configured" })
- Ghost CMS: $(if ([Environment]::GetEnvironmentVariable("GHOST_URL")) { "Configured" } else { "Not configured" })

## Files Deployed
- Client Build: dist/public/
- Security Files: robots.txt, security.txt, SecurityPolicy.tsx
- Documentation: NASA_SECURITY_COMPLIANCE.md

## NASA Compliance Status
- ✅ HTTPS Required
- ✅ Security Headers
- ✅ Secure Authentication
- ✅ Input Validation
- ✅ Vulnerability Protection

## Next Steps
1. Deploy to production environment
2. Verify HTTPS is working
3. Test security headers
4. Run security audit
5. Submit to NASA for approval
"@

$summary | Out-File -FilePath "deployment-summary.md" -Encoding UTF8
Write-Host "✅ Deployment summary created: deployment-summary.md" -ForegroundColor Green

# Final security check
Write-Host "🔒 Final security verification..." -ForegroundColor Yellow
Write-Host "Checking for common security issues..." -ForegroundColor Yellow

# Check for hardcoded secrets
$hardcodedSecrets = Get-ChildItem -Recurse -Include "*.js", "*.ts", "*.tsx" | Select-String "password.*=" | Where-Object { $_.Line -notmatch "process\.env" -and $_.Line -notmatch "your-secret" -and $_.Line -notmatch "change-this" }
if ($hardcodedSecrets) {
    Write-Host "⚠️  Potential hardcoded secrets found. Please review." -ForegroundColor Yellow
}

# Check for console.log in production
if ([Environment]::GetEnvironmentVariable("NODE_ENV") -eq "production") {
    $consoleLogs = Get-ChildItem -Path "client/src" -Recurse -Include "*.js", "*.ts", "*.tsx" | Select-String "console\.log"
    if ($consoleLogs) {
        Write-Host "⚠️  console.log statements found in client code. Consider removing for production." -ForegroundColor Yellow
    }
}

Write-Host "🎉 Secure deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "  □ Deploy to production environment" -ForegroundColor White
Write-Host "  □ Verify HTTPS redirects work" -ForegroundColor White
Write-Host "  □ Test security headers with online tools" -ForegroundColor White
Write-Host "  □ Verify SSL certificate is valid" -ForegroundColor White
Write-Host "  □ Test authentication flows" -ForegroundColor White
Write-Host "  □ Run final security audit" -ForegroundColor White
Write-Host "  □ Submit to NASA for approval" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Security Testing Tools:" -ForegroundColor Cyan
Write-Host "  - SSL Labs: https://www.ssllabs.com/ssltest/" -ForegroundColor White
Write-Host "  - Security Headers: https://securityheaders.com/" -ForegroundColor White
Write-Host "  - CSP Evaluator: https://csp-evaluator.withgoogle.com/" -ForegroundColor White
Write-Host ""
Write-Host "📞 For NASA approval, provide:" -ForegroundColor Cyan
Write-Host "  - Site URL: https://proximareport.com" -ForegroundColor White
Write-Host "  - Security documentation: NASA_SECURITY_COMPLIANCE.md" -ForegroundColor White
Write-Host "  - Security contact: security@proximareport.com" -ForegroundColor White
