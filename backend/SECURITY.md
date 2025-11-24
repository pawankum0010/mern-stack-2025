# Security Configuration Guide

This document outlines the security measures implemented in the application to prevent hacking and unauthorized access.

## Security Files Added

### 1. robots.txt
- **Location**: `frontend/public/robots.txt`
- **Purpose**: Prevents search engine crawlers from indexing sensitive areas
- **Protected Areas**:
  - Admin panel (`/admin/`)
  - API endpoints (`/api/`)
  - User dashboard (`/dashboard/`)
  - Authentication pages (`/login`, `/signup`)
  - User data pages (`/profile/`, `/orders/`, `/addresses/`)

### 2. security.txt
- **Location**: `frontend/public/security.txt`
- **Purpose**: Provides security researchers with contact information for reporting vulnerabilities
- **Note**: Update the contact email and URLs with your actual domain information

### 3. Security Headers (Helmet)
- **Location**: `backend/src/app.js`
- **Purpose**: Sets HTTP security headers to prevent common attacks
- **Headers Included**:
  - Content Security Policy (CSP)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Strict-Transport-Security (HSTS)

### 4. Rate Limiting
- **Location**: `backend/src/middlewares/security.js`
- **Purpose**: Prevents brute force attacks and API abuse
- **Rate Limits**:
  - General API: 100 requests per 15 minutes
  - Authentication: 5 requests per 15 minutes
  - Password Reset: 3 requests per hour
  - Registration: 3 requests per hour
  - Admin Endpoints: 200 requests per 15 minutes

### 5. Input Validation
- **Location**: `backend/src/middlewares/validateInput.js`
- **Purpose**: Sanitizes user input to prevent XSS and injection attacks
- **Features**:
  - Removes script tags
  - Removes JavaScript protocol handlers
  - Removes event handlers
  - Trims whitespace

## Installation

To enable all security features, install the required packages:

```bash
cd backend
npm install helmet express-rate-limit
```

## Configuration

### Update security.txt
Edit `frontend/public/security.txt` and replace placeholder values:
- `yourdomain.com` → Your actual domain
- `security@yourdomain.com` → Your security contact email

### Update robots.txt
If you have a sitemap, uncomment and update the sitemap URL in `frontend/public/robots.txt`.

### Environment Variables
Add to your `.env` file:
```env
FRONTEND_URL=http://localhost:3000
```

## Applying Rate Limiters to Routes

To apply specific rate limiters to routes, import and use them:

```javascript
const { authLimiter, passwordResetLimiter, registerLimiter } = require('../middlewares/security');

// Apply to login route
router.post('/login', authLimiter, loginController);

// Apply to password reset route
router.post('/reset-password', passwordResetLimiter, resetPasswordController);

// Apply to registration route
router.post('/register', registerLimiter, registerController);
```

## Additional Security Recommendations

1. **Use HTTPS in Production**: Always use HTTPS in production environments
2. **Keep Dependencies Updated**: Regularly update npm packages to patch security vulnerabilities
3. **Environment Variables**: Never commit `.env` files to version control
4. **Database Security**: Use strong MongoDB connection strings and enable authentication
5. **JWT Secret**: Use a strong, random JWT secret key
6. **Password Hashing**: Already implemented using bcryptjs
7. **CORS Configuration**: Update CORS settings for production domain
8. **Regular Security Audits**: Run `npm audit` regularly to check for vulnerabilities

## Testing Security

1. **Rate Limiting**: Try making multiple rapid requests to test rate limiting
2. **CORS**: Test API calls from unauthorized domains
3. **Input Validation**: Try submitting malicious scripts in forms
4. **Security Headers**: Use browser dev tools to verify security headers

## Monitoring

- Monitor error logs for suspicious activity
- Check customer activity logs for unusual patterns
- Review error logs regularly for potential security issues

