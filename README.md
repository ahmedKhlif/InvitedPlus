# Invited+ Event Management Platform

A **smart, collaborative, invite‑only event & task management platform** built with modern technologies.

## 🚀 Features

- **Authentication & Security**: JWT + OAuth2 (Google, GitHub)
- **Event Management**: Create, manage, and track public/private events
- **Invitation System**: Unique invite codes and RSVP workflow
- **Task Management**: Drag-and-drop task boards with real-time collaboration
- **Real-Time Features**: WebSocket chat, live polls, and announcements
- **Advanced Integrations**: Calendar sync, payments, QR check-in
- **DevOps Ready**: Docker, CI/CD, monitoring, and logging

## 🛠 Technology Stack

- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, React Hook Form
- **Backend**: NestJS (TypeScript), Prisma ORM
- **Database**: SQLite
- **Authentication**: JWT, OAuth2 (Passport strategies)
- **Real-time**: WebSockets (NestJS Gateway)
- **DevOps**: Docker, NGINX, GitHub Actions, Winston logging

## 📁 Project Structure

```
invited-plus/
├── backend/                  # NestJS API
├── frontend/                 # Next.js App
├── nginx/                    # NGINX configuration
├── docker-compose.yml        # Docker services
├── .github/workflows/        # CI/CD pipelines
└── README.md
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invited-plus
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker**
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

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing](./docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
