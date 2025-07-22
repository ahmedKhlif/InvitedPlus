'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  overview: {
    totalEvents: number;
    totalAttendees: number;
    totalTasks: number;
    completionRate: number;
    trends: {
      events: number;
      attendees: number;
      tasks: number;
      completion: number;
    };
  };
  eventMetrics: {
    popularEvents: Array<{
      id: string;
      title: string;
      attendees: number;
      engagement: number;
    }>;
    attendanceByMonth: Array<{
      month: string;
      attendees: number;
      events: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  userEngagement: {
    activeUsers: number;
    averageSessionTime: string;
    topContributors: Array<{
      name: string;
      contributions: number;
      type: string;
    }>;
    engagementScore: number;
  };
  realTimeStats: {
    onlineUsers: number;
    activeEvents: number;
    recentActivity: Array<{
      action: string;
      user: string;
      timestamp: string;
    }>;
  };
}

interface AdvancedAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  className?: string;
}

export default function AdvancedAnalytics({ timeRange = '30d', className = '' }: AdvancedAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'events' | 'users' | 'engagement'>('events');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in real app, fetch from API
      const mockData: AnalyticsData = {
        overview: {
          totalEvents: 156,
          totalAttendees: 2847,
          totalTasks: 892,
          completionRate: 78.5,
          trends: {
            events: 12.5,
            attendees: 8.3,
            tasks: -2.1,
            completion: 5.7
          }
        },
        eventMetrics: {
          popularEvents: [
            { id: '1', title: 'Annual Tech Conference', attendees: 450, engagement: 92 },
            { id: '2', title: 'Team Building Workshop', attendees: 120, engagement: 88 },
            { id: '3', title: 'Product Launch Event', attendees: 380, engagement: 85 },
            { id: '4', title: 'Quarterly Review Meeting', attendees: 95, engagement: 76 },
            { id: '5', title: 'Holiday Party', attendees: 200, engagement: 94 }
          ],
          attendanceByMonth: [
            { month: 'Jan', attendees: 245, events: 12 },
            { month: 'Feb', attendees: 320, events: 15 },
            { month: 'Mar', attendees: 410, events: 18 },
            { month: 'Apr', attendees: 380, events: 16 },
            { month: 'May', attendees: 520, events: 22 },
            { month: 'Jun', attendees: 470, events: 20 }
          ],
          categoryBreakdown: [
            { category: 'Conference', count: 45, percentage: 28.8 },
            { category: 'Workshop', count: 38, percentage: 24.4 },
            { category: 'Meeting', count: 35, percentage: 22.4 },
            { category: 'Social', count: 25, percentage: 16.0 },
            { category: 'Training', count: 13, percentage: 8.3 }
          ]
        },
        userEngagement: {
          activeUsers: 1247,
          averageSessionTime: '24m 35s',
          topContributors: [
            { name: 'Sarah Johnson', contributions: 45, type: 'Events Created' },
            { name: 'Mike Chen', contributions: 38, type: 'Tasks Completed' },
            { name: 'Emily Davis', contributions: 32, type: 'Messages Sent' },
            { name: 'Alex Rodriguez', contributions: 28, type: 'Polls Created' },
            { name: 'Lisa Wang', contributions: 25, type: 'Events Attended' }
          ],
          engagementScore: 87.3
        },
        realTimeStats: {
          onlineUsers: 89,
          activeEvents: 12,
          recentActivity: [
            { action: 'Event created', user: 'John Doe', timestamp: '2 minutes ago' },
            { action: 'Task completed', user: 'Jane Smith', timestamp: '5 minutes ago' },
            { action: 'Poll voted', user: 'Mike Johnson', timestamp: '8 minutes ago' },
            { action: 'Message sent', user: 'Sarah Wilson', timestamp: '12 minutes ago' },
            { action: 'Event joined', user: 'Alex Brown', timestamp: '15 minutes ago' }
          ]
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (value: number) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500">Comprehensive insights into your platform performance</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => {/* Handle time range change */}}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.totalEvents}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            {formatTrend(data.overview.trends.events)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Attendees</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.totalAttendees.toLocaleString()}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            {formatTrend(data.overview.trends.attendees)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.totalTasks}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2">
            {formatTrend(data.overview.trends.tasks)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.completionRate}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2">
            {formatTrend(data.overview.trends.completion)}
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'events', label: 'Event Metrics', icon: CalendarIcon },
              { key: 'users', label: 'User Engagement', icon: UsersIcon },
              { key: 'engagement', label: 'Real-time Stats', icon: EyeIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedMetric === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Event Metrics */}
          {selectedMetric === 'events' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Events */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Events</h3>
                  <div className="space-y-3">
                    {data.eventMetrics.popularEvents.map((event, index) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            <div className="text-xs text-gray-500">{event.attendees} attendees</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{event.engagement}%</div>
                          <div className="text-xs text-gray-500">engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Event Categories</h3>
                  <div className="space-y-3">
                    {data.eventMetrics.categoryBreakdown.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">{category.category}</div>
                          <div className="text-xs text-gray-500">({category.count} events)</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{category.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Engagement */}
          {selectedMetric === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">{data.userEngagement.activeUsers}</div>
                  <div className="text-sm text-blue-700">Active Users</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">{data.userEngagement.averageSessionTime}</div>
                  <div className="text-sm text-green-700">Avg Session Time</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">{data.userEngagement.engagementScore}</div>
                  <div className="text-sm text-purple-700">Engagement Score</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Contributors</h3>
                <div className="space-y-3">
                  {data.userEngagement.topContributors.map((contributor, index) => (
                    <div key={contributor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contributor.name}</div>
                          <div className="text-xs text-gray-500">{contributor.type}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{contributor.contributions}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Stats */}
          {selectedMetric === 'engagement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <div className="text-2xl font-bold text-green-900">{data.realTimeStats.onlineUsers}</div>
                  </div>
                  <div className="text-sm text-green-700">Users Online Now</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">{data.realTimeStats.activeEvents}</div>
                  <div className="text-sm text-blue-700">Active Events</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {data.realTimeStats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">{activity.user}</span>
                        <span className="text-sm text-gray-600"> {activity.action}</span>
                      </div>
                      <div className="text-xs text-gray-500">{activity.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
