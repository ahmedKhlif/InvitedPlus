'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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

interface RecentActivityProps {
  activities?: ActivityItem[];
  limit?: number;
}

export default function RecentActivity({ activities = [], limit = 10 }: RecentActivityProps) {
  const [loading, setLoading] = useState(true);
  const [realActivities, setRealActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError('');

        if (!authService.isAuthenticated()) {
          setError('Please login to see recent activity');
          return;
        }

        const response = await authService.getRecentActivity(limit);

        if (response.success) {
          setRealActivities(response.activities);
        } else {
          setError('Failed to load recent activity');
        }
      } catch (error: any) {
        console.error('Error fetching recent activity:', error);
        setError('Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [limit]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event':
        return CalendarIcon;
      case 'task':
        return ClipboardDocumentListIcon;
      case 'message':
        return ChatBubbleLeftRightIcon;
      case 'poll':
        return ChartBarIcon;
      case 'user':
        return UserIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'text-blue-600 bg-blue-100';
      case 'task':
        return 'text-green-600 bg-green-100';
      case 'message':
        return 'text-purple-600 bg-purple-100';
      case 'poll':
        return 'text-orange-600 bg-orange-100';
      case 'user':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Mock data if no activities provided
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'event',
      action: 'created',
      description: 'Created new event "Team Building Workshop"',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: 'John Doe' },
      relatedEntity: { id: '1', name: 'Team Building Workshop', href: '/events/1' }
    },
    {
      id: '2',
      type: 'task',
      action: 'completed',
      description: 'Completed task "Book venue"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Jane Smith' },
      relatedEntity: { id: '1', name: 'Book venue', href: '/tasks/1' }
    },
    {
      id: '3',
      type: 'message',
      action: 'sent',
      description: 'Sent message in "General Discussion"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Mike Johnson' },
      relatedEntity: { id: '1', name: 'General Discussion', href: '/chat/1' }
    },
    {
      id: '4',
      type: 'poll',
      action: 'voted',
      description: 'Voted on "Preferred meeting time"',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Sarah Wilson' },
      relatedEntity: { id: '1', name: 'Preferred meeting time', href: '/polls/1' }
    },
    {
      id: '5',
      type: 'user',
      action: 'joined',
      description: 'Joined the platform',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Alex Brown' }
    }
  ];

  // Use real activities if available, otherwise use passed activities, fallback to mock
  const displayActivities = realActivities.length > 0 ? realActivities : (activities.length > 0 ? activities : mockActivities);
  const limitedActivities = displayActivities.slice(0, limit);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          <Link href="/activity" className="text-sm text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        
        {error ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading activity</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        ) : limitedActivities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by creating an event or task to see activity here.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {limitedActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.type);
                
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== limitedActivities.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClasses}`}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.user && (
                                <span className="font-medium text-gray-900">
                                  {activity.user.name}
                                </span>
                              )}{' '}
                              {activity.description}
                              {activity.relatedEntity && (
                                <>
                                  {' '}
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
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
