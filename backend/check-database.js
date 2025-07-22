const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE STATE\n');

  try {
    // Check users
    console.log('1. 👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    });

    // Check events
    console.log('\n2. 📅 EVENTS:');
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: { name: true, email: true }
        },
        attendees: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    events.forEach(event => {
      console.log(`   - ${event.title} (ID: ${event.id})`);
      console.log(`     Invite Code: ${event.inviteCode}`);
      console.log(`     Organizer: ${event.organizer.name} (${event.organizer.email})`);
      console.log(`     Attendees: ${event.attendees.length}`);
      event.attendees.forEach(attendee => {
        console.log(`       - ${attendee.user.name} (${attendee.user.email})`);
      });
    });

    // Check tasks
    console.log('\n3. 📋 TASKS:');
    const tasks = await prisma.task.findMany({
      include: {
        assignee: {
          select: { name: true, email: true }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        event: {
          select: { title: true }
        }
      }
    });

    console.log(`   Total tasks: ${tasks.length}`);
    tasks.slice(0, 3).forEach(task => {
      console.log(`   - ${task.title} (${task.status})`);
      console.log(`     Event: ${task.event?.title || 'No event'}`);
      console.log(`     Assignee: ${task.assignee?.name || 'Unassigned'}`);
      console.log(`     Created by: ${task.createdBy?.name || 'Unknown'}`);
    });

    // Check specific user access to events
    console.log('\n4. 🔐 USER ACCESS CHECK:');
    const organizerUser = users.find(u => u.email === 'organizer@example.com');
    if (organizerUser) {
      console.log(`   Checking access for: ${organizerUser.name} (${organizerUser.email})`);
      
      // Check events where user is organizer
      const organizedEvents = await prisma.event.findMany({
        where: { organizerId: organizerUser.id },
        select: { id: true, title: true }
      });
      
      console.log(`   - Organized events: ${organizedEvents.length}`);
      organizedEvents.forEach(event => {
        console.log(`     - ${event.title} (${event.id})`);
      });

      // Check events where user is attendee
      const attendedEvents = await prisma.event.findMany({
        where: {
          attendees: {
            some: { userId: organizerUser.id }
          }
        },
        select: { id: true, title: true }
      });
      
      console.log(`   - Attended events: ${attendedEvents.length}`);
      attendedEvents.forEach(event => {
        console.log(`     - ${event.title} (${event.id})`);
      });
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
