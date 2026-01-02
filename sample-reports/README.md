# Sample Medical Reports for Multi-Clinic System

This directory contains sample medical reports that demonstrate the appointment report functionality of the multi-clinic backend system. These reports can be uploaded by doctors after completing in-person appointments.

## Available Sample Reports

### 1. Routine Checkup Report
**File:** `routine-checkup-report.json`

**Use Case:** Annual physical examination for healthy adult

**Key Features:**
- Complete vital signs assessment
- Comprehensive laboratory results (CBC, metabolic panel, lipid panel)
- Physical examination findings
- Preventive care recommendations
- Age-appropriate screening guidelines

**Best For:** Demonstrating wellness visits and preventive care documentation

---

### 2. Diabetes Management Report
**File:** `diabetes-management-report.json`

**Use Case:** Type 2 Diabetes follow-up consultation

**Key Features:**
- Chronic disease management
- HbA1c monitoring and trends
- Medication compliance assessment
- Lifestyle modification tracking
- Complication screening (eyes, feet, kidneys)

**Best For:** Demonstrating chronic disease management and long-term care planning

---

### 3. Hypertension Follow-up Report
**File:** `hypertension-followup-report.json`

**Use Case:** Blood pressure management and medication adjustment

**Key Features:**
- Medication titration and adjustment
- Home blood pressure monitoring data
- DASH diet recommendations
- Lifestyle counseling
- Target blood pressure goals

**Best For:** Demonstrating medication management and patient education

---

### 4. Acute Bronchitis Report
**File:** `acute-bronchitis-report.json`

**Use Case:** Acute respiratory infection treatment

**Key Features:**
- Acute illness assessment
- Viral vs bacterial differentiation
- Symptomatic treatment plan
- When antibiotics are NOT needed
- Red flags for worsening symptoms

**Best For:** Demonstrating acute care visits and appropriate antibiotic stewardship

---

### 5. Migraine Headache Report
**File:** `migraine-headache-report.json`

**Use Case:** Migraine with aura - acute episode and preventive management

**Key Features:**
- Neurological examination documentation
- Acute migraine treatment
- Preventive medication initiation
- Trigger identification and lifestyle modifications
- Comprehensive headache management plan

**Best For:** Demonstrating complex condition management with both acute and preventive strategies

---

## Report Structure

Each sample report includes the following fields:

### Required Fields:
- **title**: Brief, descriptive summary of the appointment (max 200 characters)
- **content**: Detailed clinical notes including:
  - Chief complaint
  - History of present illness
  - Review of systems
  - Physical examination findings
  - Vital signs
  - Laboratory/diagnostic results
  - Clinical reasoning

### Optional Fields:
- **diagnosis**: Primary and secondary diagnoses with clinical reasoning
- **prescription**: All medications prescribed with:
  - Drug names and dosages
  - Administration instructions
  - Duration of treatment
  - Warnings and precautions
  - Refill information
  
- **recommendations**: Patient care instructions including:
  - Follow-up schedule
  - Lifestyle modifications
  - Home care instructions
  - Patient education
  - When to seek emergency care
  - Preventive measures

- **fileUrl**: URL to attached documents (lab results, imaging, etc.)

---

## How to Use These Samples

### For Testing the API

1. **Create a Report:**
```bash
curl -X POST http://localhost:3000/appointments/{appointmentId}/report \
  -H "Authorization: Bearer {doctor_jwt_token}" \
  -H "Content-Type: application/json" \
  -d @sample-reports/routine-checkup-report.json
```

2. **Retrieve a Report:**
```bash
curl -X GET http://localhost:3000/appointments/{appointmentId}/report \
  -H "Authorization: Bearer {jwt_token}"
```

### For Frontend Development

Import sample data into your UI:
```javascript
import routineCheckup from './sample-reports/routine-checkup-report.json';
import diabetesReport from './sample-reports/diabetes-management-report.json';

// Use for testing report display components
<ReportViewer report={routineCheckup} />
```

### For Database Seeding

Use these samples to populate test data:
```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const routineCheckup = JSON.parse(
  fs.readFileSync('./sample-reports/routine-checkup-report.json', 'utf-8')
);

await prisma.appointmentReport.create({
  data: {
    appointmentId: 'existing-appointment-id',
    doctorId: 'doctor-id',
    ...routineCheckup
  }
});
```

---

## Medical Content Quality

All sample reports include:
- ✅ Realistic vital signs and lab values
- ✅ Appropriate medical terminology
- ✅ Evidence-based treatment recommendations
- ✅ Patient-centered communication
- ✅ Safety considerations and red flags
- ✅ Follow-up planning
- ✅ Comprehensive documentation

---

## Customizing Reports

To create your own sample reports based on these templates:

1. Copy an existing report that matches your use case
2. Modify patient demographics and specific details
3. Adjust vital signs and lab values appropriately
4. Update diagnosis and treatment plan
5. Ensure all JSON is valid
6. Test with the API endpoints

---

## Important Notes

### Privacy & Compliance
- All patient information is **fictional**
- No real patient data is included
- For demonstration and testing purposes only
- Do not use with actual patient information without proper de-identification

### Medical Accuracy
- Reports follow standard medical documentation practices
- Medication dosages are realistic and evidence-based
- Treatment recommendations align with clinical guidelines
- Always consult current medical literature for actual patient care

### JSON Validation
- All files are valid JSON format
- Special characters are properly escaped
- Line breaks preserved in content fields
- Compatible with standard JSON parsers

---

## Related Documentation

- [Appointment Reports API Guide](../APPOINTMENT_REPORTS_API_GUIDE.md) - Complete API documentation
- [Prisma Schema](../prisma/schema.prisma) - Database model for AppointmentReport
- [Appointment Service](../src/modules/appointment/appointment.service.ts) - Report business logic

---

## Contributing

To add new sample reports:
1. Follow the existing JSON structure
2. Include all required fields (title, content)
3. Provide comprehensive clinical information
4. Use realistic medical data
5. Update this README with the new report description
6. Test with the API before committing

---

## License

These sample reports are provided as part of the multi-clinic backend system for educational and development purposes.
