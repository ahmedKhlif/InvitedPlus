import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { SecureInvitesService } from './secure-invites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
    private readonly secureInvitesService: SecureInvitesService
  ) {}

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

  @Get('secure/:token/verify')
  @ApiOperation({ summary: 'Verify secure invitation token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifySecureToken(@Param('token') token: string) {
    return this.secureInvitesService.verifyInvitationToken(token);
  }

  @Get('secure/:token')
  @ApiOperation({ summary: 'Get event by secure invitation token' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  async getEventBySecureToken(@Param('token') token: string) {
    const verification = await this.secureInvitesService.verifyInvitationToken(token);
    return {
      success: true,
      event: verification.invitation.event,
      invitation: verification.invitation
    };
  }

  @Post('secure/:token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept secure invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  async acceptSecureInvitation(
    @Param('token') token: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.secureInvitesService.acceptInvitation(token, userId);
  }

  @Post('secure/:token/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decline secure invitation' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  async declineSecureInvitation(
    @Param('token') token: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.secureInvitesService.declineInvitation(token, userId);
  }

  @Get('event/:eventId/secure')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event secure invitations (organizer only)' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async getEventSecureInvitations(
    @Param('eventId') eventId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.secureInvitesService.getEventInvitations(eventId, userId);
  }

  @Delete('secure/:invitationId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke secure invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked successfully' })
  async revokeSecureInvitation(
    @Param('invitationId') invitationId: string,
    @Request() req: any
  ) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.secureInvitesService.revokeInvitation(invitationId, userId);
  }
}
