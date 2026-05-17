import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "jdheo0902@gmail.com";
  const newPassword = process.argv[3] || "jeong007";

  const hashed = await bcrypt.hash(newPassword, 12);

  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: { password: hashed },
    create: {
      email,
      password: hashed,
      name: "허정돈",
      school: "관리",
      role: "admin",
    },
  });

  console.log(`✅ Reset complete`);
  console.log(`   email: ${teacher.email}`);
  console.log(`   name:  ${teacher.name}`);
  console.log(`   role:  ${teacher.role}`);
  console.log(`   pass:  ${newPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
