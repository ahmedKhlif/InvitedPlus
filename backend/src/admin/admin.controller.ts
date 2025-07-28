import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
    });
  }

  @Get('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto, @GetUser() admin: any) {
    return this.adminService.createUser(createUserDto, admin.id);
  }

  @Patch('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateUser(id, updateUserDto, admin.id);
  }

  @Patch('users/:id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @GetUser() admin: any,
  ) {
    return this.adminService.updateUserRole(id, updateRoleDto.role, admin.id);
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string, @GetUser() admin: any) {
    return this.adminService.deleteUser(id, admin.id);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('analytics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get platform analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(@Query('range') range?: string) {
    return this.adminService.getAnalytics(range);
  }

  @Get('activity-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get activity logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivityLogs(
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getActivityLogs({
      action,
      userId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('events')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all events (Admin only)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getAllEvents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllEvents({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  @Delete('events/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  async deleteEvent(@Param('id') id: string, @GetUser() admin: any) {
    return this.adminService.deleteEvent(id, admin.id);
  }

  @Get('tasks')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all tasks (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getAllTasks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.getAllTasks({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post('test-activity-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create test activity logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test activity logs created successfully' })
  async createTestActivityLogs(@GetUser() admin: any) {
    return this.adminService.createTestActivityLogs(admin.id);
  }

  @Post('reports/generate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Generate report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(
    @Body() generateReportDto: { type: string; startDate?: string; endDate?: string },
    @GetUser() admin: any
  ) {
    return this.adminService.generateReport(generateReportDto, admin.id);
  }

  @Get('reports')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports() {
    return this.adminService.getReports();
  }

  @Get('reports/:id/download')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Download report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report downloaded successfully' })
  async downloadReport(@Param('id') id: string, @GetUser() admin: any, @Res() res: any) {
    const result = await this.adminService.downloadReport(id, admin.id);

    if (result.success) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.status(400).json(result);
    }
  }

}
