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

### 4. Gmail Specific Issues (IMPORTANT!)

**Gmail does NOT accept regular passwords for SMTP!** You MUST use an App Password.

**Step-by-Step Gmail Setup:**

1. **Enable 2-Factor Authentication** (Required):
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already enabled
   - Follow the setup process

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as device, enter "Vercel" or "Soft Chilli"
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
   - **Remove spaces** - use it as one string: `abcdefghijklmnop`

3. **Vercel Environment Variables** - Set these EXACTLY:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  (16-character app password, NO SPACES)
   SMTP_FROM_NAME=Soft Chilli
   FRONTEND_URL=https://mern-stack-2025-liard.vercel.app
   ```

4. **Important Notes:**
   - Use your FULL Gmail address in `SMTP_USER` (e.g., `pawankum0010@gmail.com`)
   - Use the 16-character App Password in `SMTP_PASS` (NOT your regular Gmail password)
   - Remove all spaces from the app password
   - `SMTP_SECURE=false` for port 587 (TLS)
   - After adding variables, **redeploy** your Vercel project

### 5. Vercel Environment Variables

**Important:** 
- Set variables for **Production** environment
- After adding variables, **redeploy** your application
- Variables are case-sensitive

### 6. FRONTEND_URL Configuration

Make sure `FRONTEND_URL` is set to your actual frontend URL:
- Example: `https://mern-stack-2025-liard.vercel.app`
- Should NOT have trailing slash (code will handle it automatically)
- Should use `https://` not `http://`
- **For your project, set:** `FRONTEND_URL=https://mern-stack-2025-liard.vercel.app`

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

