# Vercel Environment Variables - Complete Setup

## Required Environment Variables for Password Reset

Set these in **Vercel → Your Project → Settings → Environment Variables** for **Production** environment:

### 1. Frontend URL
```
FRONTEND_URL=https://mern-stack-2025-liard.vercel.app
```
**Important:** No trailing slash (the code handles it automatically)

### 2. SMTP Configuration (Gmail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_NAME=Soft Chilli
```

### 3. Other Required Variables


Make sure you also have:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1d
PORT=5000
```

## Quick Setup Checklist

- [ ] **FRONTEND_URL** = `https://mern-stack-2025-liard.vercel.app` (no trailing slash)
- [ ] **SMTP_USER** = Your full Gmail address (e.g., `pawankum0010@gmail.com`)
- [ ] **SMTP_PASS** = 16-character Gmail App Password (NOT your regular password)
- [ ] **SMTP_HOST** = `smtp.gmail.com`
- [ ] **SMTP_PORT** = `587`
- [ ] **SMTP_SECURE** = `false`
- [ ] **SMTP_FROM_NAME** = `Soft Chilli`
- [ ] All variables set for **Production** environment
- [ ] Redeploy after adding variables

## How to Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2FA if not already enabled
3. Generate app password for "Mail"
4. Copy the 16-character password (remove spaces)
5. Use it in `SMTP_PASS`

## After Setting Variables

1. **Redeploy** your Vercel project
2. Test the forgot password functionality
3. Check Vercel logs if there are any errors

## Testing

1. Go to: https://mern-stack-2025-liard.vercel.app/forgot-password
2. Enter a valid email address
3. Check email inbox (and spam folder)
4. Click the reset link
5. Set new password

