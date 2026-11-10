const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.log("Kullanım: node prisma\\make-admin.js eposta@adres.com");
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("Bu e-postayla kayıtlı kullanıcı yok. Önce sitede giriş yap.");
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`${email} artık yönetici.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());