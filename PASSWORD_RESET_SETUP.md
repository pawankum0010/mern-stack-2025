# Password Reset Functionality Setup Guide

## Overview
The password reset functionality allows users to reset their password via email. The system:
1. Validates that the email exists before sending
2. Sends a secure reset link via SMTP
3. Allows users to set a new password using the link

## Backend Configuration

### 1. Install Dependencies
```bash
cd demobackend
npm install nodemailer
```

### 2. Environment Variables
Add the following to your `.env` file in `demobackend/`:

```env
# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Soft Chilli
```

### 3. Gmail Setup (Example) - ⚠️ REQUIRED STEPS

**IMPORTANT:** Gmail does NOT accept regular passwords. You MUST use an App Password.

**Step-by-Step:**

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as app
   - Select "Other (Custom name)" as device, enter "Vercel"
   - Click "Generate"
   - Copy the 16-character password (remove spaces!)

3. **Vercel Environment Variables:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com          (FULL email address)
   SMTP_PASS=abcdefghijklmnop              (16-char app password, NO SPACES)
   SMTP_FROM_NAME=Soft Chilli
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

   **Critical Notes:**
   - `SMTP_PASS` must be the App Password (NOT your regular Gmail password)
   - Remove all spaces from the app password
   - `SMTP_USER` must be your full email (e.g., `pawankum0010@gmail.com`)
   - After adding variables, **redeploy** your Vercel project

### 4. Other SMTP Providers
For other providers (Outlook, SendGrid, etc.), update:
- `SMTP_HOST`: Your SMTP server hostname
- `SMTP_PORT`: Usually 587 (TLS) or 465 (SSL)
- `SMTP_SECURE`: `true` for port 465, `false` for port 587
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email password or app password

## API Endpoints

### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully. Please check your email.",
  "data": null
}
```

**Response (Error - Email not found):**
```json
{
  "success": false,
  "message": "No account found with this email address",
  "statusCode": 404
}
```

### POST /api/auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "user@example.com",
  "password": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password.",
  "data": null
}
```

## Frontend Routes

- `/forgot-password` - Request password reset
- `/reset-password?token=xxx&email=xxx` - Reset password (link from email)

## Features

✅ Email validation before sending
✅ Secure token generation (crypto.randomBytes)
✅ Token expiration (1 hour)
✅ Password validation (minimum 6 characters)
✅ Activity logging for customers
✅ Rate limiting on endpoints
✅ HTML email template with styling
✅ Error handling for invalid/expired tokens

## Testing

1. Go to `/forgot-password`
2. Enter a valid email address
3. Check email for reset link
4. Click link to go to reset page
5. Enter new password
6. Login with new password

## Security Notes

- Tokens are hashed before storing in database
- Tokens expire after 1 hour
- Tokens are cleared after successful password reset
- Rate limiting prevents abuse
- Email existence is validated before sending

