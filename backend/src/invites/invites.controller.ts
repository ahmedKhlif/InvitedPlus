import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Get event by invite code' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  getEventByInviteCode(@Param('code') code: string) {
    return this.invitesService.getEventByInviteCode(code);
  }

  @Post(':code/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RSVP to event using invite code' })
  @ApiResponse({ status: 200, description: 'RSVP submitted successfully' })
  rsvpToEvent(
    @Param('code') code: string,
    @Body() rsvpDto: { status: 'ACCEPTED' | 'DECLINED' },
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.invitesService.rsvpToEvent(code, rsvpDto.status, userId);
  }

  @Get(':code/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get RSVP status for invite' })
  @ApiResponse({ status: 200, description: 'RSVP status retrieved successfully' })
  getRsvpStatus(@Param('code') code: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.invitesService.getRsvpStatus(code, userId);
  }
}
