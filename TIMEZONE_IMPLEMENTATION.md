# Timezone Implementation Summary

## Changes Made

### 1. **Installed Dependencies**
- `moment-timezone` - Timezone handling library
- `@types/moment-timezone` - TypeScript type definitions

### 2. **Created Timezone Utility** 
- **File**: [src/common/utils/timezone.util.ts](src/common/utils/timezone.util.ts)
- Provides methods to convert between UTC and client timezone
- Default timezone: `Asia/Karachi` (GMT+5)

### 3. **Updated DTOs**
- **Files**: 
  - [src/modules/appointment/dto/create-appointment.dto.ts](src/modules/appointment/dto/create-appointment.dto.ts)
  - [src/modules/appointment/dto/update-appointment.dto.ts](src/modules/appointment/dto/update-appointment.dto.ts)
- Added optional `timezone` field to both DTOs

### 4. **Updated Appointment Service**
- **File**: [src/modules/appointment/appointment.service.ts](src/modules/appointment/appointment.service.ts)
- `createAppointment()` - Converts client times to UTC before saving
- `updatePatientAppointment()` - Converts client times to UTC before updating
- `cancelPatientAppointment()` - Returns times in client timezone
- `getDoctorAppointments()` - Returns times in client timezone
- `getPatientAppointments()` - Returns times in client timezone

### 5. **Updated Appointment Controller**
- **File**: [src/modules/appointment/appointment.controller.ts](src/modules/appointment/appointment.controller.ts)
- Added optional `timezone` query parameter to GET endpoints
- Passes timezone to service methods

## How It Works

### Storage (Frontend → Backend → Database)
1. Frontend sends: `"2026-01-03T10:00:00"` with `timezone: "Asia/Karachi"`
2. Backend converts to UTC: `"2026-01-03T05:00:00Z"`
3. Database stores: `2026-01-03 05:00:00` (UTC)

### Retrieval (Database → Backend → Frontend)
1. Database returns: `2026-01-03 05:00:00` (UTC)
2. Backend converts to client timezone: `"2026-01-03T10:00:00+05:00"`
3. Frontend displays: `10:00 AM`

## Frontend Integration

### Creating Appointments
```javascript
const response = await fetch('/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    clinicId: "clinic-id",
    doctorId: "doctor-id",
    startTime: "2026-01-03T10:00:00",  // Local time
    endTime: "2026-01-03T10:30:00",    // Local time
    timezone: "Asia/Karachi"            // Optional, defaults to Asia/Karachi
  })
});
```

### Getting Appointments
```javascript
// With timezone parameter (recommended)
const response = await fetch('/appointments/patient/patient-id?timezone=Asia/Karachi');

// Without timezone parameter (uses default Asia/Karachi)
const response = await fetch('/appointments/patient/patient-id');
```

### Updating Appointments
```javascript
const response = await fetch(`/appointments/${appointmentId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    startTime: "2026-01-03T11:00:00",
    endTime: "2026-01-03T11:30:00",
    timezone: "Asia/Karachi"
  })
});
```

## Testing

### Test Case 1: Create Appointment
1. Send POST to `/appointments` with:
   ```json
   {
     "startTime": "2026-01-03T10:00:00",
     "timezone": "Asia/Karachi"
   }
   ```
2. Check database: Should show `2026-01-03 05:00:00` (UTC)
3. Get the appointment: Should return `2026-01-03T10:00:00+05:00`

### Test Case 2: Different Timezone
1. Send GET to `/appointments/patient/:id?timezone=America/New_York`
2. Verify times are converted to EST/EDT

## Benefits

✅ **Consistent Times**: Frontend and backend times now match  
✅ **Database Independence**: Times stored in UTC regardless of server location  
✅ **Multi-timezone Support**: Easy to support users in different timezones  
✅ **DST Handling**: Moment-timezone handles daylight saving time automatically  
✅ **Backwards Compatible**: Works with existing data (defaults to Asia/Karachi)

## Notes

- All appointment times are stored in UTC in the database
- Default timezone is `Asia/Karachi` (Pakistan, GMT+5)
- Frontend should send timezone parameter for best results
- If no timezone provided, defaults to `Asia/Karachi`
- See [TIMEZONE_GUIDE.md](TIMEZONE_GUIDE.md) for detailed documentation
