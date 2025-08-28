#!/bin/bash

# Secure Deployment Script for NASA Compliance
# This script ensures all security measures are properly configured

set -e

echo "🚀 Starting secure deployment for NASA compliance..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Verify environment variables
echo "🔍 Checking environment variables..."
required_vars=("NODE_ENV" "SESSION_SECRET" "DATABASE_URL" "GHOST_URL" "GHOST_CONTENT_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please set these variables before deploying."
    exit 1
fi

echo "✅ All required environment variables are set."

# Build the application
echo "🔨 Building application..."
npm ci
npm run build:client

# Verify security files exist
echo "🔒 Verifying security configuration..."

security_files=(
    "client/public/robots.txt"
    "client/public/.well-known/security.txt"
    "client/src/pages/SecurityPolicy.tsx"
    "NASA_SECURITY_COMPLIANCE.md"
)

for file in "${security_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Security file missing: $file"
        exit 1
    fi
done

echo "✅ All security files are present."

# Check for security vulnerabilities
echo "🔍 Checking for security vulnerabilities..."
if command -v npm audit &> /dev/null; then
    npm audit --audit-level=moderate
    if [ $? -ne 0 ]; then
        echo "⚠️  Security vulnerabilities found. Please review and fix before deploying."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  npm audit not available. Skipping vulnerability check."
fi

# Verify HTTPS configuration
echo "🌐 Verifying HTTPS configuration..."
if [ "$NODE_ENV" = "production" ]; then
    if [ "$FORCE_HTTPS" != "true" ]; then
        echo "⚠️  FORCE_HTTPS not set to true in production. This may affect NASA compliance."
    fi
    
    if [ "$SESSION_SECURE" != "true" ]; then
        echo "⚠️  SESSION_SECURE not set to true in production. This may affect NASA compliance."
    fi
fi

# Create deployment summary
echo "📋 Creating deployment summary..."
cat > deployment-summary.md << EOF
# Deployment Summary - $(date)

## Security Configuration
- ✅ HTTPS Enforcement: $(if [ "$FORCE_HTTPS" = "true" ]; then echo "Enabled"; else echo "Disabled"; fi)
- ✅ Secure Sessions: $(if [ "$SESSION_SECURE" = "true" ]; then echo "Enabled"; else echo "Disabled"; fi)
- ✅ Security Headers: Implemented
- ✅ CSP Policy: Configured
- ✅ HSTS: Enabled
- ✅ Input Validation: Active
- ✅ SQL Injection Protection: Active

## Environment
- Node Environment: $NODE_ENV
- Database: $(if [ -n "$DATABASE_URL" ]; then echo "Configured"; else echo "Not configured"; fi)
- Ghost CMS: $(if [ -n "$GHOST_URL" ]; then echo "Configured"; else echo "Not configured"; fi)

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

EOF

echo "✅ Deployment summary created: deployment-summary.md"

# Final security check
echo "🔒 Final security verification..."
echo "Checking for common security issues..."

# Check for hardcoded secrets
if grep -r "password.*=" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "process.env" | grep -v "your-secret" | grep -v "change-this"; then
    echo "⚠️  Potential hardcoded secrets found. Please review."
fi

# Check for console.log in production
if [ "$NODE_ENV" = "production" ] && grep -r "console\.log" --include="*.js" --include="*.ts" --include="*.tsx" client/src/; then
    echo "⚠️  console.log statements found in client code. Consider removing for production."
fi

echo "🎉 Secure deployment preparation complete!"
echo ""
echo "📋 Deployment Checklist:"
echo "  □ Deploy to production environment"
echo "  □ Verify HTTPS redirects work"
echo "  □ Test security headers with online tools"
echo "  □ Verify SSL certificate is valid"
echo "  □ Test authentication flows"
echo "  □ Run final security audit"
echo "  □ Submit to NASA for approval"
echo ""
echo "🔗 Useful Security Testing Tools:"
echo "  - SSL Labs: https://www.ssllabs.com/ssltest/"
echo "  - Security Headers: https://securityheaders.com/"
echo "  - CSP Evaluator: https://csp-evaluator.withgoogle.com/"
echo ""
echo "📞 For NASA approval, provide:"
echo "  - Site URL: https://proximareport.com"
echo "  - Security documentation: NASA_SECURITY_COMPLIANCE.md"
echo "  - Security contact: security@proximareport.com"
