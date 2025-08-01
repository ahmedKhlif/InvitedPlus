import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UploadService } from '../common/upload/upload.service';

@Injectable()
export class WhiteboardService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async getEventWhiteboard(eventId: string, userId: string) {
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);

    let whiteboard = await this.prisma.whiteboard.findFirst({
      where: { eventId },
      include: {
        elements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create default whiteboard if none exist
    if (!whiteboard) {
      whiteboard = await this.prisma.whiteboard.create({
        data: {
          eventId,
          name: 'Main Whiteboard',
          data: { elements: [] }
        },
        include: {
          elements: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    }

    return {
      success: true,
      whiteboard
    };
  }

  async getAllEventWhiteboards(eventId: string, userId: string) {
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);

    let whiteboards = await this.prisma.whiteboard.findMany({
      where: { eventId },
      include: {
        elements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Create default whiteboard if none exist
    if (whiteboards.length === 0) {
      const defaultWhiteboard = await this.prisma.whiteboard.create({
        data: {
          eventId,
          name: 'Main Whiteboard',
          data: { elements: [] }
        },
        include: {
          elements: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      whiteboards = [defaultWhiteboard];
    }

    return {
      success: true,
      whiteboards
    };
  }

  async createWhiteboard(eventId: string, userId: string, whiteboardData: { name: string; data?: any }) {
    // Verify user has access to the event and is organizer
    const event = await this.verifyEventAccess(eventId, userId);

    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only event organizers can create new whiteboards');
    }

    const whiteboard = await this.prisma.whiteboard.create({
      data: {
        eventId,
        name: whiteboardData.name,
        data: whiteboardData.data || { elements: [] }
      },
      include: {
        elements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return {
      success: true,
      whiteboard
    };
  }

  async updateWhiteboard(whiteboardId: string, userId: string, updateData: { data: any }) {
    const whiteboard = await this.prisma.whiteboard.findUnique({
      where: { id: whiteboardId },
      include: { event: true }
    });

    if (!whiteboard) {
      throw new NotFoundException('Whiteboard not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(whiteboard.eventId, userId);

    const updatedWhiteboard = await this.prisma.whiteboard.update({
      where: { id: whiteboardId },
      data: {
        data: updateData.data,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      whiteboard: updatedWhiteboard
    };
  }

  async deleteWhiteboard(whiteboardId: string, userId: string) {
    const whiteboard = await this.prisma.whiteboard.findUnique({
      where: { id: whiteboardId },
      include: { event: true }
    });

    if (!whiteboard) {
      throw new NotFoundException('Whiteboard not found');
    }

    // Verify user has access to the event and is organizer
    const event = await this.verifyEventAccess(whiteboard.eventId, userId);

    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only event organizers can delete whiteboards');
    }

    // Check if this is the last whiteboard
    const whiteboardCount = await this.prisma.whiteboard.count({
      where: { eventId: whiteboard.eventId }
    });

    if (whiteboardCount <= 1) {
      throw new ForbiddenException('Cannot delete the last whiteboard');
    }

    // Delete all elements first
    await this.prisma.whiteboardElement.deleteMany({
      where: { whiteboardId }
    });

    // Delete the whiteboard
    await this.prisma.whiteboard.delete({
      where: { id: whiteboardId }
    });

    return {
      success: true,
      message: 'Whiteboard deleted successfully'
    };
  }

  async addElement(eventId: string, userId: string, elementData: any) {
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);

    // Get or create whiteboard
    let whiteboard = await this.prisma.whiteboard.findFirst({
      where: { eventId }
    });

    if (!whiteboard) {
      whiteboard = await this.prisma.whiteboard.create({
        data: {
          eventId,
          data: { elements: [] }
        }
      });
    }

    // Add element
    const element = await this.prisma.whiteboardElement.create({
      data: {
        whiteboardId: whiteboard.id,
        type: elementData.type,
        data: elementData.data,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    return {
      success: true,
      element
    };
  }

  async updateElement(elementId: string, userId: string, elementData: any) {
    const element = await this.prisma.whiteboardElement.findUnique({
      where: { id: elementId },
      include: {
        whiteboard: {
          include: {
            event: true
          }
        }
      }
    });

    if (!element) {
      throw new NotFoundException('Element not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(element.whiteboard.eventId, userId);

    // Update element
    const updatedElement = await this.prisma.whiteboardElement.update({
      where: { id: elementId },
      data: {
        data: elementData.data,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    return {
      success: true,
      element: updatedElement
    };
  }

  async deleteElement(elementId: string, userId: string) {
    const element = await this.prisma.whiteboardElement.findUnique({
      where: { id: elementId },
      include: {
        whiteboard: {
          include: {
            event: true
          }
        }
      }
    });

    if (!element) {
      throw new NotFoundException('Element not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(element.whiteboard.eventId, userId);

    // Only allow deletion by the element creator or event organizer
    if (element.userId !== userId && element.whiteboard.event.organizerId !== userId) {
      throw new ForbiddenException('You can only delete your own elements or as event organizer');
    }

    await this.prisma.whiteboardElement.delete({
      where: { id: elementId }
    });

    return {
      success: true,
      message: 'Element deleted successfully'
    };
  }

  async clearWhiteboard(eventId: string, userId: string) {
    // Verify user has access to the event
    const event = await this.verifyEventAccess(eventId, userId);

    // Only allow clearing by event organizer
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only event organizers can clear the whiteboard');
    }

    const whiteboard = await this.prisma.whiteboard.findFirst({
      where: { eventId }
    });

    if (whiteboard) {
      await this.prisma.whiteboardElement.deleteMany({
        where: { whiteboardId: whiteboard.id }
      });

      await this.prisma.whiteboard.update({
        where: { id: whiteboard.id },
        data: {
          data: { elements: [] },
          updatedAt: new Date()
        }
      });
    }

    return {
      success: true,
      message: 'Whiteboard cleared successfully'
    };
  }

  async saveWhiteboardSnapshot(eventId: string, userId: string, snapshotData: any) {
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);

    let whiteboard = await this.prisma.whiteboard.findFirst({
      where: { eventId }
    });

    if (!whiteboard) {
      whiteboard = await this.prisma.whiteboard.create({
        data: {
          eventId,
          data: snapshotData
        }
      });
    } else {
      whiteboard = await this.prisma.whiteboard.update({
        where: { id: whiteboard.id },
        data: {
          data: snapshotData,
          updatedAt: new Date()
        }
      });
    }

    return {
      success: true,
      whiteboard
    };
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          where: { userId }
        }
      }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is organizer or attendee
    const isOrganizer = event.organizerId === userId;
    const isAttendee = event.attendees.length > 0;

    if (!isOrganizer && !isAttendee) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async uploadImage(file: any, eventId: string, userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);

    try {
      // Use the upload service to save the image to Cloudinary
      const imageUrl = await this.uploadService.uploadSingleImage(file, 'events');

      return {
        success: true,
        message: 'Image uploaded successfully',
        imageUrl,
      };
    } catch (error) {
      console.error('Error uploading whiteboard image:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }
}
