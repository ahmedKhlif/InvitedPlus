import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@invitedplus.com' },
    update: {},
    create: {
      email: 'admin@invitedplus.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create organizer user
  const organizerPassword = await bcrypt.hash('organizer123', 10);
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@invitedplus.com' },
    update: {},
    create: {
      email: 'organizer@invitedplus.com',
      name: 'Event Organizer',
      password: organizerPassword,
      role: 'ORGANIZER',
      isVerified: true,
    },
  });

  // Create guest user
  const guestPassword = await bcrypt.hash('guest123', 10);
  const guest = await prisma.user.upsert({
    where: { email: 'guest@invitedplus.com' },
    update: {},
    create: {
      email: 'guest@invitedplus.com',
      name: 'Guest User',
      password: guestPassword,
      role: 'GUEST',
      isVerified: true,
    },
  });

  // Create sample event
  const sampleEvent = await prisma.event.create({
    data: {
      title: 'Welcome to Invited+ Demo',
      description: 'This is a sample event to demonstrate the platform features.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      location: 'Virtual Event',
      isPublic: false,
      maxAttendees: 50,
      inviteCode: 'DEMO2024',
      organizerId: organizer.id,
    },
  });

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Setup event venue',
        description: 'Arrange the virtual meeting room and test all equipment',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assigneeId: organizer.id,
        eventId: sampleEvent.id,
        createdById: organizer.id,
      },
      {
        title: 'Send welcome emails',
        description: 'Send personalized welcome emails to all attendees',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assigneeId: organizer.id,
        eventId: sampleEvent.id,
        createdById: organizer.id,
      },
      {
        title: 'Prepare presentation materials',
        description: 'Create slides and demo materials for the event',
        status: 'COMPLETED',
        priority: 'HIGH',
        eventId: sampleEvent.id,
        createdById: organizer.id,
      },
    ],
  });

  // Create sample invitation
  await prisma.invitation.create({
    data: {
      eventId: sampleEvent.id,
      email: guest.email,
      status: 'ACCEPTED',
      invitedBy: organizer.id,
      respondedAt: new Date(),
    },
  });

  // Add guest as attendee
  await prisma.eventAttendee.create({
    data: {
      eventId: sampleEvent.id,
      userId: guest.id,
    },
  });

  // Create sample poll
  const poll = await prisma.poll.create({
    data: {
      title: 'Networking Session Time',
      description: 'What time works best for the networking session?',
      eventId: sampleEvent.id,
      createdById: organizer.id,
      allowMultiple: false,
      options: {
        create: [
          { text: '2:00 PM - 3:00 PM', order: 0 },
          { text: '3:00 PM - 4:00 PM', order: 1 },
          { text: '4:00 PM - 5:00 PM', order: 2 },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@invitedplus.com / admin123');
  console.log('👤 Organizer user: organizer@invitedplus.com / organizer123');
  console.log('👤 Guest user: guest@invitedplus.com / guest123');
  console.log(`🎉 Sample event created with invite code: ${sampleEvent.inviteCode}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
