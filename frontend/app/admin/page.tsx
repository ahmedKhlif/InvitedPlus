'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import RecentActivity from '@/components/dashboard/RecentActivity';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PlatformStats {
  totalUsers: number;
  totalEvents: number;
  totalTasks: number;
  totalMessages: number;
  totalPolls: number;
  recentUsers: number;
  activeEvents: number;
  usersByRole: {
    ADMIN: number;
    ORGANIZER: number;
    GUEST: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'event' | 'task' | 'message' | 'poll' | 'user';
  action: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  relatedEntity?: {
    id: string;
    name: string;
    href: string;
  };
}

// Helper functions for activity display
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'event':
      return <CalendarIcon className="h-5 w-5 text-white" />;
    case 'task':
      return <ClipboardDocumentListIcon className="h-5 w-5 text-white" />;
    case 'message':
      return <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />;
    case 'poll':
      return <ChartBarIcon className="h-5 w-5 text-white" />;
    case 'user':
      return <UserIcon className="h-5 w-5 text-white" />;
    default:
      return <ClockIcon className="h-5 w-5 text-white" />;
  }
};

const getActivityIconBg = (type: string) => {
  switch (type) {
    case 'event':
      return 'bg-green-500';
    case 'task':
      return 'bg-blue-500';
    case 'message':
      return 'bg-purple-500';
    case 'poll':
      return 'bg-yellow-500';
    case 'user':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { showError } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is admin
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const profileResponse = await authService.getProfile();
        setUser(profileResponse.user);

        if (profileResponse.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        // Fetch platform stats using the API service
        const statsResponse = await api.get('/admin/stats');
        setStats(statsResponse.data.stats);
      } catch (error: any) {
        console.error('Failed to fetch admin data:', error);
        showError('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, showError]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card variant="elevated" className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-8 w-8 mr-3 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Platform management and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Switch to User View
              </Button>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome back,</span>
                <span className="font-medium text-gray-900">{user?.name || 'Admin'}</span>
              </div>

              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <div className="flex items-center mt-1">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{stats.recentUsers} this week</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                    <div className="flex items-center mt-1">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stats.activeEvents} active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                    <div className="flex items-center mt-1">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">Across all events</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                    <div className="flex items-center mt-1">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Active discussions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/users">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-500">Create, edit, and manage user accounts</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/events">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Manage Events</h3>
                    <p className="text-sm text-gray-500">Oversee all platform events</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/analytics">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-500">Platform insights and reports</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/logs">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
                    <p className="text-sm text-gray-500">View detailed platform activity logs</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/chat">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Chat & Messages</h3>
                    <p className="text-sm text-gray-500">Moderate communications</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/tasks">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Task Management</h3>
                    <p className="text-sm text-gray-500">Oversee all tasks</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/settings">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CogIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                    <p className="text-sm text-gray-500">Configure platform</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/reports">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                    <p className="text-sm text-gray-500">Generate reports</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* User Role Distribution */}
        {stats && (
          <Card variant="elevated" className="backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Overview of user roles across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheckIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{stats.usersByRole?.ADMIN || 0}</div>
                  <div className="text-sm text-gray-500">Admins</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CogIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.usersByRole?.ORGANIZER || 0}</div>
                  <div className="text-sm text-gray-500">Organizers</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.usersByRole?.GUEST || 0}</div>
                  <div className="text-sm text-gray-500">Guests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities and events</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/logs">View All Logs</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RecentActivity limit={5} showRefresh={true} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
