'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, eventsService, tasksService, chatService, pollsService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';
import TaskStats from '@/components/tasks/TaskStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { CalendarIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, UsersIcon, ChartBarIcon, CogIcon, TicketIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
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
            polls: 0
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin() ? '👑 Admin Dashboard' : isOrganizer() ? '🎯 Organizer Dashboard' : '👤 Dashboard'}
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.name}!
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user?.role || 'USER'}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/profile"
                className="btn-outline"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="btn-outline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {user?.role === 'ADMIN' ? 'Total Events' :
                         user?.role === 'ORGANIZER' ? 'My Events' : 'Events Attending'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.events}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {user?.role === 'ADMIN' ? 'Total Tasks' :
                         user?.role === 'ORGANIZER' ? 'Event Tasks' : 'My Tasks'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.tasks}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {user?.role === 'ADMIN' ? 'Total Polls' :
                         user?.role === 'ORGANIZER' ? 'My Polls' : 'Polls Voted'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user?.role === 'GUEST' ? stats.pollsVoted || 0 : stats.polls || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {user?.role === 'ADMIN' ? 'Total Messages' :
                         user?.role === 'ORGANIZER' ? 'Event Messages' : 'My Messages'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.messages}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Role: {user?.role}
              </h3>
              <div className="text-sm text-gray-600">
                {isAdmin() && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900">👑 Administrator Access</h4>
                    <p>You have full access to all platform features including user management, analytics, and system settings.</p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>Manage all users and their roles</li>
                      <li>View platform analytics and reports</li>
                      <li>Access admin panel and system settings</li>
                      <li>Create, edit, and delete any content</li>
                    </ul>
                  </div>
                )}
                {isOrganizer() && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900">🎯 Organizer Access</h4>
                    <p>You can create and manage events, tasks, and polls. Perfect for event organizers and team leaders.</p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>Create and manage events</li>
                      <li>Assign tasks to team members</li>
                      <li>Create polls and surveys</li>
                      <li>Manage your organized content</li>
                    </ul>
                  </div>
                )}
                {isGuest() && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">👤 Guest Access</h4>
                    <p>You can participate in events, complete assigned tasks, and engage with the community.</p>
                    <ul className="mt-2 list-disc list-inside">
                      <li>Join events and RSVP</li>
                      <li>Complete assigned tasks</li>
                      <li>Participate in polls and chat</li>
                      <li>View event details and updates</li>
                    </ul>
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
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
