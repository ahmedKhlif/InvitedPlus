'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, eventsService, tasksService, chatService, pollsService } from '@/lib/services';
import { notificationsService, NotificationType, NotificationPriority } from '@/lib/services/notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/lib/hooks/usePermissions';
import TaskStats from '@/components/tasks/TaskStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import NotificationBell from '@/components/notifications/NotificationBell';
import { CalendarIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, UsersIcon, ChartBarIcon, CogIcon, TicketIcon, BeakerIcon, BellIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isVerified?: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    events: 0,
    tasks: 0,
    messages: 0,
    polls: 0,
    users: 0,
    attendees: 0,
    completedTasks: 0,
    pendingTasks: 0,
    pollsVoted: 0
  });
  const router = useRouter();
  const { isAdmin, isOrganizer, isGuest, canCreateEvent, canAccessAdmin } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await authService.getProfile();
        setUser(profileResponse.user);

        // Fetch role-based dashboard stats
        try {
          const statsResponse = await authService.getDashboardStats();
          if (statsResponse.success) {
            setStats(statsResponse.stats);
          }
        } catch (error) {
          console.warn('Failed to fetch dashboard stats:', error);
          // Fallback to individual service calls
          const [eventsResponse, tasksResponse, messagesResponse] = await Promise.all([
            eventsService.getEvents({ limit: 1 }),
            tasksService.getTasks({ limit: 1 }),
            chatService.getMessages({ limit: 1 })
          ]);

          setStats({
            events: eventsResponse.pagination.total,
            tasks: tasksResponse.pagination.total,
            messages: messagesResponse.pagination.total,
            polls: 0,
            users: 0,
            attendees: 0,
            completedTasks: 0,
            pendingTasks: 0,
            pollsVoted: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        authService.clearTokens();
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearTokens();
      router.push('/');
    }
  };

  const createTestNotifications = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        alert('❌ Please login first to create test notifications.');
        router.push('/auth/login');
        return;
      }

      const response = await notificationsService.createTestNotifications();
      alert(`✅ ${response.message || 'Test notifications created!'} Check the notification bell.`);

      // Refresh the page to update notification count
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to create test notifications:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error';
      alert(`❌ Failed to create test notifications: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">
                  {isAdmin() ? '👑' : isOrganizer() ? '🎯' : '👤'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {isAdmin() ? 'Admin Dashboard' : isOrganizer() ? 'Organizer Dashboard' : 'Dashboard'}
                  </h1>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <span>Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>!</span>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                      {user?.role || 'USER'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Test Notifications Button */}
              <button
                onClick={createTestNotifications}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                title="Create test notifications"
              >
                🧪 Test
              </button>

              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Email Verification Status Banner */}
      {user && !user.isVerified && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Email Verification Required
                  </p>
                  <p className="text-sm text-yellow-700">
                    Please verify your email to access all platform features and receive notifications.
                  </p>
                </div>
              </div>
              <Link
                href={`/auth/verify-code?email=${encodeURIComponent(user.email)}`}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Verify Email
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Events Card */}
            <div className="group relative bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {user?.role === 'ADMIN' ? 'Total Events' :
                         user?.role === 'ORGANIZER' ? 'My Events' : 'Events Attending'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">{stats.events}</p>
                    </div>
                  </div>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="ml-1">from last month</span>
                </div>
              </div>
            </div>

            {/* Tasks Card */}
            <div className="group relative bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {user?.role === 'ADMIN' ? 'Total Tasks' :
                         user?.role === 'ORGANIZER' ? 'Event Tasks' : 'My Tasks'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">{stats.tasks}</p>
                    </div>
                  </div>
                  <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="text-blue-600 font-medium">{stats.completedTasks}/{stats.tasks}</span>
                  <span className="ml-1">completed</span>
                </div>
              </div>
            </div>

            {/* Messages Card */}
            <div className="group relative bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Chat Messages
                      </p>
                      <p className="text-3xl font-bold text-gray-900">{stats.messages}</p>
                    </div>
                  </div>
                  <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="text-purple-600 font-medium">Active</span>
                  <span className="ml-1">conversations</span>
                </div>
              </div>
            </div>

            {/* Polls Card */}
            <div className="group relative bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <ChartBarIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {user?.role === 'ADMIN' ? 'Total Polls' :
                         user?.role === 'ORGANIZER' ? 'My Polls' : 'Polls Voted'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {user?.role === 'GUEST' ? stats.pollsVoted || 0 : stats.polls || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="text-orange-600 font-medium">Trending</span>
                  <span className="ml-1">this week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Quick Actions Card */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-900">🚀 Quick Actions</h3>
                  <p className="text-sm text-gray-600 mt-1">Get started with common tasks</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {canCreateEvent() && (
                      <Link
                        href="/events/create"
                        className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
                      >
                        <CalendarIcon className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-blue-900">Create Event</span>
                      </Link>
                    )}
                    <Link
                      href="/tasks"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200"
                    >
                      <ClipboardDocumentListIcon className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-green-900">View Tasks</span>
                    </Link>
                    <Link
                      href="/chat"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
                    >
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-purple-900">Open Chat</span>
                    </Link>
                    <Link
                      href="/polls"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200"
                    >
                      <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-orange-900">View Polls</span>
                    </Link>
                    <Link
                      href="/notifications"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 border border-indigo-200"
                    >
                      <BellIcon className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-indigo-900">Notifications</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200"
                    >
                      <CogIcon className="h-8 w-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-900">Settings</span>
                    </Link>
                    <Link
                      href="/users"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl hover:from-teal-100 hover:to-teal-200 transition-all duration-200 border border-teal-200"
                    >
                      <UsersIcon className="h-8 w-8 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-teal-900">Users</span>
                    </Link>
                    <Link
                      href="/friends"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl hover:from-pink-100 hover:to-pink-200 transition-all duration-200 border border-pink-200"
                    >
                      <UserIcon className="h-8 w-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-pink-900">Friends</span>
                    </Link>
                    <Link
                      href="/private-chat"
                      className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200"
                    >
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-purple-900">Private Chat</span>
                    </Link>
                    {canAccessAdmin() && (
                      <Link
                        href="/admin"
                        className="group flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 border border-red-200"
                      >
                        <CogIcon className="h-8 w-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-red-900">Admin Panel</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Information Card */}
            <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <h3 className="text-lg font-semibold text-gray-900">👤 Your Role</h3>
                <p className="text-sm text-gray-600 mt-1">{user?.role}</p>
              </div>
              <div className="p-6">
                {isAdmin() && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">👑</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-900">Administrator Access</h4>
                        <p className="text-sm text-gray-600">Full platform control</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>User Management</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Analytics & Reports</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>System Settings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Content Moderation</span>
                      </div>
                    </div>
                  </div>
                )}
                {isOrganizer() && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">🎯</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">Organizer Access</h4>
                        <p className="text-sm text-gray-600">Event & team management</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Create Events</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Assign Tasks</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Create Polls</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Team Collaboration</span>
                      </div>
                    </div>
                  </div>
                )}
                {isGuest() && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">👤</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Guest Access</h4>
                        <p className="text-sm text-gray-600">Participate & engage</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Join Events</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Complete Tasks</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Participate in polls and chat</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>View event details and updates</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <TaskStats className="mb-8" />

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions {isAdmin() && '(Admin)'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                {/* Admin-only actions */}
                {canAccessAdmin() && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center"
                  >
                    <CogIcon className="h-5 w-5 mr-2" />
                    Admin Panel
                  </button>
                )}

                {/* Organizer and Admin actions */}
                {canCreateEvent() && (
                  <button
                    onClick={() => router.push('/events/create')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Create Event
                  </button>
                )}
                <button
                  onClick={() => router.push('/events')}
                  className="btn-primary flex items-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Events
                </button>
                <button
                  onClick={() => router.push('/tasks')}
                  className="btn-secondary flex items-center"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  Tasks
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className="btn-secondary flex items-center"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Chat
                </button>
                <button
                  onClick={() => router.push('/polls')}
                  className="btn-secondary flex items-center"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Polls
                </button>
                <button
                  onClick={() => router.push('/invite')}
                  className="btn-secondary flex items-center"
                >
                  <TicketIcon className="h-5 w-5 mr-2" />
                  Join Event
                </button>
                <button
                  onClick={() => router.push('/calendar')}
                  className="btn-secondary flex items-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="btn-secondary flex items-center"
                >
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="btn-secondary flex items-center"
                >
                  <CogIcon className="h-5 w-5 mr-2" />
                  Settings
                </button>
                <button
                  onClick={() => router.push('/test-roles')}
                  className="btn-outline flex items-center"
                >
                  <BeakerIcon className="h-5 w-5 mr-2" />
                  Test Roles
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <RecentActivity showRefresh={true} />
          </div>
        </div>
      </main>
    </div>
  );
}
