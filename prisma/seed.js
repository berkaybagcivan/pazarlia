const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "satici@ornek.com" },
    update: {},
    create: {
      email: "satici@ornek.com",
      name: "Örnek Satıcı",
      passwordHash: "gecici",
      role: "SELLER",
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      storeName: "Örnek Mağaza",
      description: "Test satıcısı",
      approved: true,
      userId: user.id,
    },
  });

  const categoryData = [
    { name: "Elektronik", slug: "elektronik" },
    { name: "Giyim", slug: "giyim" },
    { name: "Ev & Yaşam", slug: "ev-yasam" },
  ];

  const categories = {};
  for (const c of categoryData) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const products = [
    { title: "Kablosuz Bluetooth Kulaklık", slug: "bluetooth-kulaklik", price: 129900, stock: 25, category: "elektronik", description: "Gürültü engelleme özellikli kablosuz kulaklık." },
    { title: "Akıllı Saat", slug: "akilli-saat", price: 249900, stock: 12, category: "elektronik", description: "Nabız ve uyku takibi yapan akıllı saat." },
    { title: "Taşınabilir Şarj Cihazı 20000 mAh", slug: "powerbank", price: 89900, stock: 40, category: "elektronik", description: "Hızlı şarj destekli powerbank." },
    { title: "Pamuklu Basic Tişört", slug: "basic-tisort", price: 34900, stock: 100, category: "giyim", description: "Yumuşak dokulu, günlük kullanım için tişört." },
    { title: "Slim Fit Kot Pantolon", slug: "kot-pantolon", price: 79900, stock: 60, category: "giyim", description: "Rahat kesim, dayanıklı kot pantolon." },
    { title: "Spor Ayakkabı", slug: "spor-ayakkabi", price: 189900, stock: 30, category: "giyim", description: "Hafif ve esnek tabanlı spor ayakkabı." },
    { title: "Seramik Kupa Seti (4'lü)", slug: "kupa-seti", price: 44900, stock: 50, category: "ev-yasam", description: "El yapımı görünümlü seramik kupa seti." },
    { title: "LED Masa Lambası", slug: "masa-lambasi", price: 59900, stock: 35, category: "ev-yasam", description: "Ayarlanabilir ışık seviyeli masa lambası." },
  ];

  for (const p of products) {
    const { category, ...data } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        sellerId: seller.id,
        categoryId: categories[category].id,
        images: {
          create: [{ url: `https://picsum.photos/seed/${p.slug}/400/400` }],
        },
      },
    });
  }

  console.log("Örnek veriler eklendi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());