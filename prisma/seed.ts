import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PAKISTANI_FIRST_NAMES = {
  male: [
    "Muhammad",
    "Ahmed",
    "Ali",
    "Hassan",
    "Hussain",
    "Bilal",
    "Usman",
    "Hamza",
    "Abdullah",
    "Saad",
    "Fahad",
    "Talha",
    "Adeel",
    "Owais",
    "Zain",
  ],
  female: [
    "Ayesha",
    "Fatima",
    "Maryam",
    "Zainab",
    "Sana",
    "Hira",
    "Iqra",
    "Mahnoor",
    "Rabia",
    "Kiran",
    "Hafsa",
    "Laiba",
    "Noor",
    "Amna",
    "Mehwish",
  ],
} as const;

const PAKISTANI_LAST_NAMES = [
  "Khan",
  "Ahmed",
  "Ali",
  "Hussain",
  "Malik",
  "Sheikh",
  "Qureshi",
  "Butt",
  "Siddiqui",
  "Raza",
  "Mirza",
  "Chaudhry",
  "Farooq",
  "Nawaz",
  "Iqbal",
] as const;

const COMMON_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "COPD",
  "Arthritis",
  "Depression",
  "Anxiety",
  "Migraine",
  "Back Pain",
  "Heart Disease",
  "Allergies",
  "Thyroid Disorder",
  "High Cholesterol",
  "Obesity",
  "Sleep Apnea",
] as const;

const REALISTIC_CLINICS = [
  { name: "St. Mary's Medical Center", city: "Wah Cantt" },
  { name: "Johns Hopkins Community Health", city: "Rawalpindi" },
  { name: "Mayo Clinic Satellite", city: "Islamabad" },
  { name: "Cleveland Clinic Express", city: "Wah Cantt" },
  { name: "Mass General Health Center", city: "Rawalpindi" },
  { name: "Cedar-Sinai Outpatient", city: "Islamabad" },
  { name: "Northwestern Medicine Center", city: "Wah Cantt" },
  { name: "UCSF Health Plaza", city: "Rawalpindi" },
  { name: "Houston Methodist Clinic", city: "Wah Cantt" },
  { name: "Duke Health Center", city: "Islamabad" },
] as const;

type SeedGender = keyof typeof PAKISTANI_FIRST_NAMES;
type RoleValue =
  | "SYSTEM_ADMIN"
  | "CLINIC_ADMIN"
  | "DOCTOR"
  | "PATIENT"
  | "RECEPTIONIST";
type AppointmentStatusValue =
  | "PENDING"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";
type BillStatusValue = "PAID" | "UNPAID";

type CreatedClinic = {
  id: string;
  name: string;
};

type CreatedPatient = {
  id: string;
};

type SpecialityRef = {
  id: string;
};

type ClinicWithDoctors = {
  id: string;
  doctors: Array<{ doctorId: string }>;
};

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function toEmailPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function generatePakistaniIdentity(
  gender: SeedGender,
): {
  firstName: string;
  lastName: string;
  fullName: string;
  emailHandle: string;
} {
  const firstName = pickRandom(PAKISTANI_FIRST_NAMES[gender]);
  const lastName = pickRandom(PAKISTANI_LAST_NAMES);

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    emailHandle: `${toEmailPart(firstName)}.${toEmailPart(lastName)}`,
  };
}

function asRole(role: RoleValue): RoleValue {
  return role;
}

function asAppointmentStatus(
  status: AppointmentStatusValue,
): AppointmentStatusValue {
  return status;
}

function asBillStatus(status: BillStatusValue): BillStatusValue {
  return status;
}

async function main(): Promise<void> {
  const plainPassword = "12345";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const { faker } = await import("@faker-js/faker");

  let generatedEmailSequence = 1;

  const createUniqueEmail = (emailHandle: string, domain: string): string =>
    `${emailHandle}.${generatedEmailSequence++}@${domain}`;

  console.log("🌱 Starting seeding with realistic healthcare data...");

  console.log("🧹 Cleaning existing data...");
  await prisma.appointmentReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.activationToken.deleteMany();
  await prisma.clinicDoctorSpeciality.deleteMany();
  await prisma.clinicReceptionist.deleteMany();
  await prisma.clinicDoctor.deleteMany();
  await prisma.clinicSpeciality.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();
  await prisma.speciality.deleteMany();
  console.log("✅ Database cleaned");

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
    skipDuplicates: true,
  });

  const specialityList = await prisma.speciality.findMany({
    select: {
      id: true,
    },
  });

  console.log(`✅ Created ${specialityList.length} specialities`);

  const clinics: CreatedClinic[] = [];

  for (const clinicData of REALISTIC_CLINICS) {
    const adminIdentity = generatePakistaniIdentity(
      pickRandom(["male", "female"] as const),
    );

    const admin = await prisma.user.create({
      data: {
        name: `${adminIdentity.fullName}, MD`,
        email: `admin.${clinicData.city.toLowerCase().replace(/\s/g, "")}@${clinicData.name
          .split(" ")[0]
          .toLowerCase()}.com`,
        phone: faker.phone.number(),
        isActive: true,
        role: asRole("CLINIC_ADMIN"),
        password: hashedPassword,
        emailVerified: true,
      },
    });

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicData.name,
        code:
          clinicData.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase() + faker.string.numeric(3),
        email: `contact@${clinicData.name.split(" ")[0].toLowerCase()}.com`,
        phone: faker.phone.number(),
        adminId: admin.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const assignedSpecs = faker.helpers.arrayElements(
      specialityList,
      faker.number.int({ min: 3, max: 7 }),
    ) as SpecialityRef[];

    for (const spec of assignedSpecs) {
      await prisma.clinicSpeciality.create({
        data: {
          clinicId: clinic.id,
          specialityId: spec.id,
        },
      });
    }

    clinics.push(clinic);
  }

  console.log(`🏥 Created ${clinics.length} realistic clinics`);

  let totalDoctors = 0;
  let totalReceptionists = 0;

  for (const clinic of clinics) {
    const doctorCount = faker.number.int({ min: 8, max: 15 });

    for (let i = 0; i < doctorCount; i++) {
      const gender = faker.helpers.arrayElement(["male", "female"] as const);
      const doctorIdentity = generatePakistaniIdentity(gender);

      const doctor = await prisma.user.create({
        data: {
          name: `Dr. ${doctorIdentity.fullName}`,
          email: createUniqueEmail(doctorIdentity.emailHandle, "clinic.com"),
          phone: faker.phone.number(),
          isActive: faker.datatype.boolean(0.95),
          role: asRole("DOCTOR"),
          password: hashedPassword,
          emailVerified: true,
        },
      });

      const clinicDoctor = await prisma.clinicDoctor.create({
        data: {
          clinicId: clinic.id,
          doctorId: doctor.id,
        },
      });

      const specs = faker.helpers.arrayElements(
        specialityList,
        faker.number.int({ min: 1, max: 2 }),
      ) as SpecialityRef[];

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

    const receptionistCount = faker.number.int({ min: 2, max: 5 });

    for (let j = 0; j < receptionistCount; j++) {
      const receptionistIdentity = generatePakistaniIdentity(
        faker.helpers.arrayElement(["male", "female"] as const),
      );

      const receptionist = await prisma.user.create({
        data: {
          name: receptionistIdentity.fullName,
          email: createUniqueEmail(receptionistIdentity.emailHandle, "clinic.com"),
          phone: faker.phone.number(),
          isActive: true,
          role: asRole("RECEPTIONIST"),
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

  console.log(
    `👨‍⚕️ Created ${totalDoctors} doctors and ${totalReceptionists} receptionists`,
  );

  const patientsCount = 300;
  const patients: CreatedPatient[] = [];

  for (let i = 0; i < patientsCount; i++) {
    const gender = faker.helpers.arrayElement(["male", "female"] as const);
    const patientIdentity = generatePakistaniIdentity(gender);

    const patient = await prisma.user.create({
      data: {
        name: patientIdentity.fullName,
        email: createUniqueEmail(patientIdentity.emailHandle, "email.com"),
        phone: faker.phone.number(),
        isActive: true,
        role: asRole("PATIENT"),
        password: hashedPassword,
        emailVerified: true,
      },
      select: {
        id: true,
      },
    });

    patients.push(patient);
  }

  console.log(`🧍 Created ${patients.length} patients`);

  const allClinics = (await prisma.clinic.findMany({
    select: {
      id: true,
      doctors: {
        select: {
          doctorId: true,
        },
      },
    },
  })) as ClinicWithDoctors[];

  let appointmentCount = 0;
  let billCount = 0;
  let paymentCount = 0;

  const totalAppointments = faker.number.int({ min: 500, max: 800 });

  for (let i = 0; i < totalAppointments; i++) {
    const clinic = faker.helpers.arrayElement(allClinics) as ClinicWithDoctors;

    const doctorLink = faker.helpers.arrayElement(
      clinic.doctors,
    ) as { doctorId: string } | undefined;

    if (!doctorLink) {
      continue;
    }

    const doctorId = doctorLink.doctorId;
    const patient = faker.helpers.arrayElement(patients);

    const appointmentDate = faker.date.between({
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    appointmentDate.setHours(faker.number.int({ min: 9, max: 16 }));
    appointmentDate.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));
    appointmentDate.setSeconds(0);
    appointmentDate.setMilliseconds(0);

    const endTime = new Date(appointmentDate);
    endTime.setMinutes(
      endTime.getMinutes() + faker.helpers.arrayElement([15, 30, 45, 60]),
    );

    const statusRoll = Math.random();
    let status: AppointmentStatusValue;

    if (statusRoll < 0.6) {
      status = asAppointmentStatus("COMPLETED");
    } else if (statusRoll < 0.8) {
      status = asAppointmentStatus("SCHEDULED");
    } else if (statusRoll < 0.9) {
      status = asAppointmentStatus("CANCELLED");
    } else {
      status = asAppointmentStatus("PENDING");
    }

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        doctorId,
        patientId: patient.id,
        startTime: appointmentDate,
        endTime,
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

    if (status === "COMPLETED" || status === "SCHEDULED") {
      const consultationFee = faker.number.float({
        min: 50,
        max: 300,
        multipleOf: 5,
      });

      const procedureFee = faker.datatype.boolean(0.3)
        ? faker.number.float({
            min: 100,
            max: 500,
            multipleOf: 10,
          })
        : 0;

      const labFee = faker.datatype.boolean(0.4)
        ? faker.number.float({
            min: 50,
            max: 200,
            multipleOf: 5,
          })
        : 0;

      const totalAmount = consultationFee + procedureFee + labFee;

      const discount = faker.datatype.boolean(0.3)
        ? faker.number.float({
            min: 10,
            max: 100,
            multipleOf: 5,
          })
        : 0;

      const billStatus: BillStatusValue =
        status === "COMPLETED"
          ? asBillStatus(
              faker.helpers.weightedArrayElement([
                { weight: 0.8, value: "PAID" as const },
                { weight: 0.2, value: "UNPAID" as const },
              ]),
            )
          : asBillStatus("UNPAID");

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
          totalRevenue: Math.floor(
            clinicAppointments * avgRevenuePerAppointment,
          ),
          outstandingPayments: Math.floor(
            clinicAppointments * avgRevenuePerAppointment * 0.2,
          ),
        },
      },
    });
  }

  console.log("📊 Reports generated");
  console.log("\n✅ Seeding complete with realistic healthcare data!");
  console.log("\n📈 Summary:");
  console.log(`   - ${clinics.length} clinics`);
  console.log(`   - ${totalDoctors} doctors`);
  console.log(`   - ${totalReceptionists} receptionists`);
  console.log(`   - ${patients.length} patients`);
  console.log(`   - ${appointmentCount} appointments`);
  console.log(`   - ${billCount} bills`);
  console.log(`   - ${paymentCount} payments`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async (): Promise<void> => {
    await prisma.$disconnect();
  });
