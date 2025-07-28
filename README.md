# 🎉 Invited+ - Smart Event Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)

**Invited+** is a comprehensive, modern event management platform that streamlines event planning, task management, and team collaboration. Built with cutting-edge technologies and designed for scalability, it offers everything from simple event creation to complex multi-user project management.

## 🌟 **Key Features**

### 🔐 **Authentication & User Management**
- **Email verification system** with 6-digit codes
- **Password reset** with secure token-based recovery
- **OAuth integration** (Google & GitHub)
- **Role-based access control** (Admin, Organizer, Guest)
- **Profile management** with avatar upload
- **Email verification status** tracking

### 🎪 **Event Management**
- **Create and manage events** with rich details
- **RSVP system** with attendance tracking
- **Event invitations** via email
- **Event categories** and filtering
- **Event analytics** and reporting
- **Recurring events** support
- **Event templates** for quick setup

### 📋 **Task Management System**
- **Kanban board** with drag-and-drop functionality
- **Task assignments** with role-based permissions
- **Task workflows** (TODO → IN_PROGRESS → COMPLETED)
- **Due dates** and priority levels
- **Task comments** and file attachments
- **Real-time statistics** with auto-refresh
- **Task templates** for common workflows

### 💬 **Real-Time Chat System**
- **Multi-channel messaging** per event
- **File attachments** (images, documents, videos)
- **Voice messages** with audio recording
- **Message reactions** and threading
- **Real-time typing indicators**
- **Message search** and filtering
- **Chat moderation** tools

### 🗳️ **Polling & Voting**
- **Create polls** with multiple choice options
- **Real-time voting** with live results
- **Anonymous voting** options
- **Poll scheduling** and expiration
- **Results visualization** with charts
- **Export poll data** to CSV

### 🔔 **Notification System**
- **Real-time notifications** for all activities
- **Email notifications** with beautiful templates
- **Role-based notifications** (user-specific)
- **Notification preferences** management
- **Push notifications** (PWA ready)
- **Notification history** and management

### ⚙️ **Settings & Preferences**
- **Profile customization** with personal information
- **Notification preferences** (email, push, categories)
- **Privacy settings** (visibility, communication)
- **Security settings** (password change, 2FA ready)
- **Account management** (data export, deletion)
- **Theme preferences** and customization

### 👑 **Admin Panel**
- **User management** with role assignments
- **Event oversight** and moderation
- **System analytics** and reporting
- **Platform statistics** and insights
- **Content moderation** tools
- **System configuration** management

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15.4.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **React Hook Form** - Form management
- **Framer Motion** - Smooth animations

### **Backend**
- **Next.js API Routes** - Serverless backend
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Robust relational database
- **JWT Authentication** - Secure token-based auth
- **Nodemailer** - Email service integration
- **Multer** - File upload handling

### **Infrastructure**
- **Vercel** - Deployment platform
- **Supabase/Railway** - Database hosting
- **Cloudinary** - Media storage
- **Gmail SMTP** - Email delivery
- **WebSocket** - Real-time communication

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 15+
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/invited-plus.git
cd invited-plus
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. **Environment Setup**

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/invited_plus"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Email Service (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your-email@gmail.com"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"
```

4. **Database Setup**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed # Optional: seed with sample data
```

5. **Start Development Servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## 📁 **Project Structure**

```
invited-plus/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── events/         # Event management
│   │   ├── tasks/          # Task management
│   │   ├── chat/           # Chat system
│   │   ├── polls/          # Polling system
│   │   ├── profile/        # User profile
│   │   ├── settings/       # User settings
│   │   └── admin/          # Admin panel
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   ├── layout/        # Layout components
│   │   └── features/      # Feature-specific components
│   ├── lib/               # Utilities and services
│   │   ├── api.ts         # API client
│   │   ├── services/      # Service layer
│   │   └── contexts/      # React contexts
│   └── styles/            # Global styles
├── backend/                # NestJS backend application
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── events/        # Event management
│   │   ├── tasks/         # Task management
│   │   ├── chat/          # Chat system
│   │   ├── polls/         # Polling system
│   │   ├── notifications/ # Notification system
│   │   └── common/        # Shared utilities
│   ├── prisma/            # Database schema and migrations
│   └── uploads/           # File storage
└── docs/                  # Documentation
    └── CHAT_SYSTEM_DOCUMENTATION.md
```
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

## 📋 Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Local Development
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development servers
npm run dev:backend
npm run dev:frontend
```

## 🔧 Configuration

See `.env.example` for all available environment variables.

## 📚 Comprehensive Documentation

### **📖 Core Documentation**
- **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)** - Complete system architecture and implementation guide
- **[API Documentation](./API_DOCUMENTATION.md)** - Detailed REST API endpoints and usage
- **[WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)** - Real-time communication implementation
- **[Development Workflow](./DEVELOPMENT_WORKFLOW.md)** - Setup, development tasks, and best practices
- **[Security Documentation](./SECURITY_DOCUMENTATION.md)** - Security measures and implementation

### **🏗️ Architecture Documentation**
- **[Frontend Architecture](./FRONTEND_ARCHITECTURE.md)** - Next.js structure, patterns, and components
- **[Backend Architecture](./BACKEND_ARCHITECTURE.md)** - NestJS modules, services, and design patterns

### **💬 Feature-Specific Documentation**
- **[Chat System Documentation](./CHAT_SYSTEM_DOCUMENTATION.md)** - Real-time messaging implementation
- **[Whiteboard Documentation](./WHITEBOARD_DOCUMENTATION.md)** - Collaborative whiteboard features

### **📋 Additional Resources**
- **[Database Schema](./backend/prisma/schema.prisma)** - Complete database structure
- **[Environment Variables](./backend/.env.example)** - Configuration reference
- **[Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete production deployment instructions
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🎯 **Core Features Documentation**

### **Authentication System**
- **Registration**: Email verification with 6-digit codes
- **Login**: JWT-based authentication with refresh tokens
- **Password Reset**: Secure token-based recovery
- **OAuth**: Google and GitHub integration
- **Profile**: Avatar upload and personal information

### **Event Management**
- **Creation**: Rich event details with categories
- **Invitations**: Email-based RSVP system
- **Management**: Edit, delete, and moderate events
- **Analytics**: Attendance tracking and insights

### **Task System**
- **Kanban Board**: Visual task management
- **Workflows**: Customizable task states
- **Assignments**: Role-based task distribution
- **Collaboration**: Comments and file sharing

### **Chat System**
Detailed documentation available in [CHAT_SYSTEM_DOCUMENTATION.md](./CHAT_SYSTEM_DOCUMENTATION.md)

### **Polling System**
- **Creation**: Multiple choice polls
- **Voting**: Real-time results
- **Analytics**: Vote tracking and export

## 🔧 **API Documentation**

### **Authentication Endpoints**
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh JWT token
POST /api/auth/verify-code  # Email verification
POST /api/auth/reset-password # Password reset
```

### **Event Endpoints**
```
GET    /api/events          # List events
POST   /api/events          # Create event
GET    /api/events/:id      # Get event details
PUT    /api/events/:id      # Update event
DELETE /api/events/:id      # Delete event
POST   /api/events/:id/rsvp # RSVP to event
```

### **Task Endpoints**
```
GET    /api/tasks           # List tasks
POST   /api/tasks           # Create task
PUT    /api/tasks/:id       # Update task
DELETE /api/tasks/:id       # Delete task
POST   /api/tasks/:id/assign # Assign task
```

For complete API documentation, visit: http://localhost:3001/api/docs

## 🧪 **Testing**

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test

# Run e2e tests
npm run test:e2e
```

## 🚀 **Deployment**

### **Frontend (Vercel)**
```bash
# Deploy to Vercel
vercel --prod
```

### **Backend (Railway/Heroku)**
```bash
# Deploy to Railway
railway deploy

# Or deploy to Heroku
git push heroku main
```

### **Database (Supabase/Railway)**
- Set up PostgreSQL instance
- Run migrations: `npx prisma migrate deploy`
- Update DATABASE_URL in production environment

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Next.js Team** - Amazing React framework
- **Prisma Team** - Excellent database toolkit
- **Tailwind CSS** - Beautiful utility-first CSS
- **Heroicons** - Perfect icon library
- **Vercel** - Seamless deployment platform

---

**Built with ❤️ by the Invited+ Team**

For support, email: support@invitedplus.com
For documentation: https://docs.invitedplus.com
