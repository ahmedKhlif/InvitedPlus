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
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('polls')
@ApiBearerAuth()
@Controller('polls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @Roles('ADMIN', 'ORGANIZER')
  @ApiOperation({ summary: 'Create a new poll (Admin/Organizer only)' })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createPollDto: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.create(createPollDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all polls for the user' })
  @ApiResponse({ status: 200, description: 'Polls retrieved successfully' })
  findAll(@Request() req: any, @Query() query: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiResponse({ status: 200, description: 'Poll retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update poll' })
  @ApiResponse({ status: 200, description: 'Poll updated successfully' })
  update(@Param('id') id: string, @Body() updatePollDto: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.update(id, updatePollDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete poll' })
  @ApiResponse({ status: 200, description: 'Poll deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.remove(id, userId);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  @ApiResponse({ status: 200, description: 'Vote submitted successfully' })
  vote(@Param('id') id: string, @Body() voteDto: { optionId: string }, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.vote(id, voteDto.optionId, userId);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get poll results' })
  @ApiResponse({ status: 200, description: 'Poll results retrieved successfully' })
  getResults(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.pollsService.getResults(id, userId);
  }
}
