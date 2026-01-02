# Appointment Reports API Guide

This guide explains how to use the appointment report endpoints for uploading and managing reports for in-person appointments.

## Overview

The system allows doctors to upload comprehensive medical reports after completing in-person appointments. These reports are accessible to both the doctor who created them and the patient for whom they were created.

## API Endpoints

### 1. Create Appointment Report (Doctor Only)

**Endpoint:** `POST /appointments/:appointmentId/report`

**Authentication:** Required (JWT Token)

**Authorization:** Doctor role only

**Description:** Upload a new report for a completed appointment.

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `appointmentId` (string, required): The ID of the appointment

**Request Body:**
```json
{
  "title": "Annual Routine Physical Examination",
  "content": "Patient presented for annual routine physical examination...",
  "diagnosis": "Healthy Adult - No Acute Medical Issues",
  "prescription": "No Prescription Medications Required...",
  "recommendations": "General Health Maintenance...",
  "fileUrl": "https://storage.example.com/reports/12345.pdf" // Optional
}
```

**Validation Rules:**
- `title`: Required, string, max 200 characters
- `content`: Required, string
- `diagnosis`: Optional, string
- `prescription`: Optional, string
- `recommendations`: Optional, string
- `fileUrl`: Optional, string (URL to uploaded PDF/document)

**Success Response (201 Created):**
```json
{
  "id": "report-uuid",
  "appointmentId": "appointment-uuid",
  "doctorId": "doctor-uuid",
  "title": "Annual Routine Physical Examination",
  "content": "Patient presented for annual routine physical examination...",
  "diagnosis": "Healthy Adult - No Acute Medical Issues",
  "prescription": "No Prescription Medications Required...",
  "recommendations": "General Health Maintenance...",
  "fileUrl": "https://storage.example.com/reports/12345.pdf",
  "createdAt": "2026-01-02T10:30:00.000Z",
  "updatedAt": "2026-01-02T10:30:00.000Z"
}
```

**Error Responses:**

- **404 Not Found:** Appointment doesn't exist
```json
{
  "statusCode": 404,
  "message": "Appointment not found"
}
```

- **403 Forbidden:** Doctor trying to create report for another doctor's appointment
```json
{
  "statusCode": 403,
  "message": "You can only create reports for your own appointments"
}
```

- **400 Bad Request:** Report already exists
```json
{
  "statusCode": 400,
  "message": "Report already exists for this appointment. Use update endpoint instead."
}
```

---

### 2. Update Appointment Report (Doctor Only)

**Endpoint:** `PUT /appointments/:appointmentId/report`

**Authentication:** Required (JWT Token)

**Authorization:** Doctor role only (must be the doctor who created the report)

**Description:** Update an existing appointment report.

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `appointmentId` (string, required): The ID of the appointment

**Request Body:**
```json
{
  "title": "Annual Routine Physical Examination - Updated",
  "content": "Updated content...",
  "diagnosis": "Updated diagnosis...",
  "prescription": "Updated prescription...",
  "recommendations": "Updated recommendations...",
  "fileUrl": "https://storage.example.com/reports/12345-updated.pdf"
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Success Response (200 OK):**
```json
{
  "id": "report-uuid",
  "appointmentId": "appointment-uuid",
  "doctorId": "doctor-uuid",
  "title": "Annual Routine Physical Examination - Updated",
  "content": "Updated content...",
  "diagnosis": "Updated diagnosis...",
  "prescription": "Updated prescription...",
  "recommendations": "Updated recommendations...",
  "fileUrl": "https://storage.example.com/reports/12345-updated.pdf",
  "createdAt": "2026-01-02T10:30:00.000Z",
  "updatedAt": "2026-01-02T11:45:00.000Z"
}
```

**Error Responses:**

- **404 Not Found:** Report doesn't exist
```json
{
  "statusCode": 404,
  "message": "No report found for this appointment"
}
```

- **403 Forbidden:** Not authorized to update this report
```json
{
  "statusCode": 403,
  "message": "You can only update reports for your own appointments"
}
```

---

### 3. Get Appointment Report (Doctor or Patient)

**Endpoint:** `GET /appointments/:appointmentId/report`

**Authentication:** Required (JWT Token)

**Authorization:** Doctor or Patient of the appointment

**Description:** Retrieve the report for a specific appointment.

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `appointmentId` (string, required): The ID of the appointment

**Success Response (200 OK):**
```json
{
  "id": "report-uuid",
  "appointmentId": "appointment-uuid",
  "doctorId": "doctor-uuid",
  "title": "Annual Routine Physical Examination",
  "content": "Patient presented for annual routine physical examination...",
  "diagnosis": "Healthy Adult - No Acute Medical Issues",
  "prescription": "No Prescription Medications Required...",
  "recommendations": "General Health Maintenance...",
  "fileUrl": "https://storage.example.com/reports/12345.pdf",
  "createdAt": "2026-01-02T10:30:00.000Z",
  "updatedAt": "2026-01-02T10:30:00.000Z",
  "appointment": {
    "id": "appointment-uuid",
    "startTime": "2026-01-02T09:00:00.000Z",
    "endTime": "2026-01-02T09:30:00.000Z",
    "status": "COMPLETED",
    "doctor": {
      "id": "doctor-uuid",
      "name": "Dr. John Smith",
      "email": "john.smith@clinic.com"
    },
    "patient": {
      "id": "patient-uuid",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    }
  }
}
```

**Error Responses:**

- **404 Not Found:** Appointment or report not found
```json
{
  "statusCode": 404,
  "message": "No report found for this appointment"
}
```

- **403 Forbidden:** User not authorized to view this report
```json
{
  "statusCode": 403,
  "message": "You can only view reports for your own appointments"
}
```

---

### 4. Get All Patient Reports

**Endpoint:** `GET /appointments/patient/:patientId/reports`

**Authentication:** Required (JWT Token)

**Description:** Get all reports for a specific patient across all appointments.

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `patientId` (string, required): The ID of the patient

**Success Response (200 OK):**
```json
[
  {
    "appointmentId": "appointment-uuid-1",
    "appointmentDate": "2026-01-02T09:00:00.000Z",
    "doctor": {
      "id": "doctor-uuid",
      "name": "Dr. John Smith",
      "email": "john.smith@clinic.com"
    },
    "clinic": {
      "id": "clinic-uuid",
      "name": "Downtown Medical Center"
    },
    "report": {
      "id": "report-uuid-1",
      "title": "Annual Routine Physical Examination",
      "content": "...",
      "diagnosis": "...",
      "prescription": "...",
      "recommendations": "...",
      "fileUrl": "...",
      "createdAt": "2026-01-02T10:30:00.000Z",
      "updatedAt": "2026-01-02T10:30:00.000Z"
    }
  },
  {
    "appointmentId": "appointment-uuid-2",
    "appointmentDate": "2025-12-15T14:00:00.000Z",
    "doctor": {
      "id": "doctor-uuid-2",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@clinic.com"
    },
    "clinic": {
      "id": "clinic-uuid-2",
      "name": "Wellness Clinic"
    },
    "report": {
      "id": "report-uuid-2",
      "title": "Hypertension Follow-up",
      "content": "...",
      "diagnosis": "...",
      "prescription": "...",
      "recommendations": "...",
      "fileUrl": null,
      "createdAt": "2025-12-15T15:30:00.000Z",
      "updatedAt": "2025-12-15T15:30:00.000Z"
    }
  }
]
```

---

### 5. Get All Doctor's Reports

**Endpoint:** `GET /appointments/doctor/:doctorId/reports`

**Authentication:** Required (JWT Token)

**Authorization:** Doctor role only

**Description:** Get all reports created by a specific doctor.

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `doctorId` (string, required): The ID of the doctor

**Success Response (200 OK):**
```json
[
  {
    "reportId": "report-uuid-1",
    "appointmentId": "appointment-uuid-1",
    "appointmentDate": "2026-01-02T09:00:00.000Z",
    "patient": {
      "id": "patient-uuid-1",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    },
    "clinic": {
      "id": "clinic-uuid",
      "name": "Downtown Medical Center"
    },
    "title": "Annual Routine Physical Examination",
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T10:30:00.000Z"
  },
  {
    "reportId": "report-uuid-2",
    "appointmentId": "appointment-uuid-2",
    "appointmentDate": "2026-01-01T14:00:00.000Z",
    "patient": {
      "id": "patient-uuid-2",
      "name": "John Smith",
      "email": "john.smith@example.com"
    },
    "clinic": {
      "id": "clinic-uuid",
      "name": "Downtown Medical Center"
    },
    "title": "Diabetes Management Follow-up",
    "createdAt": "2026-01-01T15:30:00.000Z",
    "updatedAt": "2026-01-01T15:30:00.000Z"
  }
]
```

---

## Usage Examples

### Example 1: Doctor Creating a Report After Appointment

```javascript
// Doctor uploads report after completing an appointment
const response = await fetch('http://localhost:3000/appointments/abc123/report', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Acute Bronchitis - Upper Respiratory Infection",
    content: "Patient presented to clinic with complaints of persistent cough...",
    diagnosis: "Acute Bronchitis (Viral Upper Respiratory Infection)",
    prescription: "Symptomatic Treatment (No Antibiotics Required)...",
    recommendations: "Home Care and Symptom Management..."
  })
});

const report = await response.json();
console.log('Report created:', report);
```

### Example 2: Patient Viewing Their Report

```javascript
// Patient retrieves their appointment report
const response = await fetch('http://localhost:3000/appointments/abc123/report', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer patient_jwt_token...'
  }
});

const report = await response.json();
console.log('My appointment report:', report);
```

### Example 3: Doctor Updating a Report

```javascript
// Doctor updates report with additional information
const response = await fetch('http://localhost:3000/appointments/abc123/report', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer doctor_jwt_token...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recommendations: "Updated recommendations based on follow-up call..."
  })
});

const updatedReport = await response.json();
console.log('Report updated:', updatedReport);
```

### Example 4: Getting All Patient Reports

```javascript
// Get all reports for a patient
const response = await fetch('http://localhost:3000/appointments/patient/patient123/reports', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer patient_jwt_token...'
  }
});

const reports = await response.json();
console.log(`Found ${reports.length} reports for patient`);
```

---

## Sample Report Templates

The `sample-reports/` directory contains example reports that can be used as templates:

1. **routine-checkup-report.json** - Annual physical examination
2. **diabetes-management-report.json** - Diabetes follow-up consultation
3. **hypertension-followup-report.json** - Hypertension medication adjustment
4. **acute-bronchitis-report.json** - Acute respiratory infection treatment
5. **migraine-headache-report.json** - Migraine management and prevention

These samples demonstrate the level of detail expected in each field:
- **title**: Brief, descriptive summary of the visit
- **content**: Detailed clinical notes including history, examination findings, and test results
- **diagnosis**: Primary and secondary diagnoses with clinical reasoning
- **prescription**: All medications with dosages, instructions, and warnings
- **recommendations**: Follow-up care, lifestyle modifications, and patient education

---

## Important Notes

### Security
- All endpoints require JWT authentication
- Doctors can only create/update reports for their own appointments
- Patients can only view reports for their own appointments
- No one else can access appointment reports without proper authorization

### Best Practices
1. **Create reports promptly** after appointments while details are fresh
2. **Be comprehensive** - include all relevant clinical information
3. **Use clear language** - patients will read these reports
4. **Update when necessary** - if follow-up information becomes available
5. **Include medications carefully** - specify dosages, frequencies, and durations
6. **Document all recommendations** - lifestyle, follow-up, red flags

### File Attachments
- The `fileUrl` field can store a link to uploaded PDF documents or images
- Implement file upload separately (e.g., AWS S3, Azure Blob Storage)
- Store the URL in the `fileUrl` field
- Useful for including lab results, imaging reports, or scanned documents

### Report Workflow
1. Appointment scheduled (status: PENDING)
2. Receptionist confirms (status: SCHEDULED)
3. Appointment occurs in person
4. Doctor marks as complete (status: COMPLETED)
5. **Doctor uploads report** using POST endpoint
6. Patient can view report
7. Doctor can update report if needed

---

## Database Schema

The `AppointmentReport` model in Prisma:

```prisma
model AppointmentReport {
  id              String   @id @default(uuid())
  appointmentId   String   @unique
  doctorId        String
  title           String
  content         String   @db.Text
  diagnosis       String?  @db.Text
  prescription    String?  @db.Text
  recommendations String?  @db.Text
  fileUrl         String?
  
  appointment     Appointment @relation(fields: [appointmentId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("appointment_reports")
}
```

**Key Features:**
- One-to-one relationship with Appointment
- `@db.Text` for large text fields (content, diagnosis, prescription, recommendations)
- Automatic timestamps (createdAt, updatedAt)
- Optional file URL for attachments

---

## Testing the API

### Using cURL

**Create a report:**
```bash
curl -X POST http://localhost:3000/appointments/abc123/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report",
    "content": "Test content",
    "diagnosis": "Test diagnosis",
    "prescription": "Test prescription",
    "recommendations": "Test recommendations"
  }'
```

**Get a report:**
```bash
curl -X GET http://localhost:3000/appointments/abc123/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update a report:**
```bash
curl -X PUT http://localhost:3000/appointments/abc123/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recommendations": "Updated recommendations"
  }'
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "statusCode": 400|403|404|500,
  "message": "Error description",
  "error": "Error Type"
}
```

Common HTTP status codes:
- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `400 Bad Request` - Validation error or invalid data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User not authorized for this action
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

## Future Enhancements

Potential improvements to consider:
1. Report versioning (track all changes to reports)
2. Report templates for common conditions
3. Rich text editor support
4. Image/file upload integration
5. PDF generation for reports
6. Email notification when report is uploaded
7. Report sharing with other healthcare providers
8. Patient comments/questions on reports
9. Analytics on report completion rates
10. Voice-to-text for rapid report creation
