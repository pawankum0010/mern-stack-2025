# Install Security Packages

To enable all security features, you need to install the following packages:

## Installation Command

```bash
cd backend
npm install helmet express-rate-limit
```

## What These Packages Do

### helmet
- Sets various HTTP headers to help secure Express apps
- Protects against common web vulnerabilities like XSS, clickjacking, etc.
- Already configured in `src/app.js`

### express-rate-limit
- Basic rate-limiting middleware for Express
- Prevents brute force attacks and API abuse
- Already configured in `src/middlewares/security.js`

## After Installation

Once installed, restart your backend server:

```bash
npm run dev
```

The security features will be automatically enabled.

## Verification

After installation, you can verify security headers are working by:

1. Making a request to your API
2. Checking response headers in browser dev tools or using:
   ```bash
   curl -I http://localhost:5000/api/health
   ```

You should see security headers like:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- And more...

