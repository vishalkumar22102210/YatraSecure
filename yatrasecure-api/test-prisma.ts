import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }
    console.log('Test Update User ID:', user.id);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emergencyContacts: [{ name: 'Test', phone: '123' }] },
    });
    console.log('Success:', updated.emergencyContacts);
  } catch (e) {
    console.error('Prisma Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
