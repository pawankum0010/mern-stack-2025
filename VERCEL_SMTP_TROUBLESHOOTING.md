# Vercel SMTP Troubleshooting Guide

## Check Vercel Logs

After deploying, check your Vercel logs to see detailed error information:

1. Go to your Vercel project dashboard
2. Click on "Logs" tab
3. Look for errors related to "forgot-password" or "SMTP"

The logs will now show:
- SMTP configuration status (which variables are set/not set)
- Connection verification results
- Detailed error messages with error codes
- Stack traces for debugging

## Common Issues and Solutions

### 1. Missing Environment Variables
**Error:** "SMTP_USER and SMTP_PASS environment variables are required"

**Solution:**
- Go to Vercel Project Settings → Environment Variables
- Ensure all these are set for **Production** environment:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM_NAME`
  - `FRONTEND_URL` (should be your Vercel frontend URL)

### 2. SMTP Authentication Failed (EAUTH)
**Error:** "SMTP authentication failed"

**Solution:**
- For Gmail: Use an App Password, not your regular password
- Check that `SMTP_USER` is your full email address
- Verify `SMTP_PASS` is correct (no extra spaces)
- Make sure 2FA is enabled if using Gmail

### 3. Connection Failed (ECONNECTION/ETIMEDOUT)
**Error:** "SMTP connection failed"

**Solution:**
- Verify `SMTP_HOST` is correct (e.g., `smtp.gmail.com`)
- Check `SMTP_PORT` (587 for TLS, 465 for SSL)
- Verify `SMTP_SECURE` matches the port:
  - Port 587 → `SMTP_SECURE=false`
  - Port 465 → `SMTP_SECURE=true`
- Some SMTP providers block connections from cloud platforms - check firewall rules

### 4. Gmail Specific Issues

**If using Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and device
   - Copy the 16-character password
   - Use this in `SMTP_PASS`
3. Make sure "Less secure app access" is NOT needed (deprecated)

### 5. Vercel Environment Variables

**Important:** 
- Set variables for **Production** environment
- After adding variables, **redeploy** your application
- Variables are case-sensitive

### 6. FRONTEND_URL Configuration

Make sure `FRONTEND_URL` is set to your actual frontend URL:
- Example: `https://mern-stack-2025-liard.vercel.app`
- Should NOT have trailing slash
- Should use `https://` not `http://`

## Testing SMTP Configuration

The logs will show:
```
SMTP Configuration: {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'you***',
  pass: '***SET***'
}
```

If you see "NOT SET" for user or pass, the environment variable is missing.

## Error Codes Reference

- `EAUTH` - Authentication failed (wrong credentials)
- `ECONNECTION` - Cannot connect to SMTP server
- `ETIMEDOUT` - Connection timeout
- `EENVELOPE` - Invalid email address
- `EMESSAGE` - Message sending failed

## Next Steps

1. Check Vercel logs for the detailed error message
2. Verify all environment variables are set correctly
3. Test SMTP credentials manually if possible
4. Try a different SMTP provider if issues persist (SendGrid, Mailgun, etc.)

