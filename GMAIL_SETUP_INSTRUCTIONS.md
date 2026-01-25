# Gmail SMTP Setup for Password Reset - Step by Step

## ⚠️ IMPORTANT: Gmail Requires App Password

Gmail **does NOT accept regular passwords** for SMTP authentication. You MUST use an App Password.

## Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" section
3. Click "Get started" or "Turn on"
4. Follow the setup process (you'll need your phone)

## Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. You'll see a dropdown - select:
   - **App:** Mail
   - **Device:** Other (Custom name)
   - Enter name: `Vercel` or `Soft Chilli`
3. Click **"Generate"**
4. You'll see a 16-character password like: `abcd efgh ijkl mnop`
5. **Copy this password** (you won't see it again!)

## Step 3: Configure Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables

Add these variables for **Production** environment:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_SECURE` | `false` | `false` |
| `SMTP_USER` | Your full Gmail address | `pawankum0010@gmail.com` |
| `SMTP_PASS` | The 16-character app password (NO SPACES) | `abcdefghijklmnop` |
| `SMTP_FROM_NAME` | Display name | `Soft Chilli` |
| `FRONTEND_URL` | Your Vercel frontend URL (no trailing slash) | `https://mern-stack-2025-liard.vercel.app` |

### Important Notes:

1. **SMTP_PASS**: 
   - Use the 16-character app password you generated
   - Remove ALL spaces (if it shows `abcd efgh ijkl mnop`, use `abcdefghijklmnop`)
   - This is NOT your regular Gmail password

2. **SMTP_USER**:
   - Must be your FULL Gmail address
   - Include `@gmail.com` part
   - Example: `pawankum0010@gmail.com`

3. **SMTP_SECURE**:
   - Must be `false` (lowercase) for port 587
   - If using port 465, set to `true`

4. **FRONTEND_URL**:
   - Should be your actual Vercel frontend URL
   - Use `https://` not `http://`
   - No trailing slash (the code will handle it)
   - **For your project, set it to:** `https://mern-stack-2025-liard.vercel.app`

## Step 4: Redeploy

After adding all environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger deployment

## Step 5: Test

1. Go to your forgot password page
2. Enter a valid email
3. Check Vercel logs if it fails
4. Check the email inbox (and spam folder)

## Troubleshooting

### Still getting "SMTP authentication failed"?

1. **Verify App Password**:
   - Make sure you copied the full 16-character password
   - Remove all spaces
   - Don't include quotes

2. **Check 2FA is enabled**:
   - Go to https://myaccount.google.com/security
   - Verify "2-Step Verification" shows "On"

3. **Verify Variable Names**:
   - Must be EXACTLY: `SMTP_USER`, `SMTP_PASS`, etc. (case-sensitive)
   - No typos or extra spaces

4. **Check Vercel Logs**:
   - Go to Vercel → Your Project → Logs
   - Look for "SMTP Configuration" log
   - It will show which variables are "SET" or "NOT SET"

5. **Try Regenerating App Password**:
   - Delete the old one
   - Generate a new app password
   - Update `SMTP_PASS` in Vercel
   - Redeploy

### Alternative: Use Different Email Service

If Gmail continues to cause issues, consider:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, pay per email)
- **Outlook/Hotmail** (similar to Gmail, also needs app password)

## Quick Checklist

- [ ] 2-Factor Authentication enabled on Google Account
- [ ] App Password generated (16 characters)
- [ ] All 7 environment variables added to Vercel
- [ ] Variables set for "Production" environment
- [ ] SMTP_PASS has no spaces
- [ ] SMTP_USER is full email address
- [ ] SMTP_SECURE is `false` (for port 587)
- [ ] FRONTEND_URL is correct (https://)
- [ ] Project redeployed after adding variables

