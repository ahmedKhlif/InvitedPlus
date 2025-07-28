import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationType, NotificationPriority } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Notification title', example: 'New task assigned' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message', example: 'You have been assigned a new task: Setup event venue' })
  @IsString()
  message: string;

  @ApiProperty({ 
    description: 'Notification type', 
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED 
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ 
    description: 'Notification priority', 
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL 
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'User ID to send notification to' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Array of user IDs to send notification to' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: 'Related event ID' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Related task ID' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ description: 'User who triggered the notification' })
  @IsOptional()
  @IsString()
  fromUserId?: string;

  @ApiPropertyOptional({ description: 'Action URL to navigate when clicked' })
  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Mark notification as read' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class GetNotificationsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by notification type',
    enum: NotificationType
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
