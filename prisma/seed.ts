import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.lead.deleteMany();
  await prisma.lead.create({
    data: {
      name: "Демо-сид",
      email: "seed@example.com",
      message: "Тестовый лид из prisma db seed",
      processingStatus: "PENDING",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
