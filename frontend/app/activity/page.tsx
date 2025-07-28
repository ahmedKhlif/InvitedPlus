'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  ArrowLeftIcon,
  FunnelIcon
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

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    fetchActivities();
  }, [filter, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');

      if (!authService.isAuthenticated()) {
        setError('Please login to see activity');
        return;
      }

      const response = await authService.getRecentActivity(50);

      if (response.success) {
        if (page === 1) {
          setActivities(response.activities);
        } else {
          setActivities(prev => [...prev, ...response.activities]);
        }
        setHasMore(response.activities.length === 50);
      } else {
        setError('Failed to load activity');
      }
    } catch (error: any) {
      console.error('Error fetching activity:', error);
      setError('Failed to load activity');
      
      // Fallback to mock data for demo
      setActivities(getMockActivities());
    } finally {
      setLoading(false);
    }
  };

  const getMockActivities = (): ActivityItem[] => [
    {
      id: '1',
      type: 'event',
      action: 'created',
      description: 'Created new event',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: 'John Doe' },
      relatedEntity: { id: '1', name: 'Team Building Workshop', href: '/events/1' }
    },
    {
      id: '2',
      type: 'task',
      action: 'completed',
      description: 'Completed task',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Jane Smith' },
      relatedEntity: { id: '1', name: 'Book venue', href: '/tasks/1' }
    },
    {
      id: '3',
      type: 'message',
      action: 'sent',
      description: 'Sent a message in',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Mike Johnson' },
      relatedEntity: { id: '1', name: 'General Chat', href: '/chat' }
    },
    {
      id: '4',
      type: 'poll',
      action: 'voted',
      description: 'Voted on poll',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Sarah Wilson' },
      relatedEntity: { id: '1', name: 'Lunch Options', href: '/polls/1' }
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event': return CalendarIcon;
      case 'task': return ClipboardDocumentListIcon;
      case 'message': return ChatBubbleLeftRightIcon;
      case 'poll': return ChartBarIcon;
      case 'user': return UserIcon;
      default: return ClockIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-500 text-white';
      case 'task': return 'bg-green-500 text-white';
      case 'message': return 'bg-purple-500 text-white';
      case 'poll': return 'bg-orange-500 text-white';
      case 'user': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Recent Activity</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View all platform activity and updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'event', label: 'Events' },
                { key: 'task', label: 'Tasks' },
                { key: 'message', label: 'Messages' },
                { key: 'poll', label: 'Polls' },
                { key: 'user', label: 'Users' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {loading && activities.length === 0 ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading activity</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={() => fetchActivities()}
                  className="mt-4 btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'Start by creating an event or task to see activity here.'
                    : `No ${filter} activity found. Try a different filter.`
                  }
                </p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {filteredActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClasses = getActivityColor(activity.type);
                    
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {index !== filteredActivities.length - 1 && (
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
                                <time dateTime={activity.timestamp}>
                                  {formatTimestamp(activity.timestamp)}
                                </time>
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

            {/* Load More */}
            {hasMore && filteredActivities.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="btn-outline"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
