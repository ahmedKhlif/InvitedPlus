'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { authService } from '@/lib/services';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  EyeIcon
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
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const fetchRecentActivity = async () => {
    try {
      setActivitiesLoading(true);
      const response = await authService.getRecentActivity(20);
      if (response.success) {
        setActivities(response.activities);
      } else {
        console.error('Failed to fetch recent activity');
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

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
        const response = await fetch('http://localhost:3001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }

        // Fetch recent activity
        await fetchRecentActivity();
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You need admin privileges to access this page.</p>
          <Link href="/dashboard" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome to the admin dashboard. Monitor and manage your platform.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">U</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">E</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEvents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalTasks}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeEvents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-xl">👥</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-500">Create, edit, and manage user accounts</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/events" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">📅</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Events</h3>
                <p className="text-sm text-gray-500">Oversee all platform events</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">📊</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">Platform insights and reports</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/logs" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
                <p className="text-sm text-gray-500">View detailed platform activity logs</p>
              </div>
            </div>
          </Link>
        </div>

        {/* User Role Distribution */}
        {stats && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.usersByRole?.ADMIN || 0}</div>
                <div className="text-sm text-gray-500">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.usersByRole?.ORGANIZER || 0}</div>
                <div className="text-sm text-gray-500">Organizers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.usersByRole?.GUEST || 0}</div>
                <div className="text-sm text-gray-500">Guests</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Logs */}
        <div id="activity-logs" className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity Logs</h3>
            <button
              onClick={fetchRecentActivity}
              disabled={activitiesLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {activitiesLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
              ) : (
                <EyeIcon className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
          </div>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Activity logs will appear here as users interact with the platform.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {activities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== activities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityIconBg(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{activity.user?.name || 'Unknown User'}</span>{' '}
                              {activity.description}
                              {activity.relatedEntity && (
                                <>
                                  {' '}in{' '}
                                  <Link
                                    href={activity.relatedEntity.href}
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                  >
                                    {activity.relatedEntity.name}
                                  </Link>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={activity.timestamp}>
                              {formatRelativeTime(activity.timestamp)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        </div>
      </div>
      </AdminLayout>
    </AdminRoute>
  );
}
