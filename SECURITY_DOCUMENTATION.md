# Security Implementation Documentation

## Overview
InvitedPlus implements multiple layers of security to protect user data, prevent unauthorized access, and ensure secure communication between frontend and backend.

## Authentication Security

### JWT Token Implementation

#### Token Structure
```typescript
// Access Token (15 minutes lifespan)
{
  "sub": "user_id",
  "email": "user@example.com", 
  "role": "USER",
  "iat": 1640995200,
  "exp": 1640996100
}

// Refresh Token (7 days lifespan)
{
  "sub": "user_id",
  "tokenVersion": 1,
  "iat": 1640995200,
  "exp": 1641600000
}
```

#### Token Security Measures
```typescript
// backend/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  private readonly jwtService: JwtService;
  
  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m' // Short-lived access token
      }),
      this.jwtService.signAsync(
        { sub: user.id, tokenVersion: user.tokenVersion },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d' // Longer-lived refresh token
        }
      )
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET
      });

      const user = await this.usersService.findById(payload.sub);
      
      // Validate token version (for token invalidation)
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

### Password Security

#### Password Hashing
```typescript
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

#### Password Validation
```typescript
// Password requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

## Authorization & Access Control

### Role-Based Access Control (RBAC)
```typescript
// Role hierarchy
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN', 
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Permission decorator
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Usage in controllers
@Get('admin-only')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async adminOnlyEndpoint() {
  return { message: 'Admin access granted' };
}
```

### Resource-Based Authorization
```typescript
// Event ownership guard
@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private eventsService: EventsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const eventId = request.params.id;
    const userId = request.user.sub;
    const userRole = request.user.role;

    // Super admins can access everything
    if (userRole === Role.SUPER_ADMIN) {
      return true;
    }

    // Check if user owns the event
    const event = await this.eventsService.findOne(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event.organizerId === userId;
  }
}
```

### Task Permission System
```typescript
@Injectable()
export class TaskPermissionService {
  canUpdateTaskStatus(task: Task, user: User, newStatus: TaskStatus): boolean {
    // Assignee can only move tasks forward
    if (task.assigneeId === user.id) {
      return this.isForwardTransition(task.status, newStatus);
    }

    // Creator and organizer can do anything
    return task.creatorId === user.id || task.event.organizerId === user.id;
  }

  canDeleteTask(task: Task, user: User): boolean {
    return task.creatorId === user.id || 
           task.event.organizerId === user.id ||
           user.role === Role.ADMIN;
  }

  private isForwardTransition(current: TaskStatus, next: TaskStatus): boolean {
    const transitions = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED],
      [TaskStatus.COMPLETED]: []
    };

    return transitions[current]?.includes(next) || false;
  }
}
```

## Input Validation & Sanitization

### DTO Validation
```typescript
// Comprehensive validation example
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9\s\-_.,!?]+$/, {
    message: 'Title contains invalid characters'
  })
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsDateString()
  @ValidateIf(o => o.endDate && new Date(o.endDate) > new Date(o.startDate))
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxAttendees?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
```

### SQL Injection Prevention
```typescript
// Using Prisma ORM prevents SQL injection
// All queries are parameterized automatically

// Safe query example
async findEventsByTitle(title: string) {
  return this.prisma.event.findMany({
    where: {
      title: {
        contains: title, // Automatically sanitized
        mode: 'insensitive'
      }
    }
  });
}

// Raw queries (when necessary) - use parameterized queries
async customQuery(userId: string) {
  return this.prisma.$queryRaw`
    SELECT * FROM "Event" 
    WHERE "organizerId" = ${userId}
  `;
}
```

### XSS Prevention
```typescript
// Input sanitization
import { Transform } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => DOMPurify.sanitize(value))
  content: string;
}

// Frontend XSS prevention
function SafeHTML({ content }: { content: string }) {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

## File Upload Security

### File Validation
```typescript
// File upload configuration
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new BadRequestException('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
}))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Additional security checks
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  // Virus scanning (in production)
  await this.virusScanService.scanFile(file.path);

  // Generate secure filename
  const secureFilename = this.generateSecureFilename(file.originalname);
  
  return { filename: secureFilename, size: file.size };
}

private generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}${ext}`;
}
```

### File Storage Security
```typescript
// Secure file serving
@Get('files/:filename')
@UseGuards(JwtAuthGuard)
async serveFile(
  @Param('filename') filename: string,
  @Request() req,
  @Res() res: Response
) {
  // Validate filename to prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    throw new BadRequestException('Invalid filename');
  }

  // Check user permissions
  const hasAccess = await this.checkFileAccess(filename, req.user.sub);
  if (!hasAccess) {
    throw new ForbiddenException('Access denied');
  }

  const filePath = path.join(process.env.UPLOAD_PATH, filename);
  
  // Verify file exists and is within upload directory
  if (!fs.existsSync(filePath) || !filePath.startsWith(process.env.UPLOAD_PATH)) {
    throw new NotFoundException('File not found');
  }

  return res.sendFile(filePath);
}
```

## WebSocket Security

### WebSocket Authentication
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class WebSocketGateway implements OnGatewayConnection {
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract and verify JWT token
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userEmail = payload.email;
      client.userRole = payload.role;

      // Rate limiting
      if (!this.rateLimitCheck(client.userId)) {
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.userId, client);
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  private rateLimitCheck(userId: string): boolean {
    const now = Date.now();
    const userAttempts = this.connectionAttempts.get(userId);
    
    if (userAttempts) {
      if (now - userAttempts.lastAttempt < 60000 && userAttempts.count > 5) {
        return false; // Rate limited
      }
      userAttempts.count = now - userAttempts.lastAttempt > 60000 ? 1 : userAttempts.count + 1;
      userAttempts.lastAttempt = now;
    } else {
      this.connectionAttempts.set(userId, { count: 1, lastAttempt: now });
    }
    
    return true;
  }
}
```

### Message Validation
```typescript
@SubscribeMessage('chat:message')
handleChatMessage(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: any
) {
  // Validate message structure
  const validationResult = chatMessageSchema.safeParse(data);
  if (!validationResult.success) {
    client.emit('error', { message: 'Invalid message format' });
    return;
  }

  const { eventId, message } = validationResult.data;

  // Check user permissions for the event
  if (!this.canUserAccessEvent(client.userId, eventId)) {
    client.emit('error', { message: 'Access denied' });
    return;
  }

  // Sanitize message content
  const sanitizedMessage = DOMPurify.sanitize(message);
  
  // Rate limiting for messages
  if (!this.messageRateLimit(client.userId)) {
    client.emit('error', { message: 'Rate limit exceeded' });
    return;
  }

  // Broadcast message
  this.server.to(`chat:${eventId}`).emit('chat:new_message', {
    id: uuidv4(),
    message: sanitizedMessage,
    userId: client.userId,
    timestamp: new Date().toISOString()
  });
}
```

## CORS & Security Headers

### CORS Configuration
```typescript
// main.ts
app.enableCors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Security Headers
```typescript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Environment Security

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=<complex-random-string-256-bits>
JWT_REFRESH_SECRET=<different-complex-random-string>
DATABASE_URL=<secure-database-connection>
REDIS_URL=<secure-redis-connection>

# Security settings
BCRYPT_ROUNDS=12
SESSION_SECRET=<session-secret>
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
```

### Secrets Management
```typescript
// Use environment variables for all secrets
const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  database: {
    url: process.env.DATABASE_URL
  },
  email: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET', 
  'DATABASE_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## Security Monitoring

### Logging Security Events
```typescript
@Injectable()
export class SecurityLogger {
  private readonly logger = new Logger(SecurityLogger.name);

  logFailedLogin(email: string, ip: string) {
    this.logger.warn(`Failed login attempt for ${email} from ${ip}`);
  }

  logSuspiciousActivity(userId: string, activity: string, details: any) {
    this.logger.error(`Suspicious activity by user ${userId}: ${activity}`, details);
  }

  logFileUpload(userId: string, filename: string, size: number) {
    this.logger.log(`File uploaded by ${userId}: ${filename} (${size} bytes)`);
  }
}
```

### Rate Limiting
```typescript
// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
}));

// Specific endpoint rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```
