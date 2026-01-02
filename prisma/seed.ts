import { AppointmentStatus, Clinic, PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Realistic healthcare data
const REALISTIC_PATIENT_NAMES = {
  male: ["James Smith", "John Johnson", "Robert Williams", "Michael Brown", "William Jones", "David Garcia", "Richard Martinez", "Joseph Rodriguez", "Thomas Davis", "Charles Lopez"],
  female: ["Mary Johnson", "Patricia Williams", "Jennifer Brown", "Linda Davis", "Elizabeth Miller", "Barbara Wilson", "Susan Moore", "Jessica Taylor", "Sarah Anderson", "Karen Thomas"],
};

const COMMON_CONDITIONS = [
  "Hypertension", "Type 2 Diabetes", "Asthma", "COPD", "Arthritis",
  "Depression", "Anxiety", "Migraine", "Back Pain", "Heart Disease",
  "Allergies", "Thyroid Disorder", "High Cholesterol", "Obesity", "Sleep Apnea"
];

const REALISTIC_CLINICS = [
  { name: "St. Mary's Medical Center", city: "New York" },
  { name: "Johns Hopkins Community Health", city: "Baltimore" },
  { name: "Mayo Clinic Satellite", city: "Rochester" },
  { name: "Cleveland Clinic Express", city: "Cleveland" },
  { name: "Mass General Health Center", city: "Boston" },
  { name: "Cedar-Sinai Outpatient", city: "Los Angeles" },
  { name: "Northwestern Medicine Center", city: "Chicago" },
  { name: "UCSF Health Plaza", city: "San Francisco" },
  { name: "Houston Methodist Clinic", city: "Houston" },
  { name: "Duke Health Center", city: "Durham" },
];

async function main() {
  const plainPassword: string = "12345"; // fixed password
  const hashedPassword: string = await bcrypt.hash(plainPassword, 10);
  const { faker } = await import("@faker-js/faker");  // ✅ dynamic import
  console.log("🌱 Starting seeding with realistic healthcare data...");

  // ---------- Specialities ----------
  const specialityNames = [
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Orthopedics",
    "Neurology",
    "ENT (Ear, Nose & Throat)",
    "Obstetrics & Gynecology",
    "Psychiatry",
    "Dentistry",
    "General Medicine",
    "Endocrinology",
    "Gastroenterology",
    "Ophthalmology",
    "Pulmonology",
    "Urology",
  ];

  await prisma.speciality.createMany({
    data: specialityNames.map((name) => ({ name })),
  });

  const specialityList = await prisma.speciality.findMany();
  console.log(`✅ Created ${specialityList.length} specialities`);

  // ---------- Realistic Clinics ----------
  const clinics: Clinic[] = [];

  for (const clinicData of REALISTIC_CLINICS) {
    const admin = await prisma.user.create({
      data: {
        name: `${faker.person.firstName()} ${faker.person.lastName()}, MD`,
        email: `admin.${clinicData.city.toLowerCase().replace(/\s/g, '')}@${clinicData.name.split(' ')[0].toLowerCase()}.com`,
        phone: faker.phone.number(),
        isActive: true,
        role: Role.CLINIC_ADMIN,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicData.name,
        code: clinicData.name.split(' ').map(w => w[0]).join('').toUpperCase() + faker.string.numeric(3),
        email: `contact@${clinicData.name.split(' ')[0].toLowerCase()}.com`,
        phone: faker.phone.number(),
        adminId: admin.id,
      },
    });

    // Each clinic has 3-7 specialties
    const assignedSpecs = faker.helpers.arrayElements(
      specialityList,
      faker.number.int({ min: 3, max: 7 })
    );
    for (const spec of assignedSpecs) {
      await prisma.clinicSpeciality.create({
        data: { clinicId: clinic.id, specialityId: spec.id },
      });
    }

    clinics.push(clinic);
  }
  console.log(`🏥 Created ${clinics.length} realistic clinics`);

  // ---------- Doctors & Receptionists ----------
  let totalDoctors = 0;
  let totalReceptionists = 0;

  for (const clinic of clinics) {
    // 8-15 doctors per clinic
    const doctorCount = faker.number.int({ min: 8, max: 15 });
    
    for (let i = 0; i < doctorCount; i++) {
      const gender = faker.helpers.arrayElement(['male', 'female'] as const);
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      
      const doctor = await prisma.user.create({
        data: {
          name: `Dr. ${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@clinic.com`,
          phone: faker.phone.number(),
          isActive: faker.datatype.boolean(0.95), // 95% active
          role: Role.DOCTOR,
          password: hashedPassword,
          emailVerified: true,
        },
      });

      const clinicDoctor = await prisma.clinicDoctor.create({
        data: { clinicId: clinic.id, doctorId: doctor.id },
      });

      // Doctors have 1-2 specialties usually
      const specs = faker.helpers.arrayElements(
        specialityList,
        faker.number.int({ min: 1, max: 2 })
      );
      for (const spec of specs) {
        await prisma.clinicDoctorSpeciality.create({
          data: {
            clinicDoctorId: clinicDoctor.id,
            specialityId: spec.id,
          },
        });
      }
      totalDoctors++;
    }

    // 2-5 receptionists per clinic
    const receptionistCount = faker.number.int({ min: 2, max: 5 });
    for (let j = 0; j < receptionistCount; j++) {
      const receptionist = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: faker.phone.number(),
          isActive: true,
          role: Role.RECEPTIONIST,
          password: hashedPassword,
          emailVerified: true,
        },
      });

      await prisma.clinicReceptionist.create({
        data: {
          clinicId: clinic.id,
          receptionistId: receptionist.id,
        },
      });
      totalReceptionists++;
    }
  }

  console.log(`👨‍⚕️ Created ${totalDoctors} doctors and ${totalReceptionists} receptionists`);

  // ---------- Realistic Patients with Demographics ----------
  const patientsCount = 300;
  const patients: User[] = [];

  for (let i = 0; i < patientsCount; i++) {
    const gender = faker.helpers.arrayElement(['male', 'female'] as const);
    const age = faker.number.int({ min: 18, max: 85 });
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    
    const patient = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({ min: 1, max: 999 })}@email.com`,
        phone: faker.phone.number('###-###-####'),
        isActive: true,
        role: Role.PATIENT,
        password: hashedPassword,
        emailVerified: true,
      },
    });
    patients.push(patient);
  }
  console.log(`🧍 Created ${patients.length} patients`);

  // ---------- Realistic Appointments, Bills, Payments ----------
  const allClinics = await prisma.clinic.findMany({ include: { doctors: true } });
  let appointmentCount = 0;
  let billCount = 0;
  let paymentCount = 0;

  // Generate 500-800 appointments with realistic patterns
  const totalAppointments = faker.number.int({ min: 500, max: 800 });

  for (let i = 0; i < totalAppointments; i++) {
    const clinic = faker.helpers.arrayElement(allClinics);
    const doctorLink = faker.helpers.arrayElement(clinic.doctors);
    if (!doctorLink) continue;

    const doctorId = doctorLink.doctorId;
    const patient = faker.helpers.arrayElement(patients);

    // Realistic appointment times (past 6 months to next 3 months)
    const appointmentDate = faker.date.between({ 
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)    // 3 months ahead
    });
    
    // Set to business hours (9 AM - 5 PM)
    appointmentDate.setHours(faker.number.int({ min: 9, max: 16 }));
    appointmentDate.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));
    appointmentDate.setSeconds(0);

    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + faker.helpers.arrayElement([15, 30, 45, 60]));

    // Status distribution: 60% completed, 20% scheduled, 10% cancelled, 10% pending
    const statusRoll = Math.random();
    let status: AppointmentStatus;
    if (statusRoll < 0.60) status = AppointmentStatus.COMPLETED;
    else if (statusRoll < 0.80) status = AppointmentStatus.SCHEDULED;
    else if (statusRoll < 0.90) status = AppointmentStatus.CANCELLED;
    else status = AppointmentStatus.PENDING;

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        doctorId,
        patientId: patient.id,
        startTime: appointmentDate,
        endTime: endTime,
        status,
        priority: faker.helpers.weightedArrayElement([
          { weight: 0.7, value: "MEDIUM" },
          { weight: 0.2, value: "LOW" },
          { weight: 0.1, value: "HIGH" },
        ]),
        notes: faker.helpers.arrayElement([
          "Annual checkup",
          "Follow-up appointment",
          "Initial consultation",
          `Chief complaint: ${faker.helpers.arrayElement(COMMON_CONDITIONS)}`,
          "Routine physical examination",
          "Lab work review",
          "Medication refill",
        ]),
      },
    });
    appointmentCount++;

    // Only create bills for completed or scheduled appointments
    if (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.SCHEDULED) {
      // Realistic pricing based on appointment type
      const consultationFee = faker.number.float({ min: 50, max: 300, multipleOf: 5 });
      const procedureFee = faker.datatype.boolean(0.3) ? faker.number.float({ min: 100, max: 500, multipleOf: 10 }) : 0;
      const labFee = faker.datatype.boolean(0.4) ? faker.number.float({ min: 50, max: 200, multipleOf: 5 }) : 0;
      
      const totalAmount = consultationFee + procedureFee + labFee;
      const discount = faker.datatype.boolean(0.3) ? faker.number.float({ min: 10, max: 100, multipleOf: 5 }) : 0;

      const billStatus = status === AppointmentStatus.COMPLETED 
        ? faker.helpers.weightedArrayElement([
            { weight: 0.8, value: "PAID" },
            { weight: 0.2, value: "UNPAID" },
          ])
        : "UNPAID";

      const bill = await prisma.bill.create({
        data: {
          appointmentId: appointment.id,
          totalAmount,
          discount,
          status: billStatus,
          patientId: patient.id,
        },
      });
      billCount++;

      if (bill.status === "PAID") {
        await prisma.payment.create({
          data: {
            billId: bill.id,
            amount: bill.totalAmount - (bill.discount ?? 0),
            method: faker.helpers.weightedArrayElement([
              { weight: 0.4, value: "CARD" },
              { weight: 0.3, value: "CASH" },
              { weight: 0.3, value: "ONLINE" },
            ]),
          },
        });
        paymentCount++;
      }
    }
  }

  console.log(`📅 Created ${appointmentCount} appointments`);
  console.log(`💵 Created ${billCount} bills and ${paymentCount} payments`);

  // ---------- Realistic Reports ----------
  for (const clinic of clinics) {
    const clinicAppointments = appointmentCount / clinics.length;
    const avgRevenuePerAppointment = 150;
    
    await prisma.report.create({
      data: {
        clinicId: clinic.id,
        type: "DAILY_SUMMARY",
        data: {
          totalAppointments: Math.floor(clinicAppointments),
          completedAppointments: Math.floor(clinicAppointments * 0.6),
          cancelledAppointments: Math.floor(clinicAppointments * 0.1),
          totalRevenue: Math.floor(clinicAppointments * avgRevenuePerAppointment),
          outstandingPayments: Math.floor(clinicAppointments * avgRevenuePerAppointment * 0.2),
        },
      },
    });
  }

  console.log("📊 Reports generated");
  console.log("\n✅ Seeding complete with realistic healthcare data!");
  console.log(`\n📈 Summary:`);
  console.log(`   - ${clinics.length} clinics`);
  console.log(`   - ${totalDoctors} doctors`);
  console.log(`   - ${totalReceptionists} receptionists`);
  console.log(`   - ${patients.length} patients`);
  console.log(`   - ${appointmentCount} appointments`);
  console.log(`   - ${billCount} bills`);
  console.log(`   - ${paymentCount} payments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
