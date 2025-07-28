import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get user catalog based on role permissions' })
  @ApiResponse({ status: 200, description: 'User catalog retrieved successfully' })
  async getUserCatalog(@Request() req: any, @Query() query: any) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    const userRole = req.user?.role;
    return this.usersService.getUserCatalog(userId, userRole, query);
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getUserProfile(@Request() req: any, @Param('userId') userId: string) {
    const currentUserId = req.user?.sub || req.user?.userId || req.user?.id;
    const currentUserRole = req.user?.role;
    return this.usersService.getUserProfile(currentUserId, userId, currentUserRole);
  }
}
