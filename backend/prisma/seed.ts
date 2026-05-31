import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("DemoPasswort123");

  await prisma.user.upsert({
    where: { email: "buerger@example.com" },
    update: { passwordHash },
    create: {
      email: "buerger@example.com",
      passwordHash,
      role: "CITIZEN",
      firstName: "Bea",
      lastName: "Buerger",
    },
  });

  console.log("Seed abgeschlossen.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
