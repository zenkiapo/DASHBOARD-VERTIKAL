import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/auth/demoAccounts.js";

const prisma = new PrismaClient();

async function seedDemoUsers() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_SEED !== "true"
  ) {
    throw new Error(
      "Seed akun demo dinonaktifkan di production; set ALLOW_DEMO_SEED=true jika memang dibutuhkan.",
    );
  }
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  for (const account of DEMO_ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        passwordHash,
        role: account.role,
        assignedClass: account.assignedClass,
      },
      create: {
        ...account,
        passwordHash,
      },
    });
  }

  console.log(`Seeded ${DEMO_ACCOUNTS.length} demo accounts.`);
}

seedDemoUsers()
  .catch((error: unknown) => {
    console.error("Failed to seed demo accounts.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
