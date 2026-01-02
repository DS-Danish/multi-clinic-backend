# Timezone Handling Guide

## Overview
This guide explains how timezone handling has been implemented for the Multi-Clinic Backend to ensure appointment times are consistent between the frontend and backend.

## Problem
When creating appointments, the frontend sends times in local timezone (GMT+5 Pakistan), but the backend was storing them incorrectly, causing time discrepancies.

## Solution
We've implemented comprehensive timezone handling using `moment-timezone` library that:
1. Converts client times to UTC when storing in database
2. Converts UTC times back to client timezone when retrieving data
3. Supports multiple timezones for future scalability

## Implementation Details

### 1. Timezone Utility Service
Location: `src/common/utils/timezone.util.ts`

The `TimezoneUtil` class provides helper methods for timezone conversions:
- `toUTC(dateString, timezone)` - Converts client time to UTC for database storage
- `fromUTC(date, timezone)` - Converts UTC time to client timezone for responses
- `format(date, timezone, format)` - Formats dates with timezone
- `isValidTimezone(timezone)` - Validates timezone strings
- `now(timezone)` - Gets current time in specified timezone

Default timezone: `Asia/Karachi` (GMT+5)

### 2. DTOs Updated
**CreateAppointmentDto** and **UpdateAppointmentDto** now include an optional `timezone` field:
```typescript
{
  clinicId: string;
  doctorId: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  notes?: string;
  timezone?: string; // e.g., 'Asia/Karachi', defaults to Asia/Karachi if not provided
}
```

### 3. API Usage

#### Creating an Appointment
**POST** `/appointments`

Request body:
```json
{
  "clinicId": "clinic-uuid",
  "doctorId": "doctor-uuid",
  "startTime": "2026-01-03T10:00:00",
  "endTime": "2026-01-03T10:30:00",
  "notes": "Regular checkup",
  "timezone": "Asia/Karachi"
}
```

The backend will:
1. Convert `startTime` and `endTime` from `Asia/Karachi` to UTC
2. Store UTC times in database
3. Return the created appointment with times converted back to `Asia/Karachi`

#### Updating an Appointment
**PATCH** `/appointments/:id`

Request body:
```json
{
  "startTime": "2026-01-03T11:00:00",
  "endTime": "2026-01-03T11:30:00",
  "timezone": "Asia/Karachi"
}
```

#### Getting Appointments
You can now pass a `timezone` query parameter to get appointments in a specific timezone:

**GET** `/appointments/patient/:patientId?timezone=Asia/Karachi`
**GET** `/appointments/doctor/:doctorId?timezone=Asia/Karachi`

If no timezone is provided, it defaults to `Asia/Karachi`.

#### Canceling an Appointment
**PATCH** `/appointments/:id/cancel?timezone=Asia/Karachi`

### 4. Frontend Integration

#### Sending Requests
When creating or updating appointments, the frontend should:
1. Use local date/time picker values
2. Send ISO string format: `YYYY-MM-DDTHH:mm:ss`
3. Include timezone field (optional, defaults to Asia/Karachi)

Example with JavaScript:
```javascript
const appointmentData = {
  clinicId: "clinic-uuid",
  doctorId: "doctor-uuid",
  startTime: "2026-01-03T10:00:00", // Local time
  endTime: "2026-01-03T10:30:00",   // Local time
  timezone: "Asia/Karachi"
};

await fetch('/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(appointmentData)
});
```

#### Displaying Appointments
The backend responses now return times in the requested timezone:
```json
{
  "id": "appointment-uuid",
  "startTime": "2026-01-03T10:00:00+05:00",
  "endTime": "2026-01-03T10:30:00+05:00",
  "status": "PENDING"
}
```

These can be directly displayed in the frontend without conversion.

### 5. Database Storage
Times are stored in UTC in the MySQL database. This ensures:
- Consistency across different timezones
- Proper sorting and filtering
- Easy migration if server location changes

### 6. Supported Timezones
The system supports all IANA timezone identifiers. Common examples:
- `Asia/Karachi` (GMT+5) - Pakistan
- `America/New_York` (EST/EDT)
- `Europe/London` (GMT/BST)
- `Asia/Dubai` (GMT+4)

You can see the full list at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### 7. Best Practices

#### For Frontend Developers:
1. Always send timezone when creating/updating appointments
2. Store user's timezone preference if supporting multiple regions
3. Display times exactly as received from the API (they're already in client timezone)

#### For Backend Developers:
1. Never manipulate times without using `TimezoneUtil`
2. Always store UTC in database
3. Always convert to client timezone in responses
4. Use default timezone (`Asia/Karachi`) when timezone is not provided

### 8. Testing
To test timezone handling:
1. Create an appointment with `startTime: "2026-01-03T10:00:00"` and `timezone: "Asia/Karachi"`
2. Check database - time should be stored as `2026-01-03 05:00:00` (UTC)
3. Retrieve the appointment - time should be returned as `2026-01-03T10:00:00+05:00`

### 9. Troubleshooting

**Issue**: Times are still off by 5 hours
- **Solution**: Make sure you're passing the `timezone` parameter in requests

**Issue**: Different time than expected
- **Solution**: Verify the timezone string is correct (e.g., `Asia/Karachi` not `PKT`)

**Issue**: Validation errors on date format
- **Solution**: Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss`

## Migration Notes
Existing appointments in the database may need migration if they were stored incorrectly. Contact the development team for a migration script if needed.

## Future Enhancements
- Add user timezone preferences in user profile
- Automatic timezone detection from IP address
- Support for recurring appointments with timezone handling
