# Invited+ API Documentation

## Overview

The Invited+ API is built with NestJS and provides RESTful endpoints for managing events, tasks, invitations, and real-time features.

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST /auth/logout
Logout the current user.

### Events

#### GET /events
Get all events (public events + user's events).

#### POST /events
Create a new event.

#### GET /events/:id
Get event details by ID.

#### PUT /events/:id
Update an event.

#### DELETE /events/:id
Delete an event.

### Tasks

#### GET /events/:eventId/tasks
Get all tasks for an event.

#### POST /events/:eventId/tasks
Create a new task.

#### PUT /tasks/:id
Update a task.

#### DELETE /tasks/:id
Delete a task.

### Invitations

#### POST /events/:eventId/invitations
Send invitations to an event.

#### GET /invitations
Get user's invitations.

#### PUT /invitations/:id/respond
Respond to an invitation (accept/decline).

## WebSocket Events

The API supports real-time features through WebSocket connections:

- `chat:message` - Send/receive chat messages
- `task:updated` - Task status updates
- `event:updated` - Event updates
- `poll:created` - New poll created
- `poll:voted` - Poll vote updates

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- General API: 100 requests per minute
- Authentication endpoints: 5 requests per minute

## Interactive Documentation

Visit `/api/docs` for interactive Swagger documentation when the server is running.
