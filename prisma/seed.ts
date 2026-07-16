import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@quicklogistics.com";
  let admin = await prisma.user.findUnique({ where: { email } });

  if (!admin) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "BQUICK Logistics Admin",
        role: "ADMIN",
      },
    });
    console.log("Seeded admin account:", email, "password: ChangeMe123!");
  } else {
    console.log("Admin already exists:", email);
  }

  const existingRate = await prisma.exchangeRate.findFirst();
  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: { rate: 0.55, setById: admin.id },
    });
    console.log("Seeded initial exchange rate: 1 GHS = 0.55 RMB");
  }

  const existingSettings = await prisma.exchangePaymentSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!existingSettings) {
    await prisma.exchangePaymentSettings.create({
      data: {
        id: "singleton",
        momoNumber: "024-000-0000",
        momoName: "BQUICK Logistics (set real number in Admin > RMB Exchange)",
        updatedById: admin.id,
      },
    });
    console.log("Seeded placeholder exchange payment settings");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
