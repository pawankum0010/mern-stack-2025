# Superadmin Email Debugging Guide

## Problem
Customer order confirmation email is working ✅
Superadmin order notification email is NOT working ❌

## Enhanced Fixes Applied

I've improved the superadmin email function with:

1. **Case-insensitive role lookup** - Handles "superadmin", "SuperAdmin", "SUPERADMIN"
2. **Alternative user query** - If direct role lookup fails, tries populated role filtering
3. **Better error logging** - Shows exactly what's happening
4. **SMTP verification** - Verifies connection before sending

## How to Debug

### Step 1: Check Vercel Logs

After placing an order, check Vercel logs for these messages:

```
=== Order Notification Email - Starting ===
Looking for superadmin role...
✅ Superadmin role found: { id: '...', name: 'superadmin' }
Looking for superadmin users...
✅ Found X superadmin user(s) with email: [...]
```

### Step 2: Common Issues

#### Issue 1: Role Not Found

**Log shows:**
```
❌ Superadmin role not found. Skipping order notification email.
Available roles in database: [...]
```

**Solution:**
- Check if "superadmin" role exists in database
- Role name might be different (case-sensitive)
- Create role if missing

#### Issue 2: No Superadmin Users Found

**Log shows:**
```
❌ No superadmin users found. Skipping order notification email.
Total users in database: X
```

**Solution:**
- Verify at least one user has superadmin role
- Check user's role field in database
- Create superadmin user if needed

#### Issue 3: No Email Addresses

**Log shows:**
```
❌ No superadmin users with email addresses found.
```

**Solution:**
- Update superadmin user to add email address
- Verify email field is not empty

#### Issue 4: SMTP Error

**Log shows:**
```
❌ Failed to send email to [email]: [error message]
```

**Solution:**
- Check SMTP configuration (same as password reset)
- Verify SMTP_USER and SMTP_PASS are correct
- Since customer email works, SMTP should be fine

## Quick Test

1. **Place a test order**
2. **Check Vercel logs immediately**
3. **Look for error messages** starting with `❌`
4. **Share the log output** if you need help

## Expected Log Output (Success)

```
=== Order Notification Email - Starting ===
Attempting to send order notification email: { orderNumber: 'ORD-...', ... }
✅ Input validation passed.
SMTP configuration verified. Creating transporter...
✅ Superadmin role found: { id: '...', name: 'superadmin' }
✅ Found 1 superadmin user(s) with email: [{ email: 'admin@example.com', name: 'Admin', id: '...' }]
Preparing email content...
Preparing email for superadmin: admin@example.com
Sending email to admin@example.com...
✅ Email sent successfully to admin@example.com: { messageId: '...', ... }
=== Order Notification Email - Summary ===
Order notification emails sent: { total: 1, successful: 1, failed: 0, ... }
✅ Order notification emails sent successfully!
```

## Manual Verification

To verify superadmin user exists:

1. **Login to admin panel**
2. **Go to Users page**
3. **Check for user with "SUPERADMIN" role**
4. **Verify user has email address**

## If Still Not Working

After checking logs:

1. **Share the log output** from Vercel
2. **Verify superadmin user exists** and has email
3. **Check role name** is exactly "superadmin" (case-sensitive in some cases)

The enhanced code should now find superadmin users more reliably!

