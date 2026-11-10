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
    {
      title: "Kablosuz Bluetooth Kulaklık",
      slug: "bluetooth-kulaklik",
      price: 129900,
      stock: 25,
      category: "elektronik",
      description: "Gürültü engelleme özellikli kablosuz kulaklık.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Akıllı Saat",
      slug: "akilli-saat",
      price: 249900,
      stock: 12,
      category: "elektronik",
      description: "Nabız ve uyku takibi yapan akıllı saat.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Taşınabilir Şarj Cihazı 20000 mAh",
      slug: "powerbank",
      price: 89900,
      stock: 40,
      category: "elektronik",
      description: "Hızlı şarj destekli powerbank.",
      image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Pamuklu Basic Tişört",
      slug: "basic-tisort",
      price: 34900,
      stock: 100,
      category: "giyim",
      description: "Yumuşak dokulu, günlük kullanım için tişört.",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Slim Fit Kot Pantolon",
      slug: "kot-pantolon",
      price: 79900,
      stock: 60,
      category: "giyim",
      description: "Rahat kesim, dayanıklı kot pantolon.",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Spor Ayakkabı",
      slug: "spor-ayakkabi",
      price: 189900,
      stock: 30,
      category: "giyim",
      description: "Hafif ve esnek tabanlı spor ayakkabı.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Seramik Kupa Seti (4'lü)",
      slug: "kupa-seti",
      price: 44900,
      stock: 50,
      category: "ev-yasam",
      description: "El yapımı görünümlü seramik kupa seti.",
      image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "LED Masa Lambası",
      slug: "masa-lambasi",
      price: 59900,
      stock: 35,
      category: "ev-yasam",
      description: "Ayarlanabilir ışık seviyeli masa lambası.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const p of products) {
    const { category, image, ...data } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        sellerId: seller.id,
        categoryId: categories[category].id,
        images: {
          create: [{ url: image }],
        },
      },
    });
  }

  console.log("Örnek veriler gerçek görsellerle eklendi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());