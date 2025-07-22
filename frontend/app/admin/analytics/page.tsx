'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AnalyticsCharts from '@/components/charts/AnalyticsCharts';
import { authService } from '@/lib/services';

interface AnalyticsData {
  userGrowth: {
    date: string;
    newUsers: number;
  }[];
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        setAnalytics(data.analytics || data);
      } else {
        console.error('Failed to fetch analytics:', response.status);
        // Set mock data for demonstration
        setAnalytics({
          userGrowth: [
            { month: 'Jan', users: 12 },
            { month: 'Feb', users: 18 },
            { month: 'Mar', users: 25 },
          ],
          eventStats: {
            totalEvents: 45,
            activeEvents: 12,
            completedEvents: 33,
            averageAttendees: 8.5,
          },
          taskStats: {
            totalTasks: 156,
            completedTasks: 98,
            inProgressTasks: 35,
            completionRate: 62.8,
          },
          engagementStats: {
            totalMessages: 1247,
            totalPolls: 23,
            activeUsers: 89,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set fallback data on error
      setAnalytics({
        userGrowth: [],
        eventStats: {
          totalEvents: 0,
          activeEvents: 0,
          completedEvents: 0,
          averageAttendees: 0,
        },
        taskStats: {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          completionRate: 0,
        },
        engagementStats: {
          totalMessages: 0,
          totalPolls: 0,
          activeUsers: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading || !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          {!mounted && <p className="mt-4 text-gray-600">Initializing...</p>}
          {mounted && loading && <p className="mt-4 text-gray-600">Loading analytics...</p>}
          {mounted && !loading && !analytics && <p className="mt-4 text-gray-600">No analytics data available</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
          {analytics && (
            <div className="space-y-8">
              {/* Event Statistics */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Event Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics?.eventMetrics?.totalEvents || 0}</div>
                      <div className="text-sm text-gray-500">Total Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics?.eventMetrics?.activeEvents || 0}</div>
                      <div className="text-sm text-gray-500">Active Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics?.eventMetrics?.completedEvents || 0}</div>
                      <div className="text-sm text-gray-500">Completed Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics?.eventMetrics?.averageAttendees || 0}</div>
                      <div className="text-sm text-gray-500">Avg. Attendees</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Task Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics?.taskMetrics?.totalTasks || 0}</div>
                      <div className="text-sm text-gray-500">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics?.taskMetrics?.completedTasks || 0}</div>
                      <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics?.taskMetrics?.inProgressTasks || 0}</div>
                      <div className="text-sm text-gray-500">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics?.taskMetrics?.completionRate || 0}%</div>
                      <div className="text-sm text-gray-500">Completion Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Statistics */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Engagement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics?.engagementMetrics?.totalMessages || 0}</div>
                      <div className="text-sm text-gray-500">Messages Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics?.engagementMetrics?.totalPolls || 0}</div>
                      <div className="text-sm text-gray-500">Polls Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics?.engagementMetrics?.totalRsvps || 0}</div>
                      <div className="text-sm text-gray-500">RSVPs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics?.userGrowth?.length || 0}</div>
                      <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <AnalyticsCharts analytics={analytics} />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
