const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating test users for role testing...\n');

  try {
    // Test users data
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        name: 'Organizer User',
        email: 'organizer@test.com',
        password: 'organizer123',
        role: 'ORGANIZER'
      },
      {
        name: 'Guest User',
        email: 'guest@test.com',
        password: 'guest123',
        role: 'GUEST'
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isVerified: true, // Auto-verify test users
        }
      });

      console.log(`✅ Created ${userData.role} user: ${userData.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Password: ${userData.password}\n`);
    }

    console.log('🎉 Test users created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('👑 ADMIN:     admin@test.com     / admin123');
    console.log('🎯 ORGANIZER: organizer@test.com / organizer123');
    console.log('👤 GUEST:     guest@test.com     / guest123');
    console.log('\n🔥 You can now test role-based access control!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
