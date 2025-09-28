# Frontend Architecture Documentation

## Overview
The frontend is built with Next.js 14 using the App Router, TypeScript, and Tailwind CSS. It follows modern React patterns with hooks, context, and component composition.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages group
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── layout.tsx     # Auth layout
│   ├── admin/             # Admin dashboard
│   │   ├── analytics/     # Analytics page
│   │   ├── users/         # User management
│   │   └── layout.tsx     # Admin layout
│   ├── events/            # Event management
│   │   ├── [id]/          # Dynamic event pages
│   │   │   ├── chat/      # Event chat
│   │   │   ├── tasks/     # Task management
│   │   │   ├── whiteboard/ # Whiteboard collaboration
│   │   │   └── page.tsx   # Event details
│   │   ├── create/        # Create event
│   │   └── page.tsx       # Events list
│   ├── profile/           # User profile
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   │   ├── button.tsx    # Button component
│   │   ├── input.tsx     # Input component
│   │   ├── modal.tsx     # Modal component
│   │   └── ...           # Other UI components
│   ├── forms/            # Form components
│   │   ├── event-form.tsx
│   │   ├── task-form.tsx
│   │   └── ...
│   ├── layout/           # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── features/         # Feature-specific components
│       ├── chat/
│       ├── whiteboard/
│       └── tasks/
├── contexts/             # React contexts
│   ├── auth-context.tsx  # Authentication context
│   ├── toast-context.tsx # Toast notifications
│   └── theme-context.tsx # Theme management
├── hooks/                # Custom React hooks
│   ├── use-auth.ts       # Authentication hook
│   ├── use-socket.ts     # WebSocket hook
│   ├── use-api.ts        # API requests hook
│   └── ...
├── lib/                  # Utility libraries
│   ├── api.ts            # API client configuration
│   ├── socket.ts         # Socket.IO client
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Form validations
├── types/                # TypeScript definitions
│   ├── auth.ts           # Authentication types
│   ├── events.ts         # Event types
│   ├── tasks.ts          # Task types
│   └── api.ts            # API response types
└── utils/                # Utility functions
    ├── date.ts           # Date utilities
    ├── format.ts         # Formatting utilities
    └── constants.ts      # Application constants
```

## Core Architecture Patterns

### 1. App Router Structure
```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// app/(auth)/layout.tsx - Auth group layout
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 2. Context Pattern for State Management
```typescript
// contexts/auth-context.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Auto-login on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      refreshToken,
      isLoading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3. Custom Hooks Pattern
```typescript
// hooks/use-socket.ts
export function useSocket(eventId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://invitedplus.onrender.com', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (eventId) {
        newSocket.emit('event:join', { eventId });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, eventId]);

  return { socket, isConnected };
}

// hooks/use-api.ts
export function useApi() {
  const { refreshToken } = useAuth();

  const apiCall = useCallback(async (config: AxiosRequestConfig) => {
    try {
      return await api(config);
    } catch (error) {
      if (error.response?.status === 401) {
        // Try to refresh token
        try {
          await refreshToken();
          // Retry original request
          return await api(config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
          throw refreshError;
        }
      }
      throw error;
    }
  }, [refreshToken]);

  return { apiCall };
}
```

### 4. Component Composition Pattern
```typescript
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

### 5. Form Handling Pattern
```typescript
// components/forms/event-form.tsx
interface EventFormProps {
  initialData?: Partial<Event>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, isLoading }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<EventFormData>({
    defaultValues: initialData,
    resolver: zodResolver(eventFormSchema)
  });

  const startDate = watch('startDate');

  // Auto-set end date when start date changes
  useEffect(() => {
    if (startDate && !initialData?.endDate) {
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
      setValue('endDate', endDate.toISOString().slice(0, 16));
    }
  }, [startDate, setValue, initialData]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Event Title
        </label>
        <input
          {...register('title')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="datetime-local"
            {...register('startDate')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="datetime-local"
            {...register('endDate')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        {initialData ? 'Update Event' : 'Create Event'}
      </Button>
    </form>
  );
}
```

## State Management Strategy

### 1. Local State (useState)
- Component-specific state
- Form inputs
- UI state (modals, dropdowns)

### 2. Context State
- Authentication state
- Theme preferences
- Toast notifications
- Global UI state

### 3. Server State (React Query alternative)
```typescript
// hooks/use-events.ts
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/events');
      setEvents(response.data.events);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: CreateEventData) => {
    const response = await api.post('/events', eventData);
    setEvents(prev => [...prev, response.data.event]);
    return response.data.event;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const response = await api.put(`/events/${id}`, updates);
    setEvents(prev => prev.map(event => 
      event.id === id ? response.data.event : event
    ));
    return response.data.event;
  };

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    createEvent,
    updateEvent
  };
}
```
