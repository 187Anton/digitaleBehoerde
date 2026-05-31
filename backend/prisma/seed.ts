import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

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
  await prisma.user.upsert({
    where: { email: "sachbearbeiter@example.com" },
    update: { passwordHash },
    create: {
      email: "sachbearbeiter@example.com",
      passwordHash,
      role: "CASEWORKER",
      firstName: "Sven",
      lastName: "Sachbearbeiter",
    },
  });
  console.log("Seed abgeschlossen. Demo-Login: buerger@example.com / password123");
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
