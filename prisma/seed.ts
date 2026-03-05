import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. 관리자 계정 생성
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin1234",
    12
  );

  const admin = await prisma.teacher.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@geulbit.kr" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@geulbit.kr",
      password: adminPassword,
      name: process.env.ADMIN_NAME || "관리자",
      school: "관리",
      role: "admin",
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // 2. 초기 초대 코드 10개 생성
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: nanoid(8).toUpperCase(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일
    });
  }

  await prisma.inviteCode.createMany({
    data: codes,
    skipDuplicates: true,
  });

  console.log(`✅ ${codes.length} invite codes created:`);
  codes.forEach((c) => console.log(`   ${c.code}`));

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
