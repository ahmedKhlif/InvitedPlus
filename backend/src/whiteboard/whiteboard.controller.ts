import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhiteboardService } from './whiteboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('whiteboard')
@Controller('whiteboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhiteboardController {
  constructor(private readonly whiteboardService: WhiteboardService) {}

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get event whiteboard' })
  @ApiResponse({ status: 200, description: 'Whiteboard retrieved successfully' })
  async getEventWhiteboard(
    @Param('eventId') eventId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.getEventWhiteboard(eventId, userId);
  }

  @Get('event/:eventId/all')
  @ApiOperation({ summary: 'Get all whiteboards for an event' })
  @ApiResponse({ status: 200, description: 'Whiteboards retrieved successfully' })
  async getAllEventWhiteboards(
    @Param('eventId') eventId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.getAllEventWhiteboards(eventId, userId);
  }

  @Post('event/:eventId')
  @ApiOperation({ summary: 'Create new whiteboard for event' })
  @ApiResponse({ status: 201, description: 'Whiteboard created successfully' })
  async createWhiteboard(
    @Param('eventId') eventId: string,
    @Body() whiteboardData: { name: string; data?: any },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.createWhiteboard(eventId, userId, whiteboardData);
  }

  @Put(':whiteboardId')
  @ApiOperation({ summary: 'Update whiteboard' })
  @ApiResponse({ status: 200, description: 'Whiteboard updated successfully' })
  async updateWhiteboard(
    @Param('whiteboardId') whiteboardId: string,
    @Body() updateData: { data: any },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.updateWhiteboard(whiteboardId, userId, updateData);
  }

  @Delete(':whiteboardId')
  @ApiOperation({ summary: 'Delete whiteboard' })
  @ApiResponse({ status: 200, description: 'Whiteboard deleted successfully' })
  async deleteWhiteboard(
    @Param('whiteboardId') whiteboardId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.deleteWhiteboard(whiteboardId, userId);
  }

  @Post('event/:eventId/element')
  @ApiOperation({ summary: 'Add element to whiteboard' })
  @ApiResponse({ status: 201, description: 'Element added successfully' })
  async addElement(
    @Param('eventId') eventId: string,
    @Body() elementData: {
      type: string;
      data: any;
    },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.addElement(eventId, userId, elementData);
  }

  @Put('element/:elementId')
  @ApiOperation({ summary: 'Update whiteboard element' })
  @ApiResponse({ status: 200, description: 'Element updated successfully' })
  async updateElement(
    @Param('elementId') elementId: string,
    @Body() elementData: {
      data: any;
    },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.updateElement(elementId, userId, elementData);
  }

  @Delete('element/:elementId')
  @ApiOperation({ summary: 'Delete whiteboard element' })
  @ApiResponse({ status: 200, description: 'Element deleted successfully' })
  async deleteElement(
    @Param('elementId') elementId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.deleteElement(elementId, userId);
  }

  @Delete('event/:eventId/clear')
  @ApiOperation({ summary: 'Clear whiteboard (organizer only)' })
  @ApiResponse({ status: 200, description: 'Whiteboard cleared successfully' })
  async clearWhiteboard(
    @Param('eventId') eventId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.clearWhiteboard(eventId, userId);
  }

  @Post('event/:eventId/snapshot')
  @ApiOperation({ summary: 'Save whiteboard snapshot' })
  @ApiResponse({ status: 200, description: 'Snapshot saved successfully' })
  async saveSnapshot(
    @Param('eventId') eventId: string,
    @Body() snapshotData: any,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.saveWhiteboardSnapshot(eventId, userId, snapshotData);
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload image for whiteboard' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async uploadImage(
    @UploadedFile() file: any,
    @Body() body: { eventId: string },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.whiteboardService.uploadImage(file, body.eventId, userId);
  }
}
