'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AnalyticsCharts from '@/components/charts/AnalyticsCharts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  userGrowth: Array<{
    date: string;
    newUsers: number;
  }>;
  eventMetrics: {
    totalEvents: number;
    activeEvents: number;
    completedEvents: number;
    averageAttendees: number;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
  };
  engagementMetrics: {
    totalMessages: number;
    totalPolls: number;
    totalRsvps: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  // Helper functions to calculate metrics from the data
  const getTotalUsers = (userGrowth: AnalyticsData['userGrowth']) => {
    return userGrowth.reduce((total, day) => total + day.newUsers, 0);
  };

  const getUserGrowthRate = (userGrowth: AnalyticsData['userGrowth']) => {
    if (userGrowth.length < 2) return 0;
    const recent = userGrowth.slice(-7).reduce((sum, day) => sum + day.newUsers, 0);
    const previous = userGrowth.slice(-14, -7).reduce((sum, day) => sum + day.newUsers, 0);
    if (previous === 0) return 100;
    return ((recent - previous) / previous) * 100;
  };

  const fetchAnalytics = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Check admin access
      const profileResponse = await authService.getProfile();
      if (!profileResponse.success || profileResponse.user.role !== 'ADMIN') {
        showError('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      const response = await api.get(`/admin/analytics?timeRange=${timeRange}`);
      setAnalytics(response.data.analytics);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);

      // Fallback to mock data when API fails
      const mockAnalytics: AnalyticsData = {
        userGrowth: [
          { date: '2024-01-01', newUsers: 12 },
          { date: '2024-01-02', newUsers: 8 },
          { date: '2024-01-03', newUsers: 15 },
          { date: '2024-01-04', newUsers: 23 },
          { date: '2024-01-05', newUsers: 18 },
        ],
        eventMetrics: {
          totalEvents: 89,
          activeEvents: 12,
          completedEvents: 67,
          averageAttendees: 24
        },
        taskMetrics: {
          totalTasks: 342,
          completedTasks: 287,
          inProgressTasks: 55,
          completionRate: 84
        },
        engagementMetrics: {
          totalMessages: 5678,
          totalPolls: 234,
          totalRsvps: 1456
        }
      };

      setAnalytics(mockAnalytics);
      showError('Using demo data - API endpoint not available');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics/export?timeRange=${timeRange}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      showSuccess('Analytics data exported successfully!');
    } catch (error: any) {
      showError('Failed to export analytics data');
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
                href="/admin"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Admin
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">Platform insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button
                onClick={exportAnalytics}
                variant="outline"
                className="flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {analytics && (
          <>
            {/* Key Metrics */}
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
                      <p className="text-sm font-medium text-gray-500">New Users</p>
                      <p className="text-2xl font-bold text-gray-900">{getTotalUsers(analytics.userGrowth)}</p>
                      <div className="flex items-center mt-1">
                        {getUserGrowthRate(analytics.userGrowth) >= 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${getUserGrowthRate(analytics.userGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(Math.round(getUserGrowthRate(analytics.userGrowth)))}% growth
                        </span>
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
                      <p className="text-sm font-medium text-gray-500">Active Events</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.eventMetrics.activeEvents}</p>
                      <p className="text-sm text-gray-600">Avg {analytics.eventMetrics.averageAttendees} attendees</p>
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
                      <p className="text-sm font-medium text-gray-500">Task Completion</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.taskMetrics.completionRate}%</p>
                      <p className="text-sm text-gray-600">{analytics.taskMetrics.completedTasks} completed</p>
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
                      <p className="text-sm font-medium text-gray-500">Messages Sent</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.engagementMetrics.totalMessages}</p>
                      <p className="text-sm text-gray-600">{analytics.engagementMetrics.totalPolls} polls created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card variant="elevated" className="backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Task Management</CardTitle>
                  <CardDescription>Task completion and progress metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Total Tasks</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.taskMetrics.totalTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Completed Tasks</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.taskMetrics.completedTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">In Progress</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.taskMetrics.inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Completion Rate</span>
                      <span className="text-lg font-bold text-gray-900">{Math.round(analytics.taskMetrics.completionRate)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Event Performance</CardTitle>
                  <CardDescription>Event creation and attendance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Total Events</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.eventMetrics.totalEvents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Completed Events</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.eventMetrics.completedEvents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Average Attendance</span>
                      <span className="text-lg font-bold text-gray-900">{analytics.eventMetrics.averageAttendees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Success Rate</span>
                      <span className="text-lg font-bold text-gray-900">
                        {Math.round((analytics.eventMetrics.completedEvents / analytics.eventMetrics.totalEvents) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <AnalyticsCharts analytics={analytics} />
          </>
        )}
      </main>
    </div>
  );
}
