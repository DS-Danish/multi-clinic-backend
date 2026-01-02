# Appointment Reports - Quick Reference

## Overview
Doctors can upload comprehensive medical reports after completing in-person appointments. Reports are accessible to both the doctor and patient.

## Quick Start

### 1. Upload a Report (Doctor)
```bash
POST /appointments/:appointmentId/report
Authorization: Bearer {doctor_token}

{
  "title": "Annual Physical Examination",
  "content": "Patient presented for...",
  "diagnosis": "Healthy adult - no issues",
  "prescription": "No medications required",
  "recommendations": "Continue healthy lifestyle"
}
```

### 2. View a Report (Doctor or Patient)
```bash
GET /appointments/:appointmentId/report
Authorization: Bearer {token}
```

### 3. Update a Report (Doctor)
```bash
PUT /appointments/:appointmentId/report
Authorization: Bearer {doctor_token}

{
  "recommendations": "Updated recommendations..."
}
```

## Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/appointments/:id/report` | Doctor | Create new report |
| PUT | `/appointments/:id/report` | Doctor | Update existing report |
| GET | `/appointments/:id/report` | Doctor/Patient | Get single report |
| GET | `/appointments/patient/:id/reports` | Any | Get all patient reports |
| GET | `/appointments/doctor/:id/reports` | Doctor | Get all doctor's reports |

## Report Fields

### Required
- **title** (string, max 200 chars) - Brief summary of appointment

- **content** (text) - Detailed clinical notes:
  - Chief complaint
  - History & examination
  - Vital signs
  - Lab results
  - Clinical reasoning

### Optional
- **diagnosis** (text) - Primary/secondary diagnoses
- **prescription** (text) - Medications with dosages and instructions
- **recommendations** (text) - Follow-up care, lifestyle changes, red flags
- **fileUrl** (string) - URL to attached documents (PDFs, images, etc.)

## Sample Reports Available

Five ready-to-use sample reports in `/sample-reports/`:

1. **routine-checkup-report.json** - Annual physical for healthy adult
2. **diabetes-management-report.json** - Type 2 diabetes follow-up
3. **hypertension-followup-report.json** - Blood pressure medication adjustment
4. **acute-bronchitis-report.json** - Acute respiratory infection
5. **migraine-headache-report.json** - Migraine with preventive management

## Testing with Sample Data

```bash
# Upload using a sample report
curl -X POST http://localhost:3000/appointments/abc123/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @sample-reports/routine-checkup-report.json
```

## Security Rules

✅ **Doctors can:**
- Create reports for their own appointments
- Update their own reports
- View their own reports

✅ **Patients can:**
- View reports for their own appointments
- Get all their historical reports

❌ **Cannot:**
- Doctors cannot create/edit reports for other doctors' appointments
- Patients cannot create or edit reports
- Users cannot access reports from appointments they're not part of

## Workflow

```
1. Appointment Created (PENDING)
         ↓
2. Receptionist Confirms (SCHEDULED)
         ↓
3. In-Person Appointment Occurs
         ↓
4. Appointment Marked COMPLETED
         ↓
5. 📝 Doctor Uploads Report ← YOU ARE HERE
         ↓
6. Patient Can View Report
         ↓
7. Doctor Can Update if Needed
```

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Report already exists | Use PUT to update instead |
| 401 | Not authenticated | Include valid JWT token |
| 403 | Not authorized | Check you're the doctor/patient of this appointment |
| 404 | Appointment/report not found | Verify appointment ID exists |

## Database Schema

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
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Best Practices

1. ✅ Upload reports promptly after appointments
2. ✅ Be comprehensive - include all relevant clinical info
3. ✅ Use clear, patient-friendly language
4. ✅ Document all medications with complete instructions
5. ✅ Include red flags and when to seek emergency care
6. ✅ Update reports if new information becomes available

## Need More Details?

📚 **Full Documentation:** [APPOINTMENT_REPORTS_API_GUIDE.md](./APPOINTMENT_REPORTS_API_GUIDE.md)

📂 **Sample Reports:** [sample-reports/README.md](./sample-reports/README.md)

🔧 **Implementation:** [src/modules/appointment/appointment.service.ts](./src/modules/appointment/appointment.service.ts)
