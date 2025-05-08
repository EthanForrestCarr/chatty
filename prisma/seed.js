const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { username: "test" },
    update: {},
    create: {
      username: "test",
      email: "test@example.com",
      password: passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { username: "dummy" },
    update: {},
    create: {
      username: "dummy",
      email: "dummy@example.com",
      password: passwordHash,
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());