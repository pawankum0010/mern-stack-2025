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

### 3. Gmail Setup (Example)
If using Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create an app password for "Mail"
   - Use this password in `SMTP_PASS`

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

