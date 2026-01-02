# Clinic Creation Guide

## Overview
Super admins can create new clinics with clinic admins using the new endpoint. Clinic admins are automatically verified and receive invitation emails with their login credentials.

## Endpoint

### Create New Clinic
**POST** `/clinics`

**Authentication Required:** Yes (JWT Token)  
**Role Required:** `SYSTEM_ADMIN` only

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "St. Mary's Medical Center",
  "code": "SMMC001",
  "email": "contact@stmarys.com",
  "phone": "555-123-4567",
  "isActive": true,
  "adminName": "Dr. John Smith",
  "adminEmail": "john.smith@stmarys.com",
  "adminPhone": "555-987-6543"
}
```

#### Field Descriptions
- `name` (required): Clinic name
- `code` (required): Unique clinic identifier code
- `email` (required): Clinic contact email
- `phone` (optional): Clinic contact phone number
- `isActive` (optional): Whether clinic is active (defaults to true)
- `adminName` (required): Full name of the clinic administrator
- `adminEmail` (required): Email address for the clinic admin
- `adminPhone` (optional): Phone number for the clinic admin

#### Success Response (201 Created)
```json
{
  "message": "Clinic created successfully. Invitation email sent to clinic admin.",
  "clinic": {
    "id": "uuid-here",
    "name": "St. Mary's Medical Center",
    "code": "SMMC001",
    "email": "contact@stmarys.com",
    "phone": "555-123-4567",
    "isActive": true,
    "adminId": "admin-uuid-here",
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z",
    "admin": {
      "id": "admin-uuid-here",
      "name": "Dr. John Smith",
      "email": "john.smith@stmarys.com",
      "phone": "555-987-6543",
      "role": "CLINIC_ADMIN",
      "emailVerified": true
    }
  },
  "temporaryPassword": "a1b2c3d4e5f6g7h8"
}
```

#### Error Responses

**409 Conflict - Clinic code already exists**
```json
{
  "statusCode": 409,
  "message": "Clinic code already exists",
  "error": "Conflict"
}
```

**409 Conflict - Clinic email already exists**
```json
{
  "statusCode": 409,
  "message": "Clinic email already exists",
  "error": "Conflict"
}
```

**409 Conflict - Admin email already exists**
```json
{
  "statusCode": 409,
  "message": "Admin email already exists",
  "error": "Conflict"
}
```

**403 Forbidden - Not authorized**
```json
{
  "statusCode": 403,
  "message": "You do not have permission.",
  "error": "Forbidden"
}
```

**401 Unauthorized - No token provided**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Features

### 1. Auto-Verified Clinic Admins
- Clinic admins are created with `emailVerified: true`
- No need for email verification process
- Can login immediately after receiving credentials

### 2. Automatic Invitation Email
The clinic admin receives a professional invitation email containing:
- Welcome message with clinic name
- Login credentials (email and temporary password)
- Warning to change password after first login
- Link to login page
- Overview of admin responsibilities

### 3. Secure Password Generation
- Temporary passwords are randomly generated (16 characters)
- Passwords are hashed using bcrypt before storage
- Super admin receives the temporary password in the response

### 4. One-to-One Clinic Relationship
- Each clinic admin is linked to exactly one clinic
- Similar to receptionist-clinic relationship
- Enforced at the database level through the `adminId` foreign key

## Example Usage

### Using cURL
```bash
curl -X POST http://localhost:3000/clinics \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Health Clinic",
    "code": "CHC001",
    "email": "info@cityhealthclinic.com",
    "phone": "555-111-2222",
    "adminName": "Dr. Sarah Johnson",
    "adminEmail": "sarah.johnson@cityhealthclinic.com",
    "adminPhone": "555-333-4444"
  }'
```

### Using Postman
1. Set method to **POST**
2. Set URL to `http://localhost:3000/clinics`
3. Add Header: `Authorization: Bearer YOUR_TOKEN`
4. Select **Body** → **raw** → **JSON**
5. Paste the JSON request body
6. Click **Send**

## Login as Super Admin First

To get the JWT token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gmail.com",
    "password": "12345",
    "role": "SYSTEM_ADMIN"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "SUPER_ADMIN_DEV",
    "name": "Developer Super Admin",
    "email": "superadmin@gmail.com",
    "role": "SYSTEM_ADMIN"
  }
}
```

Use the `accessToken` value for authenticated requests.

## Clinic Admin Login Flow

After clinic creation:

1. Clinic admin receives invitation email
2. Uses provided email and temporary password to login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@stmarys.com",
    "password": "a1b2c3d4e5f6g7h8",
    "role": "CLINIC_ADMIN"
  }'
```

3. Successfully authenticated (no email verification needed)
4. Should change password immediately for security

## Security Considerations

1. **Role Protection**: Only `SYSTEM_ADMIN` can create clinics
2. **Unique Constraints**: Clinic codes and emails must be unique
3. **Admin Email Uniqueness**: Cannot create duplicate admin accounts
4. **Automatic Verification**: Admins are pre-verified and trusted
5. **Temporary Passwords**: Should be changed immediately after first login
6. **Email Delivery**: If email fails, temporary password is still returned in API response

## Database Schema

### Clinic Table
```prisma
model Clinic {
  id       String  @id @default(uuid())
  name     String
  code     String  @unique
  email    String  @unique
  phone    String
  isActive Boolean @default(true)
  adminId  String

  admin User @relation("ClinicAdmins", fields: [adminId], references: [id])
  // ... other relations
}
```

### User Table (for Clinic Admin)
```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  phone         String?
  isActive      Boolean  @default(false)
  role          Role
  password      String?
  emailVerified Boolean  @default(false)
  
  clinics Clinic[] @relation("ClinicAdmins")
  // ... other relations
}
```

## Notes

- Clinic admins are always linked to exactly one clinic (similar to receptionists)
- The relationship is established through the `adminId` field in the Clinic table
- Email service must be properly configured for invitation emails to work
- If email delivery fails, the clinic and admin are still created successfully
- The temporary password is returned in the API response as a backup
