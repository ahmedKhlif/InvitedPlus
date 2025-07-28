import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUrl } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', example: 'Hello everyone!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ 
    description: 'Message type', 
    enum: MessageType, 
    example: MessageType.TEXT 
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ 
    description: 'Media URL for images, voice messages, files', 
    example: '/uploads/chat/image-123.webp' 
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Media MIME type', 
    example: 'image/webp' 
  })
  @IsOptional()
  @IsString()
  mediaType?: string;

  @ApiPropertyOptional({ 
    description: 'Duration in seconds for voice messages', 
    example: 15 
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ 
    description: 'Event ID for event-specific chat', 
    example: 'event-123' 
  })
  @IsOptional()
  @IsString()
  eventId?: string;
}
