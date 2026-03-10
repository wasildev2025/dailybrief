import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@oasdev.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@oasdev.com",
      passwordHash,
      role: Role.ADMIN,
      displayOrder: 0,
      isActive: true,
    },
  });

  const members = [
    { name: "Mr. Akmal", email: "akmal@oasdev.com", displayOrder: 1 },
    { name: "Mr. Usama", email: "usama@oasdev.com", displayOrder: 2 },
    { name: "Mr. Rehan", email: "rehan@oasdev.com", displayOrder: 3 },
    { name: "Mr. Sarim", email: "sarim@oasdev.com", displayOrder: 4 },
  ];

  for (const member of members) {
    await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: Role.MEMBER,
        displayOrder: member.displayOrder,
        isActive: true,
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "greeting_template" },
    update: {},
    create: {
      key: "greeting_template",
      value: "Assalam o Alikum Sir!",
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "report_header" },
    update: {},
    create: {
      key: "report_header",
      value: "OAS Dev - Update",
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "report_footer" },
    update: {},
    create: {
      key: "report_footer",
      value: "FIP",
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "member_prefix" },
    update: {},
    create: {
      key: "member_prefix",
      value: "🔸",
    },
  });

  // Seed default task statuses
  const existingStatuses = await prisma.taskStatus.count();
  if (existingStatuses === 0) {
    const defaults = [
      { label: "To Do", color: "#6b7280", sortOrder: 0, isDefault: true },
      { label: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { label: "Under Dev", color: "#8b5cf6", sortOrder: 2 },
      { label: "Under Review", color: "#f59e0b", sortOrder: 3 },
      { label: "Completed", color: "#10b981", sortOrder: 4 },
    ];
    for (const d of defaults) {
      await prisma.taskStatus.create({ data: d });
    }
    console.log("Seeded default task statuses");
  }

  // Seed sample data for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sampleData = [
    {
      email: "akmal@oasdev.com",
      tasks: [
        "Working on Full Independent Containerization of Wasil MVP",
        "AWS/Third-Party Emulation: MinIO with auto-created buckets, Carbone for PDF generation.",
        "Auth bypass enabled, local AI routes debugged for stable LLM testing.",
        "Removed dependency over AWS.",
      ],
    },
    {
      email: "usama@oasdev.com",
      tasks: [
        "Working on Admin module - 2 x MRs (Merge Requests) created - currently under review",
      ],
    },
    {
      email: "rehan@oasdev.com",
      tasks: [
        "Infra Review with DevOps Engineer (IBS) - Held a session to review the current infrastructure setup and workflows.",
        "Stack Analysis - Gained a thorough understanding of the technologies, services, and architecture used in the existing infrastructure.",
      ],
    },
    {
      email: "sarim@oasdev.com",
      tasks: [
        "React JS Tutorial for developing Frontend - undergoing",
        "Practical implementation of React components in local environment",
      ],
    },
  ];

  for (const data of sampleData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) continue;

    const update = await prisma.dailyUpdate.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { status: "SUBMITTED" },
      create: {
        userId: user.id,
        date: today,
        status: "SUBMITTED",
      },
    });

    await prisma.dailyTask.deleteMany({
      where: { dailyUpdateId: update.id },
    });

    for (let i = 0; i < data.tasks.length; i++) {
      await prisma.dailyTask.create({
        data: {
          dailyUpdateId: update.id,
          text: data.tasks[i],
          sortOrder: i,
        },
      });
    }
  }

  // Seed sample attendance for today
  const attendanceData = [
    { email: "akmal@oasdev.com", status: AttendanceStatus.PRESENT, reason: null },
    { email: "usama@oasdev.com", status: AttendanceStatus.ABSENT, reason: "Sick leave" },
    { email: "rehan@oasdev.com", status: AttendanceStatus.REMOTE, reason: null },
    { email: "sarim@oasdev.com", status: AttendanceStatus.LEAVE, reason: "Personal work" },
  ];

  for (const att of attendanceData) {
    const user = await prisma.user.findUnique({ where: { email: att.email } });
    if (!user) continue;

    await prisma.attendance.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { status: att.status, reason: att.reason },
      create: {
        userId: user.id,
        date: today,
        status: att.status,
        reason: att.reason,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`Admin: admin@oasdev.com / password123`);
  console.log(`Members: akmal@oasdev.com, usama@oasdev.com, rehan@oasdev.com, sarim@oasdev.com`);
  console.log(`All passwords: password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
