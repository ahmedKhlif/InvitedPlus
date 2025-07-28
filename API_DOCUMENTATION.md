# InvitedPlus API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "avatar": null
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "avatar": "/uploads/avatars/avatar.jpg"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /auth/profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "avatar": "/uploads/avatars/avatar.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Event Management Endpoints

#### GET /events
Get all events (with pagination and filtering).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by event status
- `search` (optional): Search in title and description

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event123",
      "title": "Team Meeting",
      "description": "Weekly team sync",
      "location": "Conference Room A",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-01-15T11:00:00.000Z",
      "status": "PUBLISHED",
      "isPublic": false,
      "maxAttendees": 10,
      "organizer": {
        "id": "user123",
        "name": "John Doe",
        "avatar": "/uploads/avatars/avatar.jpg"
      },
      "attendeeCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST /events
Create a new event.

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync meeting",
  "location": "Conference Room A",
  "startDate": "2024-01-15T10:00:00.000Z",
  "endDate": "2024-01-15T11:00:00.000Z",
  "maxAttendees": 10,
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "event": {
    "id": "event123",
    "title": "Team Meeting",
    "description": "Weekly team sync meeting",
    "location": "Conference Room A",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-01-15T11:00:00.000Z",
    "status": "DRAFT",
    "isPublic": false,
    "maxAttendees": 10,
    "organizerId": "user123",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /events/:id
Get detailed information about a specific event.

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "event123",
    "title": "Team Meeting",
    "description": "Weekly team sync meeting",
    "location": "Conference Room A",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-01-15T11:00:00.000Z",
    "status": "PUBLISHED",
    "isPublic": false,
    "maxAttendees": 10,
    "organizer": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "/uploads/avatars/avatar.jpg"
    },
    "attendees": [
      {
        "id": "attendee123",
        "user": {
          "id": "user456",
          "name": "Jane Smith",
          "avatar": "/uploads/avatars/jane.jpg"
        },
        "status": "ACCEPTED",
        "joinedAt": "2024-01-02T00:00:00.000Z"
      }
    ],
    "tasks": [
      {
        "id": "task123",
        "title": "Prepare agenda",
        "status": "COMPLETED",
        "assignee": {
          "id": "user456",
          "name": "Jane Smith"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /events/:id
Update an existing event (organizer only).

**Request Body:**
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated description",
  "location": "Conference Room B",
  "startDate": "2024-01-15T14:00:00.000Z",
  "endDate": "2024-01-15T15:00:00.000Z"
}
```

#### DELETE /events/:id
Delete an event (organizer only).

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Task Management Endpoints

#### GET /tasks/event/:eventId
Get all tasks for a specific event.

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task123",
      "title": "Prepare presentation",
      "description": "Create slides for the meeting",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-01-14T23:59:59.000Z",
      "creator": {
        "id": "user123",
        "name": "John Doe"
      },
      "assignee": {
        "id": "user456",
        "name": "Jane Smith",
        "avatar": "/uploads/avatars/jane.jpg"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

#### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Prepare presentation",
  "description": "Create slides for the meeting",
  "eventId": "event123",
  "assigneeId": "user456",
  "priority": "HIGH",
  "dueDate": "2024-01-14T23:59:59.000Z"
}
```

#### PUT /tasks/:id
Update a task.

**Request Body:**
```json
{
  "title": "Updated task title",
  "status": "COMPLETED",
  "description": "Updated description"
}
```

### Chat Endpoints

#### GET /chat/event/:eventId/messages
Get chat messages for an event.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Messages per page

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg123",
      "content": "Hello everyone!",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "avatar": "/uploads/avatars/john.jpg"
      },
      "reactions": [
        {
          "emoji": "👍",
          "count": 3,
          "users": ["user456", "user789"]
        }
      ],
      "attachments": [],
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120
  }
}
```

#### POST /chat/event/:eventId/messages
Send a message to event chat.

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "attachments": [
    {
      "type": "image",
      "url": "/uploads/chat/image.jpg",
      "filename": "screenshot.jpg"
    }
  ]
}
```
