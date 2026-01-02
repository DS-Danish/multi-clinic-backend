# Complete Example: Using Appointment Reports API

This document provides complete, working examples for using the appointment reports API with the provided sample data.

## Prerequisites

- Backend server running on `http://localhost:3000`
- Valid JWT tokens for doctor and patient users
- At least one completed appointment in the database

## Step-by-Step Examples

### Example 1: Doctor Uploads Annual Checkup Report

**Scenario:** Dr. Smith just completed an annual physical examination and wants to upload the report.

```javascript
// File: examples/upload-checkup-report.js

const sampleReport = require('../sample-reports/routine-checkup-report.json');

async function uploadCheckupReport() {
  const appointmentId = 'appointment-uuid-here'; // Replace with actual appointment ID
  const doctorToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Doctor's JWT token

  try {
    const response = await fetch(
      `http://localhost:3000/appointments/${appointmentId}/report`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleReport)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error uploading report:', error);
      return;
    }

    const report = await response.json();
    console.log('✅ Report uploaded successfully!');
    console.log('Report ID:', report.id);
    console.log('Title:', report.title);
    console.log('Created at:', report.createdAt);
    
    return report;
  } catch (error) {
    console.error('Failed to upload report:', error);
  }
}

// Run the function
uploadCheckupReport();
```

**Expected Output:**
```
✅ Report uploaded successfully!
Report ID: 550e8400-e29b-41d4-a716-446655440000
Title: Annual Routine Physical Examination
Created at: 2026-01-02T10:30:00.000Z
```

---

### Example 2: Doctor Uploads Multiple Reports in Sequence

**Scenario:** A busy clinic day where the doctor needs to upload multiple reports.

```javascript
// File: examples/batch-upload-reports.js

const fs = require('fs');
const path = require('path');

// Map of appointments to their corresponding sample reports
const appointmentReports = [
  {
    appointmentId: 'appt-001',
    reportFile: 'routine-checkup-report.json'
  },
  {
    appointmentId: 'appt-002',
    reportFile: 'diabetes-management-report.json'
  },
  {
    appointmentId: 'appt-003',
    reportFile: 'acute-bronchitis-report.json'
  },
  {
    appointmentId: 'appt-004',
    reportFile: 'migraine-headache-report.json'
  }
];

async function uploadReport(appointmentId, reportData, doctorToken) {
  const response = await fetch(
    `http://localhost:3000/appointments/${appointmentId}/report`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${doctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Upload failed: ${error.message}`);
  }

  return await response.json();
}

async function batchUploadReports(doctorToken) {
  console.log(`📋 Starting batch upload of ${appointmentReports.length} reports...`);
  
  const results = {
    successful: [],
    failed: []
  };

  for (const item of appointmentReports) {
    try {
      // Read the sample report file
      const reportPath = path.join(__dirname, '..', 'sample-reports', item.reportFile);
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      
      // Upload the report
      console.log(`\n⏳ Uploading report for appointment ${item.appointmentId}...`);
      const report = await uploadReport(item.appointmentId, reportData, doctorToken);
      
      console.log(`✅ Success! Report ID: ${report.id}`);
      console.log(`   Title: ${report.title}`);
      
      results.successful.push({
        appointmentId: item.appointmentId,
        reportId: report.id,
        title: report.title
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Failed for appointment ${item.appointmentId}:`, error.message);
      results.failed.push({
        appointmentId: item.appointmentId,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 BATCH UPLOAD SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('='.repeat(50));

  return results;
}

// Usage
const doctorToken = process.env.DOCTOR_JWT_TOKEN || 'your-doctor-token-here';
batchUploadReports(doctorToken)
  .then(results => {
    console.log('\n✨ Batch upload completed!');
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

---

### Example 3: Patient Retrieves Their Report

**Scenario:** Patient wants to view the report from their recent doctor's visit.

```javascript
// File: examples/patient-view-report.js

async function patientViewReport(appointmentId, patientToken) {
  try {
    console.log('📖 Retrieving appointment report...\n');
    
    const response = await fetch(
      `http://localhost:3000/appointments/${appointmentId}/report`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.message);
      return;
    }

    const data = await response.json();
    
    // Display report in a user-friendly format
    console.log('='.repeat(60));
    console.log('📋 APPOINTMENT REPORT');
    console.log('='.repeat(60));
    console.log(`\n📝 Title: ${data.title}`);
    console.log(`\n👨‍⚕️ Doctor: ${data.appointment.doctor.name}`);
    console.log(`📅 Appointment Date: ${new Date(data.appointment.startTime).toLocaleString()}`);
    console.log(`\n${'─'.repeat(60)}`);
    
    if (data.diagnosis) {
      console.log('\n🔍 DIAGNOSIS:');
      console.log(data.diagnosis.substring(0, 200) + '...');
    }
    
    if (data.prescription) {
      console.log('\n💊 PRESCRIPTION:');
      console.log(data.prescription.substring(0, 200) + '...');
    }
    
    if (data.recommendations) {
      console.log('\n📌 RECOMMENDATIONS:');
      console.log(data.recommendations.substring(0, 200) + '...');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📄 Full report content: ${data.content.length} characters`);
    console.log(`📎 Attachment: ${data.fileUrl || 'None'}`);
    console.log(`\n⏰ Report created: ${new Date(data.createdAt).toLocaleString()}`);
    console.log(`⏰ Last updated: ${new Date(data.updatedAt).toLocaleString()}`);
    
    return data;
    
  } catch (error) {
    console.error('Failed to retrieve report:', error);
  }
}

// Usage
const appointmentId = 'appointment-uuid-here';
const patientToken = 'patient-jwt-token-here';

patientViewReport(appointmentId, patientToken);
```

**Expected Output:**
```
📖 Retrieving appointment report...

============================================================
📋 APPOINTMENT REPORT
============================================================

📝 Title: Annual Routine Physical Examination

👨‍⚕️ Doctor: Dr. John Smith
📅 Appointment Date: 1/2/2026, 9:00:00 AM

────────────────────────────────────────────────────────────

🔍 DIAGNOSIS:
Healthy Adult - No Acute Medical Issues

Patient is in excellent health with all vital signs, physical examination findings, and laboratory results within normal limits. No chronic medical conditions...

💊 PRESCRIPTION:
No Prescription Medications Required

Continue Current Regimen:
1. Multivitamin - Continue taking 1 tablet daily

Over-the-Counter Recommendations:
- Continue daily multivitamin for general health maintenance...

📌 RECOMMENDATIONS:
General Health Maintenance:
1. Continue current healthy lifestyle practices
2. Maintain healthy diet rich in fruits, vegetables, whole grains, and lean proteins
3. Continue regular physical activity...

============================================================

📄 Full report content: 3542 characters
📎 Attachment: None

⏰ Report created: 1/2/2026, 10:30:00 AM
⏰ Last updated: 1/2/2026, 10:30:00 AM
```

---

### Example 4: Doctor Updates Report with Additional Information

**Scenario:** Doctor receives follow-up lab results and needs to update the report.

```javascript
// File: examples/update-report.js

async function updateReportWithLabResults(appointmentId, doctorToken) {
  try {
    console.log('🔄 Updating report with lab results...\n');
    
    // New recommendations based on lab results
    const updates = {
      recommendations: `Updated Recommendations Based on Lab Results:

Follow-up Laboratory Results (Received 48 hours post-visit):
- Vitamin D: 22 ng/mL (Low - below optimal range of 30-50)
- Thyroid Function: TSH slightly elevated at 4.8 mIU/L

NEW RECOMMENDATIONS:

1. Vitamin D Supplementation:
   - Start Vitamin D3 2000 IU daily with food
   - Recheck Vitamin D level in 8-12 weeks
   - Increase sun exposure (15-20 minutes daily when possible)

2. Thyroid Monitoring:
   - Repeat TSH and Free T4 in 6 weeks
   - Monitor for symptoms: fatigue, weight changes, cold intolerance
   - May require thyroid hormone replacement if TSH remains elevated

3. Follow-up Appointment:
   - Schedule visit in 6 weeks to review repeat labs
   - Bring list of any new symptoms
   - Continue all previous recommendations from initial visit

4. Contact Clinic If:
   - Severe fatigue develops
   - Significant weight changes (>5 lbs in 2 weeks)
   - New symptoms develop

Previous recommendations remain in effect. All other findings from initial examination were normal.`
    };

    const response = await fetch(
      `http://localhost:3000/appointments/${appointmentId}/report`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating report:', error);
      return;
    }

    const updatedReport = await response.json();
    console.log('✅ Report updated successfully!');
    console.log(`Report ID: ${updatedReport.id}`);
    console.log(`Last updated: ${new Date(updatedReport.updatedAt).toLocaleString()}`);
    console.log('\n📝 New recommendations added to report.');
    
    return updatedReport;
    
  } catch (error) {
    console.error('Failed to update report:', error);
  }
}

// Usage
const appointmentId = 'appointment-uuid-here';
const doctorToken = 'doctor-jwt-token-here';

updateReportWithLabResults(appointmentId, doctorToken);
```

---

### Example 5: Get All Reports for a Patient

**Scenario:** Patient wants to view their complete medical history.

```javascript
// File: examples/patient-medical-history.js

async function getPatientMedicalHistory(patientId, patientToken) {
  try {
    console.log('📚 Retrieving complete medical history...\n');
    
    const response = await fetch(
      `http://localhost:3000/appointments/patient/${patientId}/reports`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.message);
      return;
    }

    const reports = await response.json();
    
    console.log('='.repeat(70));
    console.log('📋 COMPLETE MEDICAL HISTORY');
    console.log('='.repeat(70));
    console.log(`\nTotal Reports Found: ${reports.length}\n`);
    
    if (reports.length === 0) {
      console.log('No medical reports found.');
      return;
    }

    // Display each report summary
    reports.forEach((item, index) => {
      console.log(`${index + 1}. ${item.report.title}`);
      console.log(`   📅 Date: ${new Date(item.appointmentDate).toLocaleDateString()}`);
      console.log(`   👨‍⚕️ Doctor: ${item.doctor.name}`);
      console.log(`   🏥 Clinic: ${item.clinic.name}`);
      console.log(`   📄 Report ID: ${item.report.id}`);
      
      if (item.report.diagnosis) {
        const diagnosisPreview = item.report.diagnosis
          .split('\n')[0]
          .substring(0, 60);
        console.log(`   🔍 Diagnosis: ${diagnosisPreview}...`);
      }
      
      console.log('');
    });
    
    console.log('='.repeat(70));
    
    return reports;
    
  } catch (error) {
    console.error('Failed to retrieve medical history:', error);
  }
}

// Usage
const patientId = 'patient-uuid-here';
const patientToken = 'patient-jwt-token-here';

getPatientMedicalHistory(patientId, patientToken);
```

**Expected Output:**
```
📚 Retrieving complete medical history...

======================================================================
📋 COMPLETE MEDICAL HISTORY
======================================================================

Total Reports Found: 4

1. Annual Routine Physical Examination
   📅 Date: 1/2/2026
   👨‍⚕️ Doctor: Dr. John Smith
   🏥 Clinic: Downtown Medical Center
   📄 Report ID: 550e8400-e29b-41d4-a716-446655440000
   🔍 Diagnosis: Healthy Adult - No Acute Medical Issues...

2. Type 2 Diabetes Management - Follow-up Consultation
   📅 Date: 12/15/2025
   👨‍⚕️ Doctor: Dr. Sarah Johnson
   🏥 Clinic: Wellness Clinic
   📄 Report ID: 660e8400-e29b-41d4-a716-446655440001
   🔍 Diagnosis: Type 2 Diabetes Mellitus - Well Controlled...

3. Acute Bronchitis - Upper Respiratory Infection
   📅 Date: 11/28/2025
   👨‍⚕️ Doctor: Dr. Michael Chen
   🏥 Clinic: Family Health Center
   📄 Report ID: 770e8400-e29b-41d4-a716-446655440002
   🔍 Diagnosis: Acute Bronchitis (Viral Upper Respiratory Infection)...

4. Hypertension Follow-up and Medication Adjustment
   📅 Date: 10/10/2025
   👨‍⚕️ Doctor: Dr. Emily Rodriguez
   🏥 Clinic: CardioHealth Clinic
   📄 Report ID: 880e8400-e29b-41d4-a716-446655440003
   🔍 Diagnosis: Essential Hypertension - Suboptimally Controlled...

======================================================================
```

---

### Example 6: Error Handling and Validation

**Scenario:** Handling common errors when working with the API.

```javascript
// File: examples/error-handling.js

async function uploadReportWithErrorHandling(appointmentId, reportData, doctorToken) {
  try {
    // Validate required fields before sending
    if (!reportData.title || reportData.title.length > 200) {
      throw new Error('Title is required and must be 200 characters or less');
    }
    
    if (!reportData.content) {
      throw new Error('Content is required');
    }

    console.log('⏳ Uploading report...');
    
    const response = await fetch(
      `http://localhost:3000/appointments/${appointmentId}/report`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      }
    );

    const data = await response.json();

    // Handle different HTTP status codes
    switch (response.status) {
      case 201:
        console.log('✅ Report created successfully!');
        console.log(`Report ID: ${data.id}`);
        return { success: true, data };

      case 400:
        if (data.message.includes('already exists')) {
          console.log('⚠️  Report already exists. Attempting update instead...');
          // Try updating the report
          return await updateReport(appointmentId, reportData, doctorToken);
        }
        console.error('❌ Bad Request:', data.message);
        return { success: false, error: data.message };

      case 401:
        console.error('❌ Authentication failed. Please check your token.');
        return { success: false, error: 'Invalid or expired token' };

      case 403:
        console.error('❌ Forbidden: You can only create reports for your own appointments.');
        return { success: false, error: 'Not authorized' };

      case 404:
        console.error('❌ Appointment not found. Please check the appointment ID.');
        return { success: false, error: 'Appointment not found' };

      default:
        console.error(`❌ Unexpected error (${response.status}):`, data.message);
        return { success: false, error: data.message };
    }
    
  } catch (error) {
    console.error('❌ Network or other error:', error.message);
    return { success: false, error: error.message };
  }
}

async function updateReport(appointmentId, reportData, doctorToken) {
  const response = await fetch(
    `http://localhost:3000/appointments/${appointmentId}/report`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${doctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    }
  );

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Report updated successfully!');
    return { success: true, data };
  } else {
    console.error('❌ Update failed:', data.message);
    return { success: false, error: data.message };
  }
}

// Usage example with error handling
const sampleReport = require('../sample-reports/routine-checkup-report.json');
const appointmentId = 'your-appointment-id';
const doctorToken = 'your-doctor-token';

uploadReportWithErrorHandling(appointmentId, sampleReport, doctorToken)
  .then(result => {
    if (result.success) {
      console.log('\n✨ Operation completed successfully!');
    } else {
      console.log('\n💔 Operation failed:', result.error);
    }
  });
```

---

## Testing Script for All Examples

Create a master test script that runs all examples:

```javascript
// File: examples/run-all-examples.js

const examples = {
  'Upload Checkup Report': require('./upload-checkup-report'),
  'Batch Upload Reports': require('./batch-upload-reports'),
  'Patient View Report': require('./patient-view-report'),
  'Update Report': require('./update-report'),
  'Patient Medical History': require('./patient-medical-history'),
  'Error Handling': require('./error-handling')
};

async function runAllExamples() {
  console.log('🚀 Running all API examples...\n');
  
  for (const [name, example] of Object.entries(examples)) {
    console.log('='.repeat(70));
    console.log(`Running: ${name}`);
    console.log('='.repeat(70));
    
    try {
      await example();
      console.log('✅ Completed\n');
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
    }
    
    // Wait between examples
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 All examples completed!');
}

runAllExamples();
```

---

## Environment Setup

Create a `.env.example` file for testing:

```bash
# API Configuration
API_BASE_URL=http://localhost:3000

# Test Tokens (replace with actual tokens)
DOCTOR_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PATIENT_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test Data IDs
TEST_APPOINTMENT_ID=appointment-uuid-here
TEST_PATIENT_ID=patient-uuid-here
TEST_DOCTOR_ID=doctor-uuid-here
```

---

## Next Steps

1. Copy the example code you need
2. Replace placeholder values with actual IDs and tokens
3. Install dependencies if needed: `npm install node-fetch` (for Node.js < 18)
4. Run the examples: `node examples/upload-checkup-report.js`
5. Check the API responses and adapt for your use case

## Support

For more information, see:
- [Full API Documentation](./APPOINTMENT_REPORTS_API_GUIDE.md)
- [Quick Reference](./QUICK_REFERENCE_REPORTS.md)
- [Sample Reports](./sample-reports/README.md)
