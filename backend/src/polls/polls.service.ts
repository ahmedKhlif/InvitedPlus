import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  async create(createPollDto: any, userId: string) {
    const { title, description, options, eventId, allowMultiple = false, endDate } = createPollDto;

    if (!options || options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    // Get user role to determine poll creation permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check poll creation permissions based on role
    if (user.role === 'GUEST') {
      throw new ForbiddenException('Guests cannot create polls');
    }

    // If eventId is provided, verify user has permission to create polls for this event
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          organizerId: true,
          attendees: {
            where: { userId },
            select: { id: true }
          }
        }
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      // Permission check based on role
      if (user.role === 'ORGANIZER') {
        // Organizers can only create polls for events they organize
        if (event.organizerId !== userId) {
          throw new ForbiddenException('You can only create polls for events you organize');
        }
      }
      // Admins can create polls for any event (no additional check needed)
    }

    const poll = await this.prisma.poll.create({
      data: {
        title,
        description,
        createdById: userId,
        eventId,
        allowMultiple,
        endDate: endDate ? new Date(endDate) : null,
        options: {
          create: options.map((option: string, index: number) => ({
            text: option,
            order: index,
          })),
        },
      },
      include: {
        options: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create activity log for poll creation
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'POLL_CREATED',
          description: `Created poll "${poll.title}"${poll.event ? ` for event "${poll.event.title}"` : ''}`,
          userId,
          entityType: 'poll',
          entityId: poll.id,
          metadata: {
            pollTitle: poll.title,
            eventId: poll.eventId,
            eventTitle: poll.event?.title,
            optionsCount: poll.options.length,
            allowMultiple: poll.allowMultiple,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for poll creation:', error);
    }

    return {
      success: true,
      message: 'Poll created successfully',
      poll,
    };
  }

  async findAll(userId: string, query: any = {}) {
    const { eventId, page = 1, limit = 10 } = query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (eventId) {
      // Verify user has access to the event
      const event = await this.prisma.event.findFirst({
        where: {
          id: eventId,
          OR: [
            { organizerId: userId },
            { attendees: { some: { userId } } },
          ],
        },
      });

      if (!event) {
        throw new ForbiddenException('You do not have access to this event');
      }

      where.eventId = eventId;
    } else {
      // Get polls from events user has access to or polls they created
      where.OR = [
        { createdById: userId },
        { event: { organizerId: userId } },
        { event: { attendees: { some: { userId } } } },
        { eventId: null }, // Global polls
      ];
    }

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          options: {
            include: {
              _count: {
                select: {
                  votes: true,
                },
              },
              votes: {
                where: { userId },
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.poll.count({ where }),
    ]);

    return {
      success: true,
      polls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { event: { organizerId: userId } },
          { event: { attendees: { some: { userId } } } },
          { eventId: null }, // Global polls
        ],
      },
      include: {
        options: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
            votes: {
              where: { userId },
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return {
      success: true,
      poll,
    };
  }

  async update(id: string, updatePollDto: any, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found or you do not have permission to update it');
    }

    const { title, description, endDate } = updatePollDto;

    const updatedPoll = await this.prisma.poll.update({
      where: { id },
      data: {
        title,
        description,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      include: {
        options: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Poll updated successfully',
      poll: updatedPoll,
    };
  }

  async remove(id: string, userId: string) {
    // Get user role to determine delete permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const poll = await this.prisma.poll.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        title: true
      }
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check permissions based on role
    if (user.role === 'GUEST') {
      throw new ForbiddenException('Guests cannot delete polls');
    } else if (user.role === 'ORGANIZER') {
      // Organizers can only delete polls they created
      if (poll.createdById !== userId) {
        throw new ForbiddenException('You can only delete polls you created');
      }
    }
    // Admins can delete any poll (no additional check needed)

    await this.prisma.poll.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Poll deleted successfully',
    };
  }

  async vote(pollId: string, optionId: string, userId: string) {
    // Verify user has access to the poll
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        OR: [
          { createdById: userId },
          { event: { organizerId: userId } },
          { event: { attendees: { some: { userId } } } },
          { eventId: null }, // Global polls
        ],
      },
      include: {
        options: true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll has ended
    if (poll.endDate && new Date() > poll.endDate) {
      throw new BadRequestException('Poll has ended');
    }

    // Verify option belongs to this poll
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      throw new BadRequestException('Invalid option');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.pollVote.findFirst({
      where: {
        pollId,
        userId,
      },
    });

    let voteAction = 'voted';

    if (existingVote && !poll.allowMultiple) {
      // Update existing vote if single choice
      await this.prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId },
      });
      voteAction = 'changed vote';
    } else if (!existingVote || poll.allowMultiple) {
      // Create new vote
      await this.prisma.pollVote.create({
        data: {
          pollId,
          optionId,
          userId,
        },
      });
    } else {
      throw new BadRequestException('You have already voted on this poll');
    }

    // Create activity log for poll vote
    try {
      await this.prisma.activityLog.create({
        data: {
          action: 'POLL_VOTED',
          description: `${voteAction} on poll "${poll.title}"`,
          userId,
          entityType: 'poll',
          entityId: pollId,
          metadata: {
            pollTitle: poll.title,
            optionId,
            optionText: option.text,
            eventId: poll.eventId,
            voteAction,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create activity log for poll vote:', error);
      // Don't fail the vote if activity log fails
    }

    return {
      success: true,
      message: 'Vote submitted successfully',
    };
  }

  async getResults(pollId: string, userId: string) {
    // Get user role to determine access level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        OR: [
          { createdById: userId },
          { event: { organizerId: userId } },
          { event: { attendees: { some: { userId } } } },
          { eventId: null }, // Global polls
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        },
        options: {
          include: {
            _count: {
              select: {
                votes: true,
              },
            },
            // Include voter details for poll creators and admins
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalVotes = poll._count.votes;
    const canViewDetails = user?.role === 'ADMIN' || poll.createdById === userId;

    const results = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0,
      // Include voter details only for poll creators and admins
      voters: canViewDetails && option.votes ?
        option.votes.map(vote => ({
          id: vote.user.id,
          name: vote.user.name,
          email: vote.user.email,
          votedAt: vote.createdAt,
        })) : undefined,
    }));

    return {
      success: true,
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        totalVotes,
        endDate: poll.endDate,
        allowMultiple: poll.allowMultiple,
        createdBy: poll.createdBy,
      },
      results,
      canViewDetails,
    };
  }
}
