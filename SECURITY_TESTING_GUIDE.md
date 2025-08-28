# Security Testing Guide for NASA Compliance

## Overview
This guide provides step-by-step instructions for testing the security implementation to ensure NASA compliance.

## 🔍 Pre-Deployment Testing

### 1. Local Security Testing

#### Test HTTPS Enforcement
```bash
# Start the development server
npm run dev

# Test HTTP to HTTPS redirect
curl -I http://localhost:5000
# Should return 301 redirect to HTTPS
```

#### Test Security Headers
```bash
# Test security headers
curl -I https://localhost:5000
# Should include:
# - Strict-Transport-Security
# - Content-Security-Policy
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
```

#### Test Session Security
```bash
# Test secure session cookies
curl -c cookies.txt -b cookies.txt https://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Check cookie attributes
cat cookies.txt
# Should show: HttpOnly, Secure, SameSite=Strict
```

### 2. Build Testing
```bash
# Run security deployment script
./scripts/deploy-secure.sh
# or on Windows:
# powershell -ExecutionPolicy Bypass -File scripts/deploy-secure.ps1
```

## 🌐 Production Testing

### 1. SSL/TLS Testing

#### SSL Labs Test
1. Visit: https://www.ssllabs.com/ssltest/
2. Enter your domain: `proximareport.com`
3. Wait for analysis to complete
4. **Target Grade: A+**

#### Manual SSL Verification
```bash
# Test SSL certificate
openssl s_client -connect proximareport.com:443 -servername proximareport.com

# Check certificate details
echo | openssl s_client -connect proximareport.com:443 2>/dev/null | openssl x509 -noout -text
```

### 2. Security Headers Testing

#### Security Headers Test
1. Visit: https://securityheaders.com/
2. Enter your domain: `https://proximareport.com`
3. **Target Grade: A**

#### Manual Header Testing
```bash
# Test all security headers
curl -I https://proximareport.com

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=()...
```

### 3. HTTPS Enforcement Testing

#### HTTP to HTTPS Redirect
```bash
# Test HTTP redirect
curl -I http://proximareport.com
# Should return: 301 Moved Permanently
# Location: https://proximareport.com/...
```

#### HSTS Testing
```bash
# Test HSTS header
curl -I https://proximareport.com | grep -i "strict-transport-security"
# Should return: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 4. Content Security Policy Testing

#### CSP Evaluator
1. Visit: https://csp-evaluator.withgoogle.com/
2. Enter your domain: `https://proximareport.com`
3. Review CSP violations and warnings

#### Manual CSP Testing
```bash
# Test CSP header
curl -I https://proximareport.com | grep -i "content-security-policy"
# Should return comprehensive CSP policy
```

### 5. Authentication Security Testing

#### Login Security
```bash
# Test login endpoint
curl -X POST https://proximareport.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Should return appropriate error for invalid credentials
# Should not leak information about user existence
```

#### Session Security
```bash
# Test session cookie security
curl -c cookies.txt -b cookies.txt https://proximareport.com/api/me
# Check cookies.txt for secure attributes
```

### 6. API Security Testing

#### Input Validation
```bash
# Test SQL injection protection
curl -X POST https://proximareport.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com; DROP TABLE users; --","password":"test"}'

# Test XSS protection
curl -X POST https://proximareport.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>@example.com","password":"test"}'
```

#### CORS Testing
```bash
# Test CORS configuration
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS https://proximareport.com/api/login
```

## 🛡️ Vulnerability Testing

### 1. OWASP ZAP Testing
1. Download OWASP ZAP: https://www.zaproxy.org/
2. Configure proxy settings
3. Run automated scan on: `https://proximareport.com`
4. Review findings and fix any issues

### 2. Manual Penetration Testing

#### Directory Traversal
```bash
# Test for directory traversal
curl https://proximareport.com/../../../etc/passwd
curl https://proximareport.com/..%2F..%2F..%2Fetc%2Fpasswd
```

#### Information Disclosure
```bash
# Test for information disclosure
curl https://proximareport.com/.env
curl https://proximareport.com/config.json
curl https://proximareport.com/package.json
```

#### Error Handling
```bash
# Test error handling
curl https://proximareport.com/nonexistent-page
curl https://proximareport.com/api/nonexistent-endpoint
# Should return generic error messages without sensitive information
```

## 📊 Performance and Load Testing

### 1. Load Testing
```bash
# Basic load test with Apache Bench
ab -n 1000 -c 10 https://proximareport.com/

# Test with different endpoints
ab -n 100 -c 5 https://proximareport.com/api/health
```

### 2. Stress Testing
```bash
# Stress test with multiple concurrent requests
for i in {1..10}; do
  curl -s https://proximareport.com/api/health &
done
wait
```

## 🔧 Monitoring and Logging

### 1. Health Check Monitoring
```bash
# Test health check endpoint
curl https://proximareport.com/api/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 2. Error Logging
```bash
# Test error logging
curl https://proximareport.com/api/nonexistent
# Check server logs for proper error logging
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] All security headers implemented
- [ ] HTTPS enforcement working
- [ ] Session security configured
- [ ] Input validation active
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] No hardcoded secrets
- [ ] Error handling secure
- [ ] Logging configured

### Post-Deployment
- [ ] SSL Labs A+ rating
- [ ] Security Headers A rating
- [ ] CSP compliance verified
- [ ] Authentication flows tested
- [ ] API security tested
- [ ] Vulnerability scan clean
- [ ] Performance acceptable
- [ ] Monitoring active

## 🚨 Incident Response

### Security Incident Checklist
1. **Immediate Response**
   - [ ] Assess severity
   - [ ] Isolate affected systems
   - [ ] Document incident

2. **Investigation**
   - [ ] Analyze logs
   - [ ] Identify root cause
   - [ ] Assess impact

3. **Remediation**
   - [ ] Apply fixes
   - [ ] Test solutions
   - [ ] Deploy updates

4. **Communication**
   - [ ] Notify stakeholders
   - [ ] Update security documentation
   - [ ] Report to authorities if required

## 📞 Security Contacts

### Internal Contacts
- **Security Team**: security@proximareport.com
- **Technical Lead**: [Your technical contact]
- **Management**: [Your management contact]

### External Contacts
- **NASA Security**: [NASA security contact]
- **Hosting Provider**: Render support
- **SSL Provider**: Render SSL support

## 📚 Additional Resources

### Security Tools
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **OWASP ZAP**: https://www.zaproxy.org/
- **Mozilla Observatory**: https://observatory.mozilla.org/

### Documentation
- **NASA Security Requirements**: [NASA security documentation]
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Security Headers Guide**: https://securityheaders.com/guide
- **CSP Guide**: https://content-security-policy.com/

---

**Last Updated**: January 2025  
**Next Review**: April 2025  
**Testing Frequency**: Before each deployment
