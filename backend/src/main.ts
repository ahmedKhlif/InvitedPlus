import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  const uploadsPath = process.env.UPLOAD_PATH || join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Enable CORS for production and development
  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'https://invited-plus.vercel.app',
    'https://invited-plus.vercel.app',
    'http://localhost:3000', // Keep for local development
  ];

  // Add production frontend URL
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin matches Vercel preview pattern
      if (process.env.NODE_ENV === 'production' && /https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Reject origin
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Invited+ API')
    .setDescription('The Invited+ Event Management Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);

  // Note: Socket.IO server is now handled by the WebSocket Gateway
  // The whiteboard collaboration will be integrated into the main gateway

  // Reduced logging for production to prevent rate limits
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Application is running on: https://invitedplus-production.up.railway.app`);
    console.log(`📚 API Documentation: https://invitedplus-production.up.railway.app/api/docs`);
    console.log(`🔗 Socket.IO server initialized for real-time collaboration`);
  }
}

bootstrap();
