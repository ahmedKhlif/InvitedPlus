import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { TaskStatus, Priority } from '@prisma/client';
import { UploadService } from '../common/upload/upload.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    // Verify event exists and user has access
    const event = await this.prisma.event.findUnique({
      where: { id: createTaskDto.eventId },
      include: {
        attendees: true,
        organizer: true
      }
    });

    if (!event) {
      throw new BadRequestException('Event not found');
    }

    // Check if user is organizer or attendee
    const isOrganizer = event.organizerId === userId;
    const isAttendee = event.attendees.some(attendee => attendee.userId === userId);

    if (!isOrganizer && !isAttendee) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Verify assignee exists and has access to event if specified
    if (createTaskDto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: createTaskDto.assigneeId,
          OR: [
            { id: event.organizerId },
            { eventAttendees: { some: { eventId: createTaskDto.eventId } } }
          ]
        }
      });

      if (!assignee) {
        throw new BadRequestException('Assignee must be the event organizer or an attendee');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        createdById: userId,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        images: createTaskDto.images || [],
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, title: true }
        }
      }
    });

    // Create activity log for task creation
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'TASK_CREATED',
          description: `Created task "${task.title}"${task.event ? ` for event "${task.event.title}"` : ''}`,
          userId,
          entityType: 'task',
          entityId: task.id,
          metadata: {
            taskTitle: task.title,
            eventId: task.eventId,
            eventTitle: task.event?.title,
            assigneeId: task.assigneeId,
            assigneeName: task.assignee?.name,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for task creation:', error);
    }

    return task;
  }

  async findAll(query: TaskQueryDto, userId: string) {
    const {
      status,
      priority,
      assigneeId,
      eventId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = query;

    // Get user role to determine access level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Build where clause based on user role
    let where: any = {};

    if (user.role === 'ADMIN') {
      // Admin sees all tasks
      where = {};
    } else if (user.role === 'ORGANIZER') {
      // Organizer sees tasks in events they organize OR events they attend
      where = {
        event: {
          OR: [
            { organizerId: userId },
            { attendees: { some: { userId } } }
          ]
        }
      };
    } else {
      // Guest sees only tasks assigned to them
      where = {
        assigneeId: userId
      };
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (eventId) where.eventId = eventId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page.toString()) || 1;
    const limitNum = parseInt(limit.toString()) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          event: {
            select: { id: true, title: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum,
      }),
      this.prisma.task.count({ where })
    ]);

    return {
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        event: {
          OR: [
            { organizerId: userId },
            { attendees: { some: { userId } } }
          ]
        }
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, title: true }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id, userId);

    // Get user role to determine what they can update
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check permissions based on role
    if (user.role === 'GUEST') {
      // Guests can only update status of their own tasks
      if (task.assigneeId !== userId) {
        throw new ForbiddenException('You can only update your own tasks');
      }

      // Guests can only update status, not other fields
      const allowedFields = ['status'];
      const providedFields = Object.keys(updateTaskDto);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        throw new ForbiddenException('Guests can only update task status');
      }
    } else if (user.role === 'ORGANIZER') {
      // Organizers can update tasks in their events
      const event = await this.prisma.event.findUnique({
        where: { id: task.eventId },
        select: { organizerId: true }
      });

      if (event?.organizerId !== userId) {
        // If not the organizer, check if they're updating their own task
        if (task.assigneeId !== userId) {
          throw new ForbiddenException('You can only update tasks in your events or your own tasks');
        }

        // Non-organizers can only update status
        const allowedFields = ['status'];
        const providedFields = Object.keys(updateTaskDto);
        const invalidFields = providedFields.filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
          throw new ForbiddenException('You can only update task status for tasks not in your events');
        }
      }
    }
    // Admin can update anything (no restrictions)

    // Verify assignee exists and has access to event if specified
    if (updateTaskDto.assigneeId) {
      const event = await this.prisma.event.findUnique({
        where: { id: task.eventId }
      });

      const assignee = await this.prisma.user.findFirst({
        where: {
          id: updateTaskDto.assigneeId,
          OR: [
            { id: event?.organizerId },
            { eventAttendees: { some: { eventId: task.eventId } } }
          ]
        }
      });

      if (!assignee) {
        throw new BadRequestException('Assignee must be the event organizer or an attendee');
      }
    }

    // Handle image cleanup if images are being updated
    if (updateTaskDto.images !== undefined) {
      const currentImages = task.images as string[] || [];
      const newImages = updateTaskDto.images || [];

      // Find images to delete (in current but not in new)
      const imagesToDelete = currentImages.filter(img => !newImages.includes(img));

      // Clean up old images
      if (imagesToDelete.length > 0) {
        await this.uploadService.deleteImages(imagesToDelete);
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
        images: updateTaskDto.images !== undefined ? updateTaskDto.images : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        event: {
          select: { id: true, title: true }
        }
      }
    });

    // Create activity log for task update
    try {
      const action = updateTaskDto.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
      const description = updateTaskDto.status === 'COMPLETED'
        ? `Completed task "${updatedTask.title}"${updatedTask.event ? ` in event "${updatedTask.event.title}"` : ''}`
        : `Updated task "${updatedTask.title}"${updatedTask.event ? ` in event "${updatedTask.event.title}"` : ''}`;

      await this.prisma.activityLog.create({
        data: {
          action,
          description,
          userId,
          entityType: 'task',
          entityId: updatedTask.id,
          metadata: {
            taskTitle: updatedTask.title,
            eventId: updatedTask.eventId,
            eventTitle: updatedTask.event?.title,
            status: updatedTask.status,
            assigneeId: updatedTask.assigneeId,
            assigneeName: updatedTask.assignee?.name,
            changes: JSON.stringify(updateTaskDto),
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for task update:', error);
    }

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const task = await this.findOne(id, userId);

    // Get user role to determine delete permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check permissions based on role
    if (user.role === 'GUEST') {
      // Guests cannot delete any tasks
      throw new ForbiddenException('Guests cannot delete tasks');
    } else if (user.role === 'ORGANIZER') {
      // Organizers can delete tasks in their events or tasks they created
      const event = await this.prisma.event.findUnique({
        where: { id: task.eventId }
      });

      if (task.createdById !== userId && event?.organizerId !== userId) {
        throw new ForbiddenException('You can only delete tasks you created or tasks in your events');
      }
    }
    // Admin can delete anything (no restrictions)

    // Clean up task images before deletion
    const taskImages = task.images as string[] || [];
    if (taskImages.length > 0) {
      await this.uploadService.deleteImages(taskImages);
    }

    await this.prisma.task.delete({
      where: { id }
    });

    return { message: 'Task deleted successfully' };
  }

  async getTaskStats(eventId: string, userId: string) {
    // Verify user has access to the event
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { organizerId: userId },
          { attendees: { some: { userId } } }
        ]
      }
    });

    if (!event) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const [total, byStatus, byPriority, overdue] = await Promise.all([
      this.prisma.task.count({ where: { eventId } }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { eventId },
        _count: true
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { eventId },
        _count: true
      }),
      this.prisma.task.count({
        where: {
          eventId,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.COMPLETED }
        }
      })
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {}),
      overdue
    };
  }
}
