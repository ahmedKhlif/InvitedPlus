'use client';

import ChartWrapper from './ChartWrapper';

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

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  // User Growth Line Chart
  const userGrowthData = {
    labels: analytics.userGrowth?.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'New Users',
        data: analytics.userGrowth?.map(item => item.newUsers) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Event Status Doughnut Chart
  const eventStatusData = {
    labels: ['Active Events', 'Completed Events'],
    datasets: [
      {
        data: [
          analytics.eventMetrics?.activeEvents || 0,
          analytics.eventMetrics?.completedEvents || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Task Progress Bar Chart
  const taskProgressData = {
    labels: ['Total Tasks', 'Completed', 'In Progress'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          analytics.taskMetrics?.totalTasks || 0,
          analytics.taskMetrics?.completedTasks || 0,
          analytics.taskMetrics?.inProgressTasks || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Engagement Metrics Bar Chart
  const engagementData = {
    labels: ['Messages', 'Polls', 'RSVPs'],
    datasets: [
      {
        label: 'Engagement Metrics',
        data: [
          analytics.engagementMetrics?.totalMessages || 0,
          analytics.engagementMetrics?.totalPolls || 0,
          analytics.engagementMetrics?.totalRsvps || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* User Growth Chart */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Growth Over Time</h3>
          <ChartWrapper
            type="line"
            data={userGrowthData}
            options={chartOptions}
            height={300}
            className="w-full"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Status Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Event Status Distribution</h3>
            <ChartWrapper
              type="doughnut"
              data={eventStatusData}
              options={chartOptions}
              height={250}
              className="w-full"
            />
          </div>
        </div>

        {/* Task Progress Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Task Progress</h3>
            <ChartWrapper
              type="bar"
              data={taskProgressData}
              options={chartOptions}
              height={250}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Engagement Chart */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Platform Engagement</h3>
          <ChartWrapper
            type="bar"
            data={engagementData}
            options={{
              ...chartOptions,
              indexAxis: 'y' as const,
            }}
            height={200}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
