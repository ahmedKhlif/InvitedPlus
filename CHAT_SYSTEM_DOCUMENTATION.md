# 🚀 **Event+ Chat System - Complete Implementation Guide**

## 📖 **Table of Contents**
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Media Upload System](#media-upload-system)
6. [File Storage & Serving](#file-storage--serving)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ **System Overview**

The Event+ chat system is a real-time messaging platform that supports:
- **Text messages** with rich formatting
- **Image sharing** with automatic optimization
- **Voice messages** with playback controls
- **File attachments** (PDF, documents)
- **Event-specific chats** and global chat
- **User authentication** and message history

### **Tech Stack**
- **Backend**: NestJS + Prisma + SQLite
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **File Processing**: Sharp (image optimization)
- **Audio**: Web Audio API + MediaRecorder

---

## 🗄️ **Database Schema**

### **ChatMessage Model**
```prisma
model ChatMessage {
  id        String      @id @default(cuid())
  content   String      // Message text content
  type      MessageType @default(TEXT) // TEXT, IMAGE, VOICE, FILE
  mediaUrl  String?     // URL to uploaded media file
  mediaType String?     // MIME type (image/webp, audio/webm, etc.)
  duration  Int?        // Duration in seconds for voice messages
  
  // Relationships
  senderId  String
  sender    User        @relation(fields: [senderId], references: [id], onDelete: Cascade)
  eventId   String?     // Optional: for event-specific chats
  event     Event?      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@map("chat_messages")
}

enum MessageType {
  TEXT
  IMAGE
  VOICE
  FILE
}
```

### **Key Design Decisions**
- **Polymorphic messages**: Single table for all message types
- **Optional event association**: Messages can be global or event-specific
- **Media metadata**: Store MIME type and duration for rich display
- **Cascade deletion**: Messages deleted when user/event is deleted

---

## ⚙️ **Backend Implementation**

### **1. Chat Service (`backend/src/chat/chat.service.ts`)**

#### **Core Message Operations**
```typescript
async sendMessage(sendMessageDto: SendMessageDto, userId: string) {
  const { content, type = MessageType.TEXT, mediaUrl, mediaType, duration, eventId } = sendMessageDto;
  
  // Validate event access if eventId provided
  if (eventId) {
    await this.verifyEventAccess(eventId, userId);
  }
  
  // Create message with all metadata
  const message = await this.prisma.chatMessage.create({
    data: {
      content,
      type,
      mediaUrl,
      mediaType,
      duration,
      senderId: userId,
      eventId: cleanEventId,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } }
    }
  });
  
  return message;
}
```

#### **Media Upload Handler**
```typescript
async uploadChatMedia(file: Express.Multer.File, mediaType: 'image' | 'voice' | 'file', userId: string) {
  // File validation
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    voice: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'],
    file: ['application/pdf', 'text/plain', 'application/msword']
  };
  
  // Size limits
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    voice: 25 * 1024 * 1024, // 25MB
    file: 50 * 1024 * 1024   // 50MB
  };
  
  // Use upload service to save file
  const uploadResult = await this.uploadService.uploadFile(file, `chat/${mediaType}s`);
  
  return {
    success: true,
    data: {
      url: uploadResult.url,
      filename: uploadResult.filename,
      mimetype: file.mimetype,
      size: file.size,
      type: mediaType
    }
  };
}
```

### **2. Chat Controller (`backend/src/chat/chat.controller.ts`)**

#### **API Endpoints**
```typescript
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  
  // Send message
  @Post('messages')
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.sendMessage(sendMessageDto, userId);
  }
  
  // Upload media files
  @Post('upload/image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'image', userId);
  }
  
  @Post('upload/voice')
  @UseInterceptors(FileInterceptor('voice'))
  async uploadVoice(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'voice', userId);
  }
  
  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user?.sub || req.user?.userId || req.user?.id;
    return this.chatService.uploadChatMedia(file, 'file', userId);
  }
}
```

### **3. Upload Service (`backend/src/upload/upload.service.ts`)**

#### **File Processing & Storage**
```typescript
async uploadFile(file: Express.Multer.File, subDir: string = ''): Promise<{ url: string; filename: string }> {
  const targetDir = path.join(this.uploadDir, subDir);
  await fs.mkdir(targetDir, { recursive: true });
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(file.originalname);
  const filename = `${timestamp}-${randomString}${extension}`;
  
  if (file.mimetype.startsWith('image/')) {
    // Optimize images with Sharp
    await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(targetDir, filename.replace(extension, '.webp')));
    
    return {
      url: `/uploads/${subDir}/${filename.replace(extension, '.webp')}`,
      filename: filename.replace(extension, '.webp')
    };
  } else {
    // Save other files as-is
    await fs.writeFile(path.join(targetDir, filename), file.buffer);
    return {
      url: `/uploads/${subDir}/${filename}`,
      filename
    };
  }
}
```

---

## 🎨 **Frontend Implementation**

### **1. Chat Page (`frontend/app/chat/page.tsx`)**

#### **Main Chat Interface**
```typescript
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load messages on component mount
  useEffect(() => {
    loadMessages();
  }, []);
  
  const loadMessages = async () => {
    try {
      const response = await chatService.getMessages({ limit: 50 });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await chatService.sendMessage({
        content: newMessage,
        type: 'TEXT'
      });
      
      setNewMessage('');
      await loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <MediaMessage message={message} isOwnMessage={isCurrentUser} />
          </div>
        ))}
      </div>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <ImageUploadButton onUpload={handleImageUpload} />
          <VoiceRecordButton onUpload={handleVoiceUpload} />
          <FileUploadButton onUpload={handleFileUpload} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
```

### **2. Media Message Component (`frontend/components/chat/MediaMessage.tsx`)**

#### **Polymorphic Message Rendering**
```typescript
export default function MediaMessage({ message, isOwnMessage }: MediaMessageProps) {
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper to construct full media URLs
  const getFullMediaUrl = (mediaUrl: string): string => {
    if (mediaUrl.startsWith('http')) return mediaUrl;
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '');
    return `${backendUrl}${mediaUrl}`;
  };

  // IMAGE MESSAGES
  if (message.type === 'IMAGE' && message.mediaUrl) {
    const fullImageUrl = getFullMediaUrl(message.mediaUrl);
    return (
      <div className={`max-w-xs lg:max-w-md rounded-lg p-2 ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <img
          src={fullImageUrl}
          alt="Shared image"
          className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90"
          onError={() => setImageError(true)}
          onClick={() => window.open(fullImageUrl, '_blank')}
        />
        {message.content && <div className="mt-2 text-sm">{message.content}</div>}
      </div>
    );
  }

  // VOICE MESSAGES
  if (message.type === 'VOICE' && message.mediaUrl) {
    const fullVoiceUrl = getFullMediaUrl(message.mediaUrl);
    return (
      <div className={`p-3 rounded-lg max-w-xs ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isOwnMessage ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-500 hover:bg-gray-600'
            } text-white`}
          >
            {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </button>

          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Voice message</span>
              <span className="text-xs opacity-75">
                {formatDuration(currentTime)} / {formatDuration(message.duration || 0)}
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  isOwnMessage ? 'bg-blue-300' : 'bg-gray-500'
                }`}
                style={{ width: `${message.duration ? (currentTime / message.duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={fullVoiceUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
          className="hidden"
        />
      </div>
    );
  }

  // FILE MESSAGES
  if (message.type === 'FILE' && message.mediaUrl) {
    const fullFileUrl = getFullMediaUrl(message.mediaUrl);
    return (
      <div className={`max-w-xs p-3 rounded-lg ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <a href={fullFileUrl} target="_blank" rel="noopener noreferrer"
           className="flex items-center space-x-3 hover:opacity-80">
          <div className={isOwnMessage ? 'text-blue-200' : 'text-gray-500'}>
            {getFileIcon(message.mediaType)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium truncate">{getFileName(message.mediaUrl)}</div>
            <div className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
              {message.mediaType || 'Unknown type'}
            </div>
          </div>
        </a>
      </div>
    );
  }

  // TEXT MESSAGES (fallback)
  return (
    <div className={`px-4 py-2 rounded-lg ${
      isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="text-sm">{message.content}</div>
    </div>
  );
}
```

### **3. Chat Service (`frontend/lib/services/chat.ts`)**

#### **API Communication**
```typescript
export const chatService = {
  // Get messages with pagination
  async getMessages(params?: {
    page?: number;
    limit?: number;
    eventId?: string;
  }): Promise<MessagesResponse> {
    const cleanParams: any = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.eventId && params.eventId.trim() !== '') {
      cleanParams.eventId = params.eventId;
    }

    const response = await api.get('/chat/messages', { params: cleanParams });
    return response.data;
  },

  // Send message with all media fields
  async sendMessage(data: SendMessageData): Promise<SendMessageResponse> {
    const cleanData: any = { content: data.content };

    // Include all media-related fields
    if (data.type) cleanData.type = data.type;
    if (data.mediaUrl) cleanData.mediaUrl = data.mediaUrl;
    if (data.mediaType) cleanData.mediaType = data.mediaType;
    if (data.duration) cleanData.duration = data.duration;
    if (data.eventId && data.eventId.trim() !== '') {
      cleanData.eventId = data.eventId;
    }

    const response = await api.post('/chat/messages', cleanData);
    return response.data;
  },

  // Upload media files
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/chat/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async uploadVoice(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('voice', file);
    const response = await api.post('/chat/upload/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/chat/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
```

---

## 📁 **Media Upload System**

### **File Storage Structure**
```
backend/uploads/
├── chat/
│   ├── images/          # Optimized images (.webp)
│   ├── voices/          # Audio files (.webm, .mp3)
│   └── files/           # Documents (.pdf, .doc, etc.)
├── avatars/             # User profile pictures
└── events/              # Event cover images
```

### **Upload Flow**
1. **Frontend**: User selects/records media
2. **Validation**: Check file type, size limits
3. **Upload**: Send to backend via FormData
4. **Processing**: Optimize images, generate unique filenames
5. **Storage**: Save to filesystem with organized structure
6. **Database**: Store metadata (URL, type, size) in ChatMessage
7. **Response**: Return file URL and metadata
8. **Message**: Create chat message with media reference

### **File Serving**
```typescript
// backend/src/main.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

**Static file URLs**: `http://localhost:3001/uploads/chat/images/filename.webp`

---

## 🔌 **API Endpoints**

### **Chat Messages**
```http
GET    /api/chat/messages              # Get paginated messages
POST   /api/chat/messages              # Send new message
GET    /api/chat/events/:id/messages   # Get event-specific messages
```

### **Media Uploads**
```http
POST   /api/chat/upload/image          # Upload image
POST   /api/chat/upload/voice          # Upload voice message
POST   /api/chat/upload/file           # Upload file attachment
```

### **Request/Response Examples**

#### **Send Text Message**
```json
POST /api/chat/messages
{
  "content": "Hello everyone!",
  "type": "TEXT",
  "eventId": "optional-event-id"
}
```

#### **Send Image Message**
```json
POST /api/chat/messages
{
  "content": "Check out this photo!",
  "type": "IMAGE",
  "mediaUrl": "/uploads/chat/images/1234567890-abc123.webp",
  "mediaType": "image/webp"
}
```

#### **Upload Response**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "/uploads/chat/images/1234567890-abc123.webp",
    "filename": "1234567890-abc123.webp",
    "mimetype": "image/webp",
    "size": 245760,
    "type": "image"
  }
}
```

---

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. 404 Errors on Media Files**
**Problem**: Images/files return 404 Not Found
**Cause**: Incorrect URL construction or backend not serving static files
**Solution**:
```typescript
// Check URL construction
const getFullMediaUrl = (mediaUrl: string): string => {
  const backendUrl = 'http://localhost:3001'; // Remove /api
  return `${backendUrl}${mediaUrl}`;
};

// Verify backend static file serving
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

#### **2. Audio Not Playing**
**Problem**: "NotSupportedError: The element has no supported sources"
**Cause**: Browser doesn't support WebM audio format
**Solutions**:
- Convert audio to MP3 on backend
- Use different recording format
- Add format detection and fallbacks

#### **3. File Upload Fails**
**Problem**: Upload returns 400 Bad Request
**Causes & Solutions**:
- **File too large**: Check size limits in backend
- **Invalid file type**: Verify MIME type validation
- **Missing auth**: Ensure JWT token is included
- **CORS issues**: Check CORS configuration

#### **4. Messages Not Updating**
**Problem**: New messages don't appear immediately
**Cause**: No real-time updates implemented
**Solutions**:
- Add WebSocket support for real-time updates
- Implement polling to refresh messages
- Use Server-Sent Events (SSE)

### **Debug Tools**
```typescript
// Add debug logging
console.log('Generated media URL:', fullUrl);
console.log('Message data:', message);
console.log('Upload response:', uploadResponse);

// Check file existence
const fs = require('fs');
const filePath = path.join(__dirname, '..', 'uploads', 'chat', 'images', filename);
console.log('File exists:', fs.existsSync(filePath));
```

---

## 🚀 **Future Enhancements**

### **Real-time Features**
- WebSocket integration for live messaging
- Typing indicators
- Online user status
- Message read receipts

### **Media Improvements**
- Audio format conversion (WebM → MP3)
- Video message support
- Image compression options
- File preview generation

### **User Experience**
- Message reactions/emojis
- Reply to specific messages
- Message search functionality
- Dark mode support

### **Performance**
- Message pagination
- Lazy loading of media
- CDN integration for file serving
- Database indexing optimization

---

## 📝 **Summary**

The Event+ chat system provides a comprehensive messaging solution with:

✅ **Multi-format messaging** (text, images, voice, files)
✅ **Secure file uploads** with validation and optimization
✅ **Event-specific chats** and global messaging
✅ **Responsive UI** with proper message styling
✅ **Database persistence** with rich metadata
✅ **RESTful API** with proper authentication

The system is built with scalability and extensibility in mind, making it easy to add real-time features, additional media types, and enhanced user interactions in the future.

---

## 🔧 **Key Implementation Details**

### **Database Design Decisions**
- **Single table for all message types** - Simplifies queries and relationships
- **Optional event association** - Supports both global and event-specific chats
- **Rich metadata storage** - Duration, MIME types, file sizes for enhanced UX
- **Cascade deletion** - Maintains data integrity when users/events are deleted

### **Security Considerations**
- **File type validation** - Prevents malicious file uploads
- **Size limits** - Protects against storage abuse
- **JWT authentication** - Secures all API endpoints
- **Input sanitization** - Prevents XSS and injection attacks

### **Performance Optimizations**
- **Image optimization** - Automatic WebP conversion with Sharp
- **Unique filenames** - Prevents conflicts and enables caching
- **Organized storage** - Structured directory layout for efficient serving
- **Pagination support** - Handles large message histories

This documentation provides a complete reference for understanding, maintaining, and extending the Event+ chat system. 🎉
