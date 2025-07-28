# Development Workflow Documentation

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd InvitedPlus
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Configuration**

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/invitedplus"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Application
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

4. **Database Setup**
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Project Structure Overview

### Key Files and Their Purposes

#### Backend Key Files
- `src/main.ts` - Application entry point and configuration
- `src/app.module.ts` - Root module with all imports
- `prisma/schema.prisma` - Database schema definition
- `prisma/migrations/` - Database migration files
- `src/common/prisma/prisma.service.ts` - Database service
- `src/websocket/websocket.gateway.ts` - WebSocket handling

#### Frontend Key Files
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Home page
- `contexts/auth-context.tsx` - Authentication state management
- `lib/api.ts` - API client configuration
- `components/ui/` - Reusable UI components

## Development Tasks

### Adding a New Feature

1. **Backend Development**
```bash
# Generate new module
nest g module feature-name
nest g controller feature-name
nest g service feature-name

# Create DTOs
mkdir src/feature-name/dto
touch src/feature-name/dto/create-feature.dto.ts
touch src/feature-name/dto/update-feature.dto.ts
```

2. **Database Changes**
```bash
# Modify prisma/schema.prisma
# Then generate migration
npx prisma migrate dev --name add-feature-table

# Update Prisma client
npx prisma generate
```

3. **Frontend Development**
```bash
# Create feature components
mkdir components/features/feature-name
touch components/features/feature-name/feature-list.tsx
touch components/features/feature-name/feature-form.tsx

# Create pages
mkdir app/feature-name
touch app/feature-name/page.tsx
touch app/feature-name/layout.tsx
```

### Database Operations

#### Creating Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration-name

# Reset database (development only)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy
```

#### Seeding Data
```bash
# Run seed script
npx prisma db seed

# Custom seed for specific data
node scripts/seed-specific-data.js
```

#### Database Inspection
```bash
# Open Prisma Studio
npx prisma studio

# View database schema
npx prisma db pull
```

### API Development

#### Creating New Endpoints
```typescript
// 1. Define DTO
export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// 2. Add to controller
@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() createDto: CreateFeatureDto, @Request() req) {
  return this.featureService.create(createDto, req.user.sub);
}

// 3. Implement in service
async create(createDto: CreateFeatureDto, userId: string) {
  return this.prisma.feature.create({
    data: { ...createDto, userId }
  });
}
```

#### Testing Endpoints
```bash
# Using curl
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"key": "value"}'

# Using Swagger UI
# Visit http://localhost:3001/api/docs
```

### Frontend Development

#### Creating New Pages
```typescript
// app/feature/page.tsx
export default function FeaturePage() {
  const { data, isLoading } = useFeatures();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Feature Page</h1>
      <FeatureList features={data} />
    </div>
  );
}
```

#### Adding New Components
```typescript
// components/ui/new-component.tsx
interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

#### State Management
```typescript
// For global state, add to context
// contexts/feature-context.tsx
export function FeatureProvider({ children }) {
  const [features, setFeatures] = useState([]);
  
  return (
    <FeatureContext.Provider value={{ features, setFeatures }}>
      {children}
    </FeatureContext.Provider>
  );
}

// For local state, use hooks
// hooks/use-features.ts
export function useFeatures() {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  return { features, isLoading, refetch: fetchFeatures };
}
```

## Testing

### Backend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Frontend Testing
```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Manual Testing Checklist
- [ ] Authentication flow (login/logout/register)
- [ ] Event creation and management
- [ ] Task assignment and status updates
- [ ] Real-time chat functionality
- [ ] Whiteboard collaboration
- [ ] File upload/download
- [ ] Responsive design on mobile
- [ ] Error handling and validation

## Debugging

### Backend Debugging
```bash
# Enable debug logs
DEBUG=* npm run start:dev

# Database query logging
# Add to prisma service:
# log: ['query', 'info', 'warn', 'error']
```

### Frontend Debugging
```bash
# React Developer Tools
# Install browser extension

# Network debugging
# Use browser dev tools Network tab

# State debugging
console.log('State:', state);
```

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
npx prisma migrate reset

# Check connection string
echo $DATABASE_URL
```

#### WebSocket Connection Issues
```bash
# Check if port is available
netstat -tulpn | grep :3001

# Kill process on port
sudo kill -9 $(lsof -t -i:3001)
```

#### Build Issues
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

## Code Quality

### Linting and Formatting
```bash
# Backend
npm run lint
npm run format

# Frontend
npm run lint
npm run lint:fix
```

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Documentation updated

## Deployment

### Development Deployment
```bash
# Build applications
cd backend && npm run build
cd frontend && npm run build

# Start production servers
cd backend && npm run start:prod
cd frontend && npm start
```

### Environment-Specific Configurations
```bash
# Development
NODE_ENV=development

# Staging
NODE_ENV=staging

# Production
NODE_ENV=production
```

### Database Migrations in Production
```bash
# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## Monitoring and Logging

### Application Logs
```bash
# View backend logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log
```

### Performance Monitoring
```bash
# Database query performance
# Enable slow query logging in PostgreSQL

# Application performance
# Use built-in NestJS logger
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/health/database
```
