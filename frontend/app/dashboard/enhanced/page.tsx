'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainNavigation from '@/components/layout/MainNavigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { authService } from '@/lib/services';
import { 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  events: {
    total: number;
    upcoming: number;
    thisWeek: number;
    trend: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    trend: number;
  };
  messages: {
    total: number;
    unread: number;
    trend: number;
  };
  polls: {
    total: number;
    active: number;
    trend: number;
  };
}

export default function EnhancedDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    events: { total: 0, upcoming: 0, thisWeek: 0, trend: 0 },
    tasks: { total: 0, completed: 0, overdue: 0, trend: 0 },
    messages: { total: 0, unread: 0, trend: 0 },
    polls: { total: 0, active: 0, trend: 0 }
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // Mock stats - in real app, fetch from API
        setStats({
          events: { total: 12, upcoming: 5, thisWeek: 3, trend: 15.3 },
          tasks: { total: 28, completed: 18, overdue: 3, trend: -8.2 },
          messages: { total: 156, unread: 7, trend: 23.1 },
          polls: { total: 8, active: 2, trend: 12.5 }
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.name}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Here's what's happening with your events and tasks today.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/tasks/create"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                New Task
              </Link>
              <Link
                href="/events/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardWidget
            title="Events"
            value={stats.events.total}
            subtitle={`${stats.events.upcoming} upcoming`}
            icon={CalendarIcon}
            href="/events"
            color="blue"
            trend={{
              value: stats.events.trend,
              label: "vs last month",
              isPositive: stats.events.trend > 0
            }}
          />
          
          <DashboardWidget
            title="Tasks"
            value={stats.tasks.total}
            subtitle={`${stats.tasks.completed} completed`}
            icon={ClipboardDocumentListIcon}
            href="/tasks"
            color="green"
            trend={{
              value: Math.abs(stats.tasks.trend),
              label: "vs last month",
              isPositive: stats.tasks.trend > 0
            }}
          >
            {stats.tasks.overdue > 0 && (
              <div className="flex items-center text-sm text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {stats.tasks.overdue} overdue tasks
              </div>
            )}
          </DashboardWidget>
          
          <DashboardWidget
            title="Messages"
            value={stats.messages.total}
            subtitle={`${stats.messages.unread} unread`}
            icon={ChatBubbleLeftRightIcon}
            href="/chat"
            color="purple"
            trend={{
              value: stats.messages.trend,
              label: "vs last month",
              isPositive: stats.messages.trend > 0
            }}
          />
          
          <DashboardWidget
            title="Polls"
            value={stats.polls.total}
            subtitle={`${stats.polls.active} active`}
            icon={ChartBarIcon}
            href="/polls"
            color="orange"
            trend={{
              value: stats.polls.trend,
              label: "vs last month",
              isPositive: stats.polls.trend > 0
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity limit={8} />
          </div>

          {/* Quick Actions & Upcoming */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/events/create"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                  <Link
                    href="/tasks/create"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Add Task
                  </Link>
                  <Link
                    href="/polls/create"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Create Poll
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Events</h3>
                  <Link href="/events" className="text-sm text-indigo-600 hover:text-indigo-500">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {/* Mock upcoming events */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Team Building Workshop
                      </p>
                      <p className="text-sm text-gray-500">Tomorrow at 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Product Launch Meeting
                      </p>
                      <p className="text-sm text-gray-500">Friday at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="text-center py-2">
                    <Link
                      href="/events"
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      View all events →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
