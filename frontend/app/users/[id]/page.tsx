'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarIcon,
  UsersIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'GUEST';
  avatar?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    organizedEvents: number;
    eventAttendees: number;
    tasks: number;
    chatMessages: number;
  };
  recentEvents?: Array<{
    id: string;
    title: string;
    startDate: string;
    role: 'organizer' | 'attendee';
  }>;
  recentTasks?: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: string;
  }>;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchUserProfile(params.id as string);
    }
  }, [params.id]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);

      // Get current user
      const profileResponse = await authService.getProfile();
      setCurrentUser(profileResponse.user);

      // Fetch user profile
      const response = await api.get(`/users/${userId}/profile`);
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        showError('Failed to load user profile');
      }
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      showError(error.response?.data?.message || 'Failed to load user profile');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ORGANIZER':
        return 'bg-blue-100 text-blue-800';
      case 'GUEST':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'ORGANIZER':
        return '🎯';
      case 'GUEST':
        return '👤';
      default:
        return '👤';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = () => {
    router.push(`/chat?user=${user?.id}`);
  };

  const handleSendEmail = () => {
    window.location.href = `mailto:${user?.email}`;
  };

  const handleCall = () => {
    if (user?.phone) {
      window.location.href = `tel:${user.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card variant="elevated" className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The user profile you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button
              onClick={() => router.push('/users')}
              className="mt-4"
            >
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/users"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Users
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">User Profile</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto">
                      {getInitials(user.name)}
                    </div>
                  )}
                  {user.isVerified && (
                    <CheckBadgeIcon className="absolute -bottom-1 -right-1 h-6 w-6 text-blue-500 bg-white rounded-full" />
                  )}
                </div>

                {/* Name and Role */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${getRoleColor(user.role)}`}>
                  <span className="mr-1">{getRoleIcon(user.role)}</span>
                  {user.role}
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-gray-600 text-sm mb-6">{user.bio}</p>
                )}

                {/* Contact Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSendMessage}
                    className="w-full"
                    variant="default"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleSendEmail}
                      variant="outline"
                      size="sm"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    {user.phone && (
                      <Button
                        onClick={handleCall}
                        variant="outline"
                        size="sm"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                  {user.timezone && (
                    <div className="flex items-center justify-center space-x-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>{user.timezone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{user._count.organizedEvents}</div>
                    <div className="text-sm text-blue-700">Organized</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <UsersIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">{user._count.eventAttendees}</div>
                    <div className="text-sm text-green-700">Attended</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <BriefcaseIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900">{user._count.tasks}</div>
                    <div className="text-sm text-purple-700">Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-900">{user._count.chatMessages}</div>
                    <div className="text-sm text-orange-700">Messages</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Events */}
            {user.recentEvents && user.recentEvents.length > 0 && (
              <Card variant="elevated" className="backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.recentEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(event.startDate).toLocaleDateString()} • {event.role}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            {user.recentTasks && user.recentTasks.length > 0 && (
              <Card variant="elevated" className="backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.recentTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600">
                            Status: {task.status}
                            {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
