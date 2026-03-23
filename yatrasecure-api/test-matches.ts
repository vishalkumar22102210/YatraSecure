import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersCount = await prisma.user.count();
  console.log(`Users in DB: ${usersCount}`);

  // Create a matched test user for browser_test@example.com
  const existingTestUser = await prisma.user.findUnique({ where: { username: 'testmatchuser' } });
  
  if (!existingTestUser) {
    await prisma.user.create({
      data: {
        email: 'testmatchuser@example.com',
        username: 'testmatchuser',
        passwordHash: 'dummyhash',
        firstName: 'Test',
        lastName: 'Match',
        city: 'Mumbai',
        hometown: 'Delhi',
        state: 'Maharashtra',
        country: 'India',
        bio: 'Explorer of mountains and cafes',
        age: 25,
        gender: 'Male',
        travelStyle: ['Backpacker', 'Foodie'],
        interests: ['Photography', 'food', 'mountains', 'wildlife', 'Trekking'],
        travelPersonality: 'Explorer',
        reputationScore: 85,
        isVerified: true
      }
    });
    console.log('Created testmatchuser');
  } else {
    // update it
    await prisma.user.update({
      where: { username: 'testmatchuser' },
      data: {
        city: 'Mumbai',
        travelStyle: ['Backpacker', 'Foodie'],
        interests: ['Photography', 'food', 'mountains', 'wildlife', 'Trekking'],
        travelPersonality: 'Explorer',
      }
    });
    console.log('Updated testmatchuser');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
