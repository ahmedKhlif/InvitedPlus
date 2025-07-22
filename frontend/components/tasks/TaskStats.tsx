'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface TaskStats {
  total: number;
  byStatus: {
    TODO?: number;
    IN_PROGRESS?: number;
    COMPLETED?: number;
    CANCELLED?: number;
  };
  byPriority: {
    LOW?: number;
    MEDIUM?: number;
    HIGH?: number;
    URGENT?: number;
  };
  overdue: number;
}

interface TaskStatsProps {
  eventId?: string;
  className?: string;
}

export default function TaskStats({ eventId, className = '' }: TaskStatsProps) {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      let url = '/tasks';
      if (eventId) {
        url = `/tasks/stats/${eventId}`;
      } else {
        // Get all tasks and calculate stats
        const response = await api.get('/tasks?limit=1000');
        const tasks = response.data.tasks;
        
        const calculatedStats: TaskStats = {
          total: tasks.length,
          byStatus: {},
          byPriority: {},
          overdue: 0
        };

        // Calculate status counts
        tasks.forEach((task: any) => {
          const status = task.status as keyof typeof calculatedStats.byStatus;
          const priority = task.priority as keyof typeof calculatedStats.byPriority;

          if (status in calculatedStats.byStatus) {
            calculatedStats.byStatus[status] = (calculatedStats.byStatus[status] || 0) + 1;
          }
          if (priority in calculatedStats.byPriority) {
            calculatedStats.byPriority[priority] = (calculatedStats.byPriority[priority] || 0) + 1;
          }
          
          if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED') {
            calculatedStats.overdue++;
          }
        });

        setStats(calculatedStats);
        setLoading(false);
        return;
      }

      const response = await api.get(url);
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch task statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-red-600 text-center">
          {error || 'Failed to load statistics'}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Completed',
      value: stats.byStatus.COMPLETED || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'In Progress',
      value: stats.byStatus.IN_PROGRESS || 0,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Task Statistics</h3>
        
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.color} mb-2`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">By Status</h4>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">By Priority</h4>
            <div className="space-y-2">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className={`text-sm ${
                    priority === 'URGENT' ? 'text-red-600' :
                    priority === 'HIGH' ? 'text-orange-600' :
                    priority === 'MEDIUM' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {priority}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
