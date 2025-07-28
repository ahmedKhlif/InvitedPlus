import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MessageReactionsService {
  constructor(private prisma: PrismaService) {}

  async addReaction(messageId: string, userId: string, emoji: string) {
    // Check if message exists
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user already reacted with this emoji
    const existingReaction = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Remove reaction if it already exists (toggle behavior)
      await this.prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });

      return {
        success: true,
        action: 'removed',
        message: 'Reaction removed'
      };
    } else {
      // Add new reaction
      const reaction = await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      return {
        success: true,
        action: 'added',
        reaction,
        message: 'Reaction added'
      };
    }
  }

  async getMessageReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {} as Record<string, any>);

    return {
      success: true,
      reactions: Object.values(groupedReactions)
    };
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const reaction = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.messageReaction.delete({
      where: { id: reaction.id }
    });

    return {
      success: true,
      message: 'Reaction removed'
    };
  }

  async getUserReactions(messageId: string, userId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: {
        messageId,
        userId
      }
    });

    return {
      success: true,
      reactions: reactions.map(r => r.emoji)
    };
  }

  async getPopularEmojis() {
    const reactions = await this.prisma.messageReaction.groupBy({
      by: ['emoji'],
      _count: {
        emoji: true
      },
      orderBy: {
        _count: {
          emoji: 'desc'
        }
      },
      take: 10
    });

    return {
      success: true,
      popularEmojis: reactions.map(r => ({
        emoji: r.emoji,
        count: r._count.emoji
      }))
    };
  }
}
