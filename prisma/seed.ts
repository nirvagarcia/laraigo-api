import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
      },
    }),
  ]);

  console.log(`Created ${users.length} users:`);
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email})`);
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });