# Backend Architecture Documentation

## Overview
The backend is built with NestJS, a progressive Node.js framework that uses TypeScript and follows enterprise-grade architectural patterns including dependency injection, decorators, and modular design.

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts  # Auth endpoints
│   │   ├── auth.service.ts     # Auth business logic
│   │   ├── auth.module.ts      # Auth module definition
│   │   ├── guards/             # Auth guards
│   │   ├── strategies/         # Passport strategies
│   │   └── dto/                # Data transfer objects
│   ├── users/                  # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   ├── events/                 # Event management
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.module.ts
│   │   └── dto/
│   ├── tasks/                  # Task management
│   ├── chat/                   # Chat system
│   ├── whiteboard/             # Whiteboard collaboration
│   ├── notifications/          # Notification system
│   ├── websocket/              # WebSocket gateway
│   │   ├── websocket.gateway.ts
│   │   └── websocket.module.ts
│   ├── common/                 # Shared utilities
│   │   ├── prisma/             # Prisma service
│   │   ├── guards/             # Common guards
│   │   ├── decorators/         # Custom decorators
│   │   ├── filters/            # Exception filters
│   │   ├── interceptors/       # Response interceptors
│   │   └── pipes/              # Validation pipes
│   └── config/                 # Configuration
├── prisma/                     # Database schema
│   ├── schema.prisma           # Prisma schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding
├── uploads/                    # File storage
├── scripts/                    # Utility scripts
└── test/                       # Test files
```

## Core Architecture Patterns

### 1. Module-Based Architecture
```typescript
// app.module.ts - Root module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    TasksModule,
    ChatModule,
    WhiteboardModule,
    NotificationsModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// Feature module example
@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // Export for use in other modules
})
export class EventsModule {}
```

### 2. Controller Layer
```typescript
// events.controller.ts
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiTags('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async findAll(
    @Query() query: GetEventsQueryDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.eventsService.findAll(query, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any
  ) {
    const organizerId = req.user.sub;
    return this.eventsService.create(createEventDto, organizerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.eventsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  @UseGuards(EventOwnerGuard) // Custom guard for ownership
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.eventsService.update(id, updateEventDto, userId);
  }

  @Delete(':id')
  @UseGuards(EventOwnerGuard)
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.eventsService.remove(id, userId);
  }
}
```

### 3. Service Layer (Business Logic)
```typescript
// events.service.ts
@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async findAll(query: GetEventsQueryDto, userId: string) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      OR: [
        { organizerId: userId },
        { attendees: { some: { userId } } },
        { isPublic: true }
      ],
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          organizer: {
            select: { id: true, name: true, avatar: true }
          },
          _count: {
            select: { attendees: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.event.count({ where })
    ]);

    return {
      success: true,
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(createEventDto: CreateEventDto, organizerId: string) {
    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        organizerId,
        status: EventStatus.DRAFT
      },
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Create default whiteboard
    await this.createDefaultWhiteboard(event.id);

    // Create default tasks
    await this.createDefaultTasks(event.id, organizerId);

    return {
      success: true,
      message: 'Event created successfully',
      event
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string) {
    // Verify ownership
    await this.verifyEventOwnership(id, userId);

    const event = await this.prisma.event.update({
      where: { id },
      data: updateEventDto,
      include: {
        organizer: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Notify attendees of changes
    await this.notificationsService.notifyEventUpdated(event);

    return {
      success: true,
      message: 'Event updated successfully',
      event
    };
  }

  private async verifyEventOwnership(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== userId) {
      throw new ForbiddenException('You can only modify your own events');
    }

    return event;
  }

  private async createDefaultWhiteboard(eventId: string) {
    return this.prisma.whiteboard.create({
      data: {
        name: 'Main Whiteboard',
        eventId,
        data: { elements: [] }
      }
    });
  }

  private async createDefaultTasks(eventId: string, organizerId: string) {
    const defaultTasks = [
      {
        title: 'Prepare event materials',
        description: 'Gather all necessary materials for the event',
        priority: Priority.MEDIUM
      },
      {
        title: 'Send invitations',
        description: 'Send invitations to all attendees',
        priority: Priority.HIGH
      }
    ];

    return this.prisma.task.createMany({
      data: defaultTasks.map(task => ({
        ...task,
        eventId,
        creatorId: organizerId
      }))
    });
  }
}
```

### 4. Data Transfer Objects (DTOs)
```typescript
// dto/create-event.dto.ts
export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Event location', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ description: 'Event start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Maximum number of attendees', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxAttendees?: number;

  @ApiProperty({ description: 'Whether event is public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// dto/get-events-query.dto.ts
export class GetEventsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
```

### 5. Guards and Security
```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// guards/event-owner.guard.ts
@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private eventsService: EventsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const eventId = request.params.id;
    const userId = request.user.sub;

    try {
      await this.eventsService.verifyEventOwnership(eventId, userId);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 6. Exception Handling
```typescript
// filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception.stack
      })
    };

    response.status(status).json(errorResponse);
  }
}

// filters/prisma-exception.filter.ts
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation';
        break;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 7. Interceptors
```typescript
// interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // If data already has success property, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap response in standard format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}

// interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();

    this.logger.log(
      `${method} ${url} - User: ${user?.email || 'Anonymous'} - Body: ${JSON.stringify(body)}`
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      })
    );
  }
}
```
