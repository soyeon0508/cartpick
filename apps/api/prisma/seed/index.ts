import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { countries } from './data/countries';
import { retailers } from './data/retailers';
import { categories } from './data/categories';
import { brands } from './data/brands';

const prisma = new PrismaClient();

async function seedCountries() {
  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { ...c },
      create: { ...c },
    });
  }
  console.log(`  countries: ${countries.length} upserted`);
}

async function seedRetailers() {
  for (const r of retailers) {
    const country = await prisma.country.findUnique({
      where: { code: r.countryCode },
    });
    if (!country) throw new Error(`Country ${r.countryCode} not found`);

    const { countryCode, ...data } = r;
    await prisma.retailer.upsert({
      where: { slug: data.slug },
      update: { ...data, countryId: country.id },
      create: { ...data, countryId: country.id },
    });
  }
  console.log(`  retailers: ${retailers.length} upserted`);
}

async function seedCategories() {
  for (const c of categories) {
    const country = await prisma.country.findUnique({
      where: { code: c.countryCode },
    });
    if (!country) throw new Error(`Country ${c.countryCode} not found`);

    const { countryCode, ...data } = c;
    await prisma.category.upsert({
      where: { slug: data.slug },
      update: { ...data, countryId: country.id },
      create: { ...data, countryId: country.id },
    });
  }
  console.log(`  categories: ${categories.length} upserted`);
}

async function seedBrands() {
  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { ...b },
      create: { ...b },
    });
  }
  console.log(`  brands: ${brands.length} upserted`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@cartpick.app';
  const password = process.env.ADMIN_PASSWORD ?? 'changeme123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name: 'Admin' },
    create: { email, passwordHash, name: 'Admin' },
  });
  console.log(`  admin: ${email} upserted`);
}

async function main() {
  console.log('Seeding CartPick database...');

  await seedCountries();
  await seedRetailers();
  await seedCategories();
  await seedBrands();
  await seedAdmin();

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
