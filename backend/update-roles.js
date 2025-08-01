const { PrismaClient } = require('@prisma/client');

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = 'postgresql://postgres:CAIXsuYxZIzQsoeUUIJxrSdagevQTQNw@ballast.proxy.rlwy.net:22243/railway';

const prisma = new PrismaClient();

async function updateDemoRoles() {
  console.log('🔄 Updating demo account roles...');
  
  try {
    // Check current users first
    const currentUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@invitedplus.com', 'organizer@invitedplus.com', 'guest@invitedplus.com']
        }
      },
      select: {
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('📋 Current users:');
    currentUsers.forEach(user => {
      console.log(`  ${user.email} - ${user.role} - ${user.name}`);
    });
    
    // Update admin role
    await prisma.user.update({
      where: { email: 'admin@invitedplus.com' },
      data: { role: 'ADMIN' }
    });
    console.log('✅ Updated admin@invitedplus.com to ADMIN role');
    
    // Update organizer role
    await prisma.user.update({
      where: { email: 'organizer@invitedplus.com' },
      data: { role: 'ORGANIZER' }
    });
    console.log('✅ Updated organizer@invitedplus.com to ORGANIZER role');
    
    // Verify updates
    const updatedUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@invitedplus.com', 'organizer@invitedplus.com', 'guest@invitedplus.com']
        }
      },
      select: {
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('\n📋 Updated users:');
    updatedUsers.forEach(user => {
      console.log(`  ${user.email} - ${user.role} - ${user.name}`);
    });
    
    console.log('\n🎉 Demo account roles updated successfully!');
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
