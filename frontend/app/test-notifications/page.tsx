'use client';

import { useState } from 'react';
import { notificationsService, NotificationType, NotificationPriority } from '@/lib/services/notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { BellIcon } from '@heroicons/react/24/outline';

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const { showToast } = useNotifications();

  const testUserJoinedEvent = async () => {
    setIsLoading(true);
    try {
      // This would normally be triggered automatically when a user joins an event
      const response = await notificationsService.triggerUserJoinedEvent(
        'event-id-123', // Replace with actual event ID
        'user-id-456'   // Replace with actual user ID
      );
      setResult('✅ User joined event notification sent!');
      console.log('Notification created:', response);
    } catch (error) {
      setResult('❌ Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testTaskAssigned = async () => {
    setIsLoading(true);
    try {
      // This would normally be triggered automatically when a task is assigned
      const response = await notificationsService.triggerTaskAssigned(
        'task-id-123',     // Replace with actual task ID
        'assignee-id-456'  // Replace with actual assignee ID
      );
      setResult('✅ Task assigned notification sent!');
      console.log('Notification created:', response);
    } catch (error) {
      setResult('❌ Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testEventCreated = async () => {
    setIsLoading(true);
    try {
      // This would normally be triggered automatically when an event is created
      const response = await notificationsService.triggerEventCreated(
        'event-id-789' // Replace with actual event ID
      );
      setResult('✅ Event created notification sent to admins!');
      console.log('Notifications created:', response);
    } catch (error) {
      setResult('❌ Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testToastNotification = () => {
    showToast({
      id: `test-${Date.now()}`,
      title: 'Test Toast Notification',
      message: 'This is a test toast notification to demonstrate the UI!',
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      priority: NotificationPriority.NORMAL,
      isRead: false,
      userId: 'current-user',
      actionUrl: '/notifications',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setResult('✅ Toast notification displayed!');
  };

  const createTestNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsService.createTestNotifications();
      setResult(`Success: ${response.message} - Created ${response.count} notifications!`);
      console.log('Test notifications created:', response);
    } catch (error) {
      setResult('Error: Failed to create test notifications: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <BellIcon className="h-8 w-8 mr-3" />
            Notification System Test
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                How the Notification System Works
              </h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Event Notifications:</strong> When users join events, organizers get notified</li>
                <li>• <strong>Task Notifications:</strong> When tasks are assigned, assignees get notified</li>
                <li>• <strong>Admin Notifications:</strong> When events are created, admins get notified</li>
                <li>• <strong>Real-time UI:</strong> Notification bell shows unread count and dropdown</li>
                <li>• <strong>Toast Notifications:</strong> Pop-up notifications for immediate feedback</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role-Based Notification Tests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Role-Based Notification Tests
                </h3>
                
                <button
                  onClick={testUserJoinedEvent}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Test: User Joined Event'}
                </button>
                
                <button
                  onClick={testTaskAssigned}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Test: Task Assigned'}
                </button>
                
                <button
                  onClick={testEventCreated}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Test: Event Created (Admin)'}
                </button>
              </div>

              {/* User-Specific Tests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  User-Specific Tests
                </h3>

                <button
                  onClick={createTestNotifications}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Test Notifications for Me'}
                </button>
              </div>

              {/* UI Tests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  UI Component Tests
                </h3>

                <button
                  onClick={testToastNotification}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  Test: Toast Notification
                </button>
                
                <a
                  href="/notifications"
                  className="block w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-center"
                >
                  View Notifications Page
                </a>
                
                <div className="text-sm text-gray-600">
                  <p>• Click the bell icon in the navigation to see the notification dropdown</p>
                  <p>• Check the notifications page for full notification management</p>
                </div>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`p-4 rounded-lg ${
                result.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="font-medium">{result}</p>
              </div>
            )}

            {/* API Endpoints */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Available API Endpoints
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><code className="bg-gray-200 px-2 py-1 rounded">GET /api/notifications</code> - Get user notifications</p>
                <p><code className="bg-gray-200 px-2 py-1 rounded">GET /api/notifications/unread-count</code> - Get unread count</p>
                <p><code className="bg-gray-200 px-2 py-1 rounded">PATCH /api/notifications/:id/read</code> - Mark as read</p>
                <p><code className="bg-gray-200 px-2 py-1 rounded">PATCH /api/notifications/mark-all-read</code> - Mark all as read</p>
                <p><code className="bg-gray-200 px-2 py-1 rounded">DELETE /api/notifications/:id</code> - Delete notification</p>
              </div>
            </div>

            {/* Integration Points */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                🔗 Automatic Integration Points
              </h3>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• <strong>Events Service:</strong> Triggers notifications when users join events or events are created</p>
                <p>• <strong>Tasks Service:</strong> Triggers notifications when tasks are assigned to users</p>
                <p>• <strong>Frontend Components:</strong> Notification bell, dropdown, and toast system ready</p>
                <p>• <strong>Role-Based Logic:</strong> Organizers, assignees, and admins get relevant notifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
