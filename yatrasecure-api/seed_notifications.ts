import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ 
    where: { email: 'browser_test@example.com' } 
  });
  
  if (users.length === 0) {
    console.log("browser_test@example.com not found. Failsafe: grabbing first user.");
    const firstUser = await prisma.user.findFirst();
    if (firstUser) users.push(firstUser);
  }
  
  for (const user of users) {
    console.log(`Creating notifications for ${user.username}`);
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'FOLLOW',
        title: 'New Follower',
        message: '@traveler_joe started following you!',
        link: '/profile/traveler_joe'
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'join_accepted',
        title: 'Trip Update',
        message: 'Your request to join "Bali Adventure" was accepted.',
        link: '/trips'
      }
    });
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'MATCH',
        title: 'New Network Match',
        message: 'You have a high compatibility match with @sarah_smith.',
        link: '/network'
      }
    });
  }
  
  console.log('Test notifications injected!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
