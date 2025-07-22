import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles('ADMIN', 'ORGANIZER')
  @ApiOperation({ summary: 'Create a new event (Admin/Organizer only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createEventDto: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.create(createEventDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events for the user' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(@Request() req: any, @Query() query: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.findOne(id, userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ORGANIZER')
  @ApiOperation({ summary: 'Update event (Admin/Organizer only)' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateEventDto: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.update(id, updateEventDto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ORGANIZER')
  @ApiOperation({ summary: 'Delete event (Admin/Organizer only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.remove(id, userId);
  }

  @Get(':id/attendees')
  @ApiOperation({ summary: 'Get event attendees' })
  @ApiResponse({ status: 200, description: 'Attendees retrieved successfully' })
  getAttendees(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.getAttendees(id, userId);
  }

  @Get(':id/eligible-assignees')
  @ApiOperation({ summary: 'Get eligible assignees for event tasks (organizer + attendees)' })
  @ApiResponse({ status: 200, description: 'Eligible assignees retrieved successfully' })
  getEligibleAssignees(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.getEligibleAssignees(id, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join event' })
  @ApiResponse({ status: 200, description: 'Joined event successfully' })
  joinEvent(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.joinEvent(id, userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave event' })
  @ApiResponse({ status: 200, description: 'Left event successfully' })
  leaveEvent(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.leaveEvent(id, userId);
  }

  @Get(':id/export-guests')
  @ApiOperation({ summary: 'Export guest list' })
  @ApiResponse({ status: 200, description: 'Guest list exported successfully' })
  exportGuestList(
    @Param('id') id: string,
    @Request() req: any,
    @Query('format') format: 'csv' | 'json' = 'csv'
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.exportGuestList(id, userId, format);
  }

  @Get(':id/invites')
  @ApiOperation({ summary: 'Get event invites' })
  @ApiResponse({ status: 200, description: 'Event invites retrieved successfully' })
  getEventInvites(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.getEventInvites(id, userId);
  }

  @Post(':id/invites')
  @ApiOperation({ summary: 'Send event invite via email' })
  @ApiResponse({ status: 201, description: 'Invite sent successfully' })
  sendEventInvite(
    @Param('id') id: string,
    @Body() inviteDto: { email: string },
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.eventsService.sendEventInvite(id, inviteDto.email, userId);
  }
}
