import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding tasks data...');

  // Create test users if they don't exist
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      name: 'Event Organizer',
      password: hashedPassword,
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'attendee@example.com' },
    update: {},
    create: {
      email: 'attendee@example.com',
      name: 'Event Attendee',
      password: hashedPassword,
      isVerified: true,
    },
  });

  // Create test event
  const event = await prisma.event.upsert({
    where: { inviteCode: 'TEST-EVENT-001' },
    update: {},
    create: {
      title: 'Annual Company Retreat',
      description: 'A weekend retreat for team building and planning',
      startDate: new Date('2024-08-15T09:00:00Z'),
      endDate: new Date('2024-08-17T17:00:00Z'),
      location: 'Mountain Resort, Colorado',
      isPublic: false,
      maxAttendees: 50,
      inviteCode: 'TEST-EVENT-001',
      organizerId: user1.id,
    },
  });

  // Add attendee to event
  await prisma.eventAttendee.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      userId: user2.id,
    },
  });

  // Create sample tasks
  const tasks = [
    {
      title: 'Book venue and accommodation',
      description: 'Research and book the mountain resort for the retreat dates',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      dueDate: new Date('2024-07-01T23:59:59Z'),
      assigneeId: user1.id,
    },
    {
      title: 'Plan team building activities',
      description: 'Organize outdoor activities like hiking, team challenges, and workshops',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: new Date('2024-08-01T23:59:59Z'),
      assigneeId: user2.id,
    },
    {
      title: 'Arrange transportation',
      description: 'Coordinate bus transportation from office to resort',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date('2024-08-10T23:59:59Z'),
      assigneeId: user1.id,
    },
    {
      title: 'Prepare welcome packages',
      description: 'Create welcome bags with company swag and retreat schedule',
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: new Date('2024-08-12T23:59:59Z'),
      assigneeId: user2.id,
    },
    {
      title: 'Setup AV equipment for presentations',
      description: 'Ensure all presentation equipment is working and backup plans are ready',
      status: TaskStatus.TODO,
      priority: Priority.URGENT,
      dueDate: new Date('2024-08-14T23:59:59Z'),
      assigneeId: user1.id,
    },
    {
      title: 'Coordinate catering menu',
      description: 'Finalize menu with resort catering team, including dietary restrictions',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date('2024-08-05T23:59:59Z'),
      assigneeId: user1.id,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        eventId: event.id,
        createdById: user1.id,
      },
    });
  }

  console.log('✅ Tasks seeding completed!');
  console.log(`📊 Created ${tasks.length} sample tasks for event: ${event.title}`);
  console.log(`👥 Users: ${user1.name} (organizer), ${user2.name} (attendee)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding tasks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
