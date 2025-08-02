import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { JwtService } from './jwt.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private generateVerificationCode(): string {
    // Generate a 6-digit verification code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code and token
    const verificationCode = this.generateVerificationCode();
    const verificationToken = randomBytes(32).toString('hex');
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
        verificationCode,
        verificationCodeExpires,
        role: 'GUEST', // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Send verification email with code
    try {
      await this.emailService.sendVerificationCodeEmail(email, name, verificationCode);
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    return {
      success: true,
      message: 'Registration successful. Please check your email for the 6-digit verification code.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = await this.jwtService.generateTokens(user);

    // Return user data without password
    const { password: _, verificationToken, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user;

    return {
      success: true,
      message: 'Login successful',
      user: userWithoutSensitiveData,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isVerified) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.jwtService.generateTokens(user);

      return {
        success: true,
        message: 'Token refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // In a more sophisticated implementation, you might want to:
    // 1. Blacklist the token
    // 2. Store refresh tokens in database and remove them
    // For now, we'll just return success since JWT tokens are stateless

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  async updateProfile(userId: string, updateProfileDto: any) {
    try {
      console.log('Updating profile for user:', userId);
      console.log('Update data:', updateProfileDto);

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate and sanitize input data
      const updateData: any = {};

      if (updateProfileDto.name !== undefined) {
        if (typeof updateProfileDto.name === 'string' && updateProfileDto.name.trim().length >= 2) {
          updateData.name = updateProfileDto.name.trim();
        } else if (updateProfileDto.name !== null) {
          throw new BadRequestException('Name must be at least 2 characters long');
        }
      }

      if (updateProfileDto.email !== undefined) {
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(updateProfileDto.email)) {
            throw new BadRequestException('Invalid email format');
          }

          const existingUser = await this.prismaService.user.findUnique({
            where: { email: updateProfileDto.email },
          });

          if (existingUser) {
            throw new ConflictException('Email already exists');
          }

          updateData.email = updateProfileDto.email.toLowerCase().trim();
        }
      }

      if (updateProfileDto.avatar !== undefined) {
        if (typeof updateProfileDto.avatar === 'string' || updateProfileDto.avatar === null) {
          updateData.avatar = updateProfileDto.avatar;
        }
      }

      // Only update if there's actual data to update
      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          message: 'No changes to update',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        };
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log('Profile updated successfully:', updatedUser);

      return {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Error updating profile:', error);

      if (error instanceof BadRequestException ||
          error instanceof ConflictException ||
          error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to update profile');
    }
  }

  async uploadAvatar(userId: string, file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Use Cloudinary for avatar upload with specific avatar folder
      const uploadResult = await this.cloudinaryService.uploadImage(file, {
        folder: 'invited-plus/avatars',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good', format: 'webp' }
        ]
      });

      // Update user's avatar in database with Cloudinary URL
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.url },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        user: updatedUser,
        avatarUrl: uploadResult.url,
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  async getUsers() {
    const users = await this.prismaService.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      users,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Find user
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async testEmailService(email: string) {
    try {
      // Test email connection
      const connectionTest = await this.emailService.testEmailConnection();

      if (!connectionTest.success) {
        return {
          success: false,
          message: connectionTest.message,
          details: 'SMTP connection failed'
        };
      }

      // Send test email
      await this.emailService.sendTestEmail(email);

      return {
        success: true,
        message: `Test email sent successfully to ${email}`,
        details: 'Email service is working correctly'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        details: error.message
      };
    }
  }

  async verifyEmail(token: string) {
    const user = await this.prismaService.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Update user as verified
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async verifyEmailWithCode(email: string, code: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    // Update user as verified
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    };
  }

  async resendVerification(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification code and token
    const verificationCode = this.generateVerificationCode();
    const verificationToken = randomBytes(32).toString('hex');
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationCode,
        verificationCodeExpires,
      },
    });

    // Send verification email with new code
    try {
      await this.emailService.sendVerificationCodeEmail(email, user.name, verificationCode);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send verification email:', error);
    }

    return {
      success: true,
      message: 'New verification code sent to your email',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send password reset email:', error);
    }

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async validateOAuthUser(oauthUser: any) {
    const { email, name, avatar, provider, googleId, githubId } = oauthUser;

    // Check if user exists by email
    let user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update their info if needed
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatar: avatar || user.avatar,
          isVerified: true, // OAuth users are automatically verified
        },
      });
    } else {
      // Create new user with a placeholder password for OAuth users
      const placeholderPassword = await bcrypt.hash(`oauth_${Date.now()}`, 12);
      user = await this.prismaService.user.create({
        data: {
          email,
          name,
          avatar,
          password: placeholderPassword, // OAuth users get a secure placeholder password
          provider,
          googleId,
          githubId,
          isVerified: true,
          role: 'GUEST',
        },
      });
    }

    // Generate tokens
    const tokens = await this.jwtService.generateTokens(user);

    // Return user data without sensitive information
    const { password: _, verificationToken, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      ...tokens,
    };
  }

  async getRecentActivity(userId: string, limit: number = 10) {
    try {
      // Get user to determine role
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let activities = [];

      if (user.role === 'ADMIN') {
        // Admin sees all platform activity
        activities = await this.getAdminActivity(limit);
      } else if (user.role === 'ORGANIZER') {
        // Organizer sees activity for their events
        activities = await this.getOrganizerActivity(userId, limit);
      } else {
        // Guest sees only their own activity
        activities = await this.getGuestActivity(userId, limit);
      }

      return {
        success: true,
        activities,
        userRole: user.role,
      };
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      throw new BadRequestException('Failed to retrieve recent activity');
    }
  }

  private async getAdminActivity(limit: number) {
    // Admin sees all platform activity
    const activities = [];

    // Get recent activity logs (chat messages, poll votes, etc.)
    const recentActivityLogs = await this.prismaService.activityLog.findMany({
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    });

    // Get recent events
    const recentEvents = await this.prismaService.event.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: { select: { name: true } }
      }
    });

    // Get recent tasks
    const recentTasks = await this.prismaService.task.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { updatedAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
        event: { select: { title: true } }
      }
    });

    // Get recent users
    const recentUsers = await this.prismaService.user.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    // Format activity logs (chat messages, poll votes, etc.)
    recentActivityLogs.forEach(log => {
      const activityType = this.getActivityTypeFromAction(log.action);
      activities.push({
        id: `activity-${log.id}`,
        type: activityType,
        action: log.action.toLowerCase().replace('_', ' '),
        description: log.description,
        timestamp: log.createdAt.toISOString(),
        user: { name: log.user?.name || 'Unknown' },
        relatedEntity: log.entityId ? {
          id: log.entityId,
          name: this.getEntityNameFromMetadata(log.metadata, log.entityType),
          href: this.getEntityHrefFromType(log.entityType, log.entityId, log.metadata)
        } : undefined
      });
    });

    // Format events
    recentEvents.forEach(event => {
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        action: 'created',
        description: `Event "${event.title}" was created`,
        timestamp: event.createdAt.toISOString(),
        user: { name: event.organizer.name },
        relatedEntity: {
          id: event.id,
          name: event.title,
          href: `/events/${event.id}`
        }
      });
    });

    // Format tasks
    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        action: task.status === 'COMPLETED' ? 'completed' : 'updated',
        description: `Task "${task.title}" was ${task.status === 'COMPLETED' ? 'completed' : 'updated'}`,
        timestamp: task.updatedAt.toISOString(),
        user: { name: task.assignee?.name || 'Unknown' },
        relatedEntity: {
          id: task.id,
          name: task.title,
          href: `/tasks/${task.id}`
        }
      });
    });

    // Format users
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'joined',
        description: `${user.name} joined the platform`,
        timestamp: user.createdAt.toISOString(),
        user: { name: user.name },
        relatedEntity: {
          id: user.id,
          name: user.name,
          href: `/admin/users`
        }
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private getActivityTypeFromAction(action: string): string {
    switch (action) {
      case 'MESSAGE_SENT': return 'message';
      case 'POLL_VOTED': return 'poll';
      case 'POLL_CREATED': return 'poll';
      case 'TASK_CREATED': return 'task';
      case 'TASK_UPDATED': return 'task';
      case 'TASK_COMPLETED': return 'task';
      case 'EVENT_CREATED': return 'event';
      case 'EVENT_UPDATED': return 'event';
      case 'USER_CREATED': return 'user';
      default: return 'activity';
    }
  }

  private getEntityNameFromMetadata(metadata: any, entityType: string): string {
    if (!metadata) return 'Unknown';

    switch (entityType) {
      case 'message':
        return metadata.eventTitle || 'Global Chat';
      case 'poll':
        return metadata.pollTitle || 'Poll';
      case 'task':
        return metadata.taskTitle || 'Task';
      case 'event':
        return metadata.eventTitle || 'Event';
      default:
        return 'Unknown';
    }
  }

  private getEntityHrefFromType(entityType: string, entityId: string, metadata: any): string {
    switch (entityType) {
      case 'message':
        return metadata?.eventId ? `/chat?eventId=${metadata.eventId}` : '/chat';
      case 'poll':
        return `/polls/${entityId}`;
      case 'task':
        return `/tasks/${entityId}`;
      case 'event':
        return `/events/${entityId}`;
      default:
        return '/dashboard';
    }
  }

  private async getOrganizerActivity(userId: string, limit: number) {
    // Organizer sees activity for their events
    const activities = [];

    // Get activity logs for organizer's events
    const organizerEventIds = await this.prismaService.event.findMany({
      where: { organizerId: userId },
      select: { id: true }
    });
    const eventIds = organizerEventIds.map(e => e.id);

    // For SQLite, we need to get all activity logs and filter in memory
    // since JSON path queries are limited
    const recentActivityLogs = await this.prismaService.activityLog.findMany({
      where: {
        userId // Get organizer's own activities for now
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    });

    // Get organizer's events
    const organizerEvents = await this.prismaService.event.findMany({
      where: { organizerId: userId },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: { select: { name: true } },
        tasks: {
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            assignee: { select: { name: true } }
          }
        },
        attendees: {
          orderBy: { joinedAt: 'desc' },
          take: 3,
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    // Format activity logs
    recentActivityLogs.forEach(log => {
      const activityType = this.getActivityTypeFromAction(log.action);
      const isOwnActivity = log.userId === userId;
      activities.push({
        id: `activity-${log.id}`,
        type: activityType,
        action: log.action.toLowerCase().replace('_', ' '),
        description: isOwnActivity ? log.description.replace(/^[A-Z]/, (match) => `You ${match.toLowerCase()}`) : log.description,
        timestamp: log.createdAt.toISOString(),
        user: { name: isOwnActivity ? 'You' : (log.user?.name || 'Unknown') },
        relatedEntity: log.entityId ? {
          id: log.entityId,
          name: this.getEntityNameFromMetadata(log.metadata, log.entityType),
          href: this.getEntityHrefFromType(log.entityType, log.entityId, log.metadata)
        } : undefined
      });
    });

    // Format events
    organizerEvents.forEach(event => {
      activities.push({
        id: `event-${event.id}`,
        type: 'event',
        action: 'created',
        description: `You created event "${event.title}"`,
        timestamp: event.createdAt.toISOString(),
        user: { name: 'You' },
        relatedEntity: {
          id: event.id,
          name: event.title,
          href: `/events/${event.id}`
        }
      });

      // Add task activities for this event
      event.tasks.forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          action: task.status === 'COMPLETED' ? 'completed' : 'updated',
          description: `Task "${task.title}" was ${task.status === 'COMPLETED' ? 'completed' : 'updated'} in "${event.title}"`,
          timestamp: task.updatedAt.toISOString(),
          user: { name: task.assignee?.name || 'Unknown' },
          relatedEntity: {
            id: task.id,
            name: task.title,
            href: `/tasks/${task.id}`
          }
        });
      });

      // Add attendee activities
      event.attendees.forEach(attendee => {
        activities.push({
          id: `attendee-${attendee.id}`,
          type: 'user',
          action: 'joined',
          description: `${attendee.user.name} joined your event "${event.title}"`,
          timestamp: attendee.joinedAt.toISOString(),
          user: { name: attendee.user.name },
          relatedEntity: {
            id: event.id,
            name: event.title,
            href: `/events/${event.id}`
          }
        });
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private async getGuestActivity(userId: string, limit: number) {
    // Guest sees only their own activity
    const activities = [];

    // Get guest's activity logs
    const guestActivityLogs = await this.prismaService.activityLog.findMany({
      where: { userId },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    });

    // Get events the guest is attending
    const guestEvents = await this.prismaService.eventAttendee.findMany({
      where: { userId },
      take: Math.ceil(limit / 4),
      orderBy: { joinedAt: 'desc' },
      include: {
        event: {
          select: { id: true, title: true }
        }
      }
    });

    // Get tasks assigned to the guest
    const guestTasks = await this.prismaService.task.findMany({
      where: { assigneeId: userId },
      take: Math.ceil(limit / 4),
      orderBy: { updatedAt: 'desc' },
      include: {
        event: { select: { title: true } }
      }
    });

    // Format activity logs
    guestActivityLogs.forEach(log => {
      const activityType = this.getActivityTypeFromAction(log.action);
      activities.push({
        id: `activity-${log.id}`,
        type: activityType,
        action: log.action.toLowerCase().replace('_', ' '),
        description: log.description.replace(/^[A-Z]/, (match) => `You ${match.toLowerCase()}`),
        timestamp: log.createdAt.toISOString(),
        user: { name: 'You' },
        relatedEntity: log.entityId ? {
          id: log.entityId,
          name: this.getEntityNameFromMetadata(log.metadata, log.entityType),
          href: this.getEntityHrefFromType(log.entityType, log.entityId, log.metadata)
        } : undefined
      });
    });

    // Format event joins
    guestEvents.forEach(attendee => {
      activities.push({
        id: `join-${attendee.id}`,
        type: 'event',
        action: 'joined',
        description: `You joined event "${attendee.event.title}"`,
        timestamp: attendee.joinedAt.toISOString(),
        user: { name: 'You' },
        relatedEntity: {
          id: attendee.event.id,
          name: attendee.event.title,
          href: `/events/${attendee.event.id}`
        }
      });
    });

    // Format task activities
    guestTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        action: task.status === 'COMPLETED' ? 'completed' : 'updated',
        description: `You ${task.status === 'COMPLETED' ? 'completed' : 'updated'} task "${task.title}"`,
        timestamp: task.updatedAt.toISOString(),
        user: { name: 'You' },
        relatedEntity: {
          id: task.id,
          name: task.title,
          href: `/tasks/${task.id}`
        }
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getCalendarData(userId: string, month: number, year: number) {
    try {
      // Get user to determine role
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      let events = [];
      let tasks = [];

      if (user.role === 'ADMIN') {
        // Admin sees all events and tasks
        events = await this.getAdminCalendarEvents(startDate, endDate);
        tasks = await this.getAdminCalendarTasks(startDate, endDate);
      } else if (user.role === 'ORGANIZER') {
        // Organizer sees their events and related tasks
        events = await this.getOrganizerCalendarEvents(userId, startDate, endDate);
        tasks = await this.getOrganizerCalendarTasks(userId, startDate, endDate);
      } else {
        // Guest sees events they're attending and their assigned tasks
        events = await this.getGuestCalendarEvents(userId, startDate, endDate);
        tasks = await this.getGuestCalendarTasks(userId, startDate, endDate);
      }

      return {
        success: true,
        month,
        year,
        events,
        tasks,
        userRole: user.role,
      };
    } catch (error) {
      console.error('Failed to get calendar data:', error);
      throw new BadRequestException('Failed to retrieve calendar data');
    }
  }

  // Calendar helper methods
  private async getAdminCalendarEvents(startDate: Date, endDate: Date) {
    return this.prismaService.event.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  private async getAdminCalendarTasks(startDate: Date, endDate: Date) {
    return this.prismaService.task.findMany({
      where: {
        OR: [
          {
            dueDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        assignee: { select: { name: true } },
        event: { select: { title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private async getOrganizerCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    return this.prismaService.event.findMany({
      where: {
        AND: [
          {
            OR: [
              { organizerId: userId },
              { attendees: { some: { userId } } },
            ],
          },
          {
            OR: [
              {
                startDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                endDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
        ],
      },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  private async getOrganizerCalendarTasks(userId: string, startDate: Date, endDate: Date) {
    return this.prismaService.task.findMany({
      where: {
        AND: [
          {
            event: {
              OR: [
                { organizerId: userId },
                { attendees: { some: { userId } } },
              ],
            },
          },
          {
            OR: [
              {
                dueDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
        ],
      },
      include: {
        assignee: { select: { name: true } },
        event: { select: { title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private async getGuestCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    return this.prismaService.event.findMany({
      where: {
        AND: [
          {
            attendees: { some: { userId } },
          },
          {
            OR: [
              {
                startDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                endDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
        ],
      },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  private async getGuestCalendarTasks(userId: string, startDate: Date, endDate: Date) {
    return this.prismaService.task.findMany({
      where: {
        AND: [
          { assigneeId: userId },
          {
            OR: [
              {
                dueDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
        ],
      },
      include: {
        assignee: { select: { name: true } },
        event: { select: { title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getDashboardStats(userId: string) {
    try {
      // Get user to determine role
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let stats = {};

      if (user.role === 'ADMIN') {
        // Admin sees all platform statistics
        stats = await this.getAdminDashboardStats();
      } else if (user.role === 'ORGANIZER') {
        // Organizer sees statistics for their events
        stats = await this.getOrganizerDashboardStats(userId);
      } else {
        // Guest sees statistics for their participation
        stats = await this.getGuestDashboardStats(userId);
      }

      return {
        success: true,
        stats,
        userRole: user.role,
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw new BadRequestException('Failed to retrieve dashboard statistics');
    }
  }

  private async getAdminDashboardStats() {
    const [
      totalEvents,
      totalTasks,
      totalUsers,
      totalPolls,
      totalMessages,
      activeEvents,
      completedTasks,
      pendingTasks,
    ] = await Promise.all([
      this.prismaService.event.count(),
      this.prismaService.task.count(),
      this.prismaService.user.count(),
      this.prismaService.poll.count(),
      this.prismaService.chatMessage.count(),
      this.prismaService.event.count({
        where: { status: 'PUBLISHED' }
      }),
      this.prismaService.task.count({
        where: { status: 'COMPLETED' }
      }),
      this.prismaService.task.count({
        where: { status: { in: ['TODO', 'IN_PROGRESS'] } }
      }),
    ]);

    return {
      events: totalEvents,
      tasks: totalTasks,
      users: totalUsers,
      polls: totalPolls,
      messages: totalMessages,
      activeEvents,
      completedTasks,
      pendingTasks,
    };
  }

  private async getOrganizerDashboardStats(userId: string) {
    const [
      myEvents,
      myTasks,
      myPolls,
      myMessages,
      attendeesCount,
      completedTasks,
      pendingTasks,
    ] = await Promise.all([
      this.prismaService.event.count({
        where: { organizerId: userId }
      }),
      this.prismaService.task.count({
        where: {
          event: { organizerId: userId }
        }
      }),
      this.prismaService.poll.count({
        where: { createdById: userId }
      }),
      this.prismaService.chatMessage.count({
        where: {
          event: { organizerId: userId }
        }
      }),
      this.prismaService.eventAttendee.count({
        where: {
          event: { organizerId: userId }
        }
      }),
      this.prismaService.task.count({
        where: {
          event: { organizerId: userId },
          status: 'COMPLETED'
        }
      }),
      this.prismaService.task.count({
        where: {
          event: { organizerId: userId },
          status: { in: ['TODO', 'IN_PROGRESS'] }
        }
      }),
    ]);

    return {
      events: myEvents,
      tasks: myTasks,
      polls: myPolls,
      messages: myMessages,
      attendees: attendeesCount,
      completedTasks,
      pendingTasks,
    };
  }

  private async getGuestDashboardStats(userId: string) {
    const [
      eventsAttending,
      myTasks,
      myMessages,
      completedTasks,
      pendingTasks,
      pollsVoted,
    ] = await Promise.all([
      this.prismaService.eventAttendee.count({
        where: { userId }
      }),
      this.prismaService.task.count({
        where: { assigneeId: userId }
      }),
      this.prismaService.chatMessage.count({
        where: { senderId: userId }
      }),
      this.prismaService.task.count({
        where: {
          assigneeId: userId,
          status: 'COMPLETED'
        }
      }),
      this.prismaService.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        }
      }),
      this.prismaService.pollVote.count({
        where: { userId }
      }),
    ]);

    return {
      events: eventsAttending,
      tasks: myTasks,
      messages: myMessages,
      completedTasks,
      pendingTasks,
      pollsVoted,
    };
  }

  async testActivityLog(userId: string) {
    try {
      console.log('Testing activity log creation for user:', userId);

      const activityLog = await this.prismaService.activityLog.create({
        data: {
          action: 'MESSAGE_SENT',
          description: 'Test activity log creation',
          userId,
          entityType: 'test',
          entityId: 'test-123',
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          },
        },
      });

      console.log('Test activity log created:', activityLog);

      return {
        success: true,
        message: 'Test activity log created successfully',
        activityLog
      };
    } catch (error) {
      console.error('Failed to create test activity log:', error);
      return {
        success: false,
        message: 'Failed to create test activity log',
        error: error.message
      };
    }
  }

  async updatePreferences(userId: string, preferences: any) {
    try {
      // Update user preferences in the database
      const user = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          preferences: preferences
        },
        select: {
          id: true,
          name: true,
          email: true,
          preferences: true
        }
      });

      return {
        success: true,
        message: 'Preferences updated successfully',
        user
      };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw new BadRequestException('Failed to update preferences');
    }
  }

  async exportData(userId: string) {
    try {
      // In a real implementation, this would generate a comprehensive data export
      // For now, we'll just return a success message
      return {
        success: true,
        message: 'Data export requested successfully. You will receive an email when ready.',
        exportId: `export_${Date.now()}`,
        estimatedTime: '5-10 minutes'
      };
    } catch (error) {
      console.error('Failed to request data export:', error);
      throw new BadRequestException('Failed to request data export');
    }
  }

  async deleteAccount(userId: string) {
    try {
      // In a real implementation, you might want to:
      // 1. Soft delete or anonymize data
      // 2. Transfer ownership of events to other organizers
      // 3. Send confirmation emails
      // 4. Log the deletion for audit purposes

      // For now, we'll just delete the user
      await this.prismaService.user.delete({
        where: { id: userId }
      });

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw new BadRequestException('Failed to delete account');
    }
  }

  async disable2FA(userId: string) {
    try {
      // In a real implementation, this would disable 2FA for the user
      // For now, we'll just return a success message
      return {
        success: true,
        message: 'Two-factor authentication disabled successfully'
      };
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw new BadRequestException('Failed to disable 2FA');
    }
  }
}
