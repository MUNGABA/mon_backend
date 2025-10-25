const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Candidat
  await prisma.user.create({
    data: {
      nom: "Kabasele",
      postnom: "Mbuyi",
      prenom: "Jean",
      tel: "+243970000000",
      adresse: "Kinshasa",
      email: "candidat@example.com",
      password: hashedPassword,
      role: "CANDIDAT"
    },
  });

  // Agent
  await prisma.user.create({
    data: {
      nom: "Mbala",
      postnom: "Ngoma",
      prenom: "Paul",
      tel: "+243970111111",
      adresse: "Kinshasa",
      email: "agent@example.com",
      password: hashedPassword,
      role: "AGENT"
    },
  });

  // Admin
  await prisma.user.create({
    data: {
      nom: "Kabongo",
      postnom: "Lusamba",
      prenom: "Marie",
      tel: "+243970222222",
      adresse: "Kinshasa",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN"
    },
  });
}

main()
  .then(() => {
    console.log("🌱 Users seeded successfully!");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
