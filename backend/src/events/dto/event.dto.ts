import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength, MaxLength, IsArray, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { EventStatus } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title', example: 'Annual Tech Conference 2024' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Event description', example: 'Join us for the biggest tech conference of the year' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: 'Event start date', example: '2024-12-31T10:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date', example: '2024-12-31T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Event location', example: 'Convention Center, Downtown' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ description: 'Maximum number of attendees', example: 100 })
  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @ApiPropertyOptional({ description: 'Event category', example: 'conference' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Event tags (comma-separated)', example: 'tech,conference,networking' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiPropertyOptional({ description: 'Single event image URL (legacy)', example: '/uploads/events/event-123.webp' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Array of image URLs', 
    type: [String],
    example: ['/uploads/events/event-123.webp', '/uploads/events/event-456.webp']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Venue details as JSON', example: { address: '123 Main St', coordinates: { lat: 40.7128, lng: -74.0060 } } })
  @IsOptional()
  venue?: any;

  @ApiPropertyOptional({ description: 'Whether event is public', example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event title', example: 'Annual Tech Conference 2024' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Event description', example: 'Join us for the biggest tech conference of the year' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Event start date', example: '2024-12-31T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Event end date', example: '2024-12-31T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Event location', example: 'Convention Center, Downtown' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ description: 'Maximum number of attendees', example: 100 })
  @IsOptional()
  @IsNumber()
  maxAttendees?: number;

  @ApiPropertyOptional({ description: 'Event category', example: 'conference' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Event tags (comma-separated)', example: 'tech,conference,networking' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiPropertyOptional({ description: 'Single event image URL (legacy)', example: '/uploads/events/event-123.webp' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Array of image URLs', 
    type: [String],
    example: ['/uploads/events/event-123.webp', '/uploads/events/event-456.webp']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Venue details as JSON', example: { address: '123 Main St', coordinates: { lat: 40.7128, lng: -74.0060 } } })
  @IsOptional()
  venue?: any;

  @ApiPropertyOptional({ description: 'Whether event is public', example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class EventQueryDto {
  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter events starting from this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter events ending before this date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['title', 'startDate', 'endDate', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;
}
