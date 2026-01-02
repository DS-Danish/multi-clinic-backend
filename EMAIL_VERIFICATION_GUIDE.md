# Email Verification System - Documentation

## Overview
Email verification has been successfully implemented in the multi-clinic backend system.

## Features Implemented

### 1. **Database Schema Updates**
- Added `emailVerified` (Boolean, default: false)
- Added `verificationToken` (String, unique, nullable)
- Added `tokenExpiry` (DateTime, nullable)

### 2. **Email Service**
- Created `EmailService` using Nodemailer with Gmail
- Sends verification emails with clickable links
- Sends welcome emails upon successful verification
- Beautiful HTML email templates

### 3. **Authentication Updates**

#### Registration Flow:
1. User registers → Account created with `emailVerified: false`
2. Verification token generated (32-byte random hex)
3. Token expires in 24 hours
4. Verification email sent automatically
5. User receives message: "Please check your email to verify your account"

#### Login Flow:
1. User attempts login
2. System checks if `emailVerified === true`
3. If not verified → Error: "Please verify your email before logging in"
4. If verified → Login successful

### 4. **New API Endpoints**

#### `GET /auth/verify-email?token=<token>`
- Verifies user's email with the provided token
- Checks token expiry
- Activates user account
- Sends welcome email

#### `POST /auth/resend-verification`
```json
{
  "email": "user@example.com"
}
```
- Generates new verification token
- Sends new verification email
- Token valid for 24 hours

#### `PATCH /super-admin/verify-user/:userId`
- **Super Admin Only**
- Manually verifies any user's email
- Bypasses email verification requirement

### 5. **User Listing Filters**
- `GET /user` - Only returns verified users
- `GET /user/patients` - Only returns verified patients
- Unverified users hidden from all listing APIs

## Configuration

### Environment Variables (.env)
```env
EMAIL_USER=dsohail402@gmail.com
EMAIL_PASSWORD=Danish#92925400
FRONTEND_URL=http://localhost:3001
```

### Gmail Setup (Important!)
Since you're using Gmail with a password, you need to:
1. Enable **"Less secure app access"** in your Google account, OR
2. Generate an **App Password**:
   - Go to Google Account → Security
   - Enable 2-Factor Authentication
   - Generate App Password
   - Use that password instead of `Danish#92925400`

## API Usage Examples

### 1. Register New User
```bash
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "12345",
  "role": "PATIENT"
}
```
**Response:**
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PATIENT",
    "emailVerified": false
  }
}
```

### 2. Verify Email
```bash
GET /auth/verify-email?token=abc123def456...
```
**Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "success": true
}
```

### 3. Login (After Verification)
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "12345",
  "role": "PATIENT"
}
```

### 4. Resend Verification
```bash
POST /auth/resend-verification
{
  "email": "john@example.com"
}
```

### 5. Super Admin Manual Verification
```bash
PATCH /super-admin/verify-user/user-uuid-here
Headers: Authorization: Bearer <super-admin-token>
```

## Testing the System

### Test Scenario 1: Normal Registration Flow
1. Register a new user
2. Check email for verification link
3. Click link or use token
4. Try to login - should work!

### Test Scenario 2: Login Without Verification
1. Register a new user
2. Don't verify email
3. Try to login → Should fail with error message

### Test Scenario 3: Super Admin Override
1. Register a new user
2. Login as super admin
3. Call verify-user endpoint
4. User can now login without email verification

### Test Scenario 4: Expired Token
1. Register user
2. Wait 24+ hours (or manually set past date in DB)
3. Try to verify → Should fail
4. Resend verification email
5. Use new token → Should work

## Email Templates

### Verification Email
- Professional design with clinic branding
- Clear "Verify Email" button
- Clickable link
- Expiry warning (24 hours)

### Welcome Email
- Sent after successful verification
- Confirms account activation
- Friendly welcome message

## Security Features

✅ Unique verification tokens (32-byte random hex)  
✅ Token expiry (24 hours)  
✅ Tokens cleared after verification  
✅ Super admin-only manual verification  
✅ Unverified users hidden from listings  
✅ Login blocked until verified  

## Next Steps

1. **Update Frontend**:
   - Add verification page at `/verify-email`
   - Show "Check your email" message after registration
   - Add "Resend verification email" button
   - Handle verification errors

2. **Improve Gmail Configuration**:
   - Set up App Password for better security
   - Consider using dedicated SMTP service (SendGrid, Mailgun, etc.)

3. **Admin Features**:
   - Add user management UI for super admin
   - Show verification status in user lists
   - Bulk verification option

## Troubleshooting

### Emails not sending?
- Check Gmail credentials in .env
- Enable "Less secure apps" or use App Password
- Check console logs for errors
- Verify SMTP settings

### TypeScript errors?
- Run: `npx prisma generate`
- Restart TypeScript server
- Reload VS Code window

### Database out of sync?
- Run: `npx prisma db push`
- Or: `npx prisma migrate dev`

## Files Modified/Created

### Created:
- `src/modules/email/email.service.ts`
- `src/modules/email/email.module.ts`
- `src/modules/auth/dto/verify-email.dto.ts`

### Modified:
- `prisma/schema.prisma` - Added verification fields
- `src/modules/auth/auth.service.ts` - Added verification logic
- `src/modules/auth/auth.controller.ts` - Added endpoints
- `src/modules/auth/auth.module.ts` - Imported EmailModule
- `src/modules/user/user.service.ts` - Added verification methods
- `src/modules/user/dto/create-user.dto.ts` - Added verification fields
- `src/modules/super-admin/super-admin.service.ts` - Manual verification
- `src/modules/super-admin/super-admin.controller.ts` - New endpoint
- `src/app.module.ts` - Added EmailModule
- `.env` - Added email configuration

## Super Admin Credentials
- Email: superadmin@gmail.com
- Password: 12345
- Note: Super admin bypass email verification check
