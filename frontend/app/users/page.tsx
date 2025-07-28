'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  UserIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarIcon,
  UsersIcon,
  CheckBadgeIcon,
  FunnelIcon,
  UserPlusIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'GUEST';
  avatar?: string;
  bio?: string;
  phone?: string;
  isVerified: boolean;
  isOnline?: boolean;
  lastSeenAt?: string;
  createdAt: string;
  _count?: {
    organizedEvents: number;
    eventAttendees: number;
    tasks: number;
    chatMessages: number;
  };
}

interface UserCatalogResponse {
  success: boolean;
  users: User[];
  totalUsers: number;
  currentUserRole: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [totalUsers, setTotalUsers] = useState(0);
  const [friendships, setFriendships] = useState<Record<string, boolean>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchUsers();
    checkFriendships();
  }, []);

  const checkFriendships = async () => {
    try {
      const response = await api.get('/friends');
      if (response.data.success) {
        const friendsMap: Record<string, boolean> = {};
        response.data.friends.forEach((friend: any) => {
          friendsMap[friend.id] = true;
        });
        setFriendships(friendsMap);
      }
    } catch (error) {
      console.error('Failed to check friendships:', error);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await api.post('/friends/request', {
        receiverId: userId,
        message: 'Hi! I would like to add you as a friend.'
      });

      if (response.data.success) {
        showSuccess('Friend request sent successfully');
        setPendingRequests(prev => ({ ...prev, [userId]: true }));
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to send friend request');
    }
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get current user
      const profileResponse = await authService.getProfile();
      setCurrentUser(profileResponse.user);

      // Fetch users based on role permissions
      const response = await api.get('/users/catalog');
      
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalUsers(response.data.totalUsers);
      } else {
        showError('Failed to load users');
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      showError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
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

  const getLastSeenText = (user: User) => {
    if (user.isOnline) {
      return { text: 'Online', color: 'text-green-600', dot: 'bg-green-500' };
    }

    if (!user.lastSeenAt) {
      return { text: 'Offline', color: 'text-gray-600', dot: 'bg-gray-400' };
    }

    const lastSeen = new Date(user.lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffMinutes < 5) {
      return { text: 'Just now', color: 'text-yellow-600', dot: 'bg-yellow-500' };
    } else if (diffMinutes < 60) {
      return { text: `${diffMinutes} min ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return { text: `${hours} hour${hours > 1 ? 's' : ''} ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return { text: `${days} day${days > 1 ? 's' : ''} ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
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
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Directory</h1>
                <p className="text-gray-600">
                  {currentUser?.role === 'ADMIN' && 'Browse all platform users'}
                  {currentUser?.role === 'ORGANIZER' && 'Browse guest users and event participants'}
                  {currentUser?.role === 'GUEST' && 'Browse users from your events'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{filteredUsers.length}</span> of {totalUsers} users
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card variant="elevated" className="backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="ORGANIZER">Organizers</option>
                  <option value="GUEST">Guests</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(user.name)}
                        </div>
                      )}
                      {/* Online Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getLastSeenText(user).dot} rounded-full border-2 border-white`}></div>
                      {user.isVerified && (
                        <CheckBadgeIcon className="absolute -top-1 -right-1 h-5 w-5 text-blue-500 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {user.role}
                      </div>
                      {/* Last Seen Status */}
                      <p className={`text-xs mt-1 ${getLastSeenText(user).color}`}>
                        {getLastSeenText(user).text}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    View Profile
                  </Button>
                </div>

                {/* User Stats */}
                {user._count && (
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">
                        {user._count.organizedEvents + user._count.eventAttendees} events
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">{user._count.tasks} tasks</span>
                    </div>
                  </div>
                )}

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
                )}

                {/* Contact Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    {user.phone && (
                      <button
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Message"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Email"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </button>
                    {/* Friend Request Button */}
                    {friendships[user.id] ? (
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Already Friends"
                        disabled
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    ) : pendingRequests[user.id] ? (
                      <button
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Request Sent"
                        disabled
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Send Friend Request"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users are available to display.'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
