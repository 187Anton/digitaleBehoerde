import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Legt  Demo-Bürger an, echtes Passwort-Hashing tbd
async function main() {
  await prisma.user.upsert({
    where: { email: "buerger@example.com" },
    update: {},
    create: {
      email: "buerger@example.com",
      passwordHash: "placeholder-wird-im-auth-feature-ersetzt",
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