// Script to update demo account roles in production database
// This needs to be run from the backend directory with access to Prisma

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function updateDemoRoles() {
  console.log('🔄 Updating demo account roles...');
  
  try {
    // Update admin role
    const adminUser = await prisma.user.update({
      where: { email: 'admin@invitedplus.com' },
      data: { role: 'ADMIN' }
    });
    console.log('✅ Updated admin@invitedplus.com to ADMIN role');
    
    // Update organizer role
    const organizerUser = await prisma.user.update({
      where: { email: 'organizer@invitedplus.com' },
      data: { role: 'ORGANIZER' }
    });
    console.log('✅ Updated organizer@invitedplus.com to ORGANIZER role');
    
    // Guest role should already be GUEST by default, but let's confirm
    const guestUser = await prisma.user.update({
      where: { email: 'guest@invitedplus.com' },
      data: { role: 'GUEST' }
    });
    console.log('✅ Confirmed guest@invitedplus.com has GUEST role');
    
    console.log('\n🎉 All demo account roles updated successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('👤 Admin: admin@invitedplus.com / Admin123!');
    console.log('👤 Organizer: organizer@invitedplus.com / Organizer123!');
    console.log('👤 Guest: guest@invitedplus.com / Guest123!');
    
  } catch (error) {
    console.error('❌ Error updating roles:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoRoles().catch(console.error);
