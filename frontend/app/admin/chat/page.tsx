'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import { authService } from '@/lib/services';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const fetchMessages = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Mock data for demonstration
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Welcome to the team meeting chat!',
          timestamp: new Date().toISOString(),
          user: { id: '1', name: 'Admin User', email: 'admin@test.com' },
          event: { id: '1', title: 'Team Meeting' }
        },
        {
          id: '2',
          content: 'Looking forward to discussing the project updates.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: { id: '2', name: 'Organizer User', email: 'organizer@test.com' },
          event: { id: '1', title: 'Team Meeting' }
        },
        {
          id: '3',
          content: 'Can someone share the agenda?',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: { id: '3', name: 'Guest User', email: 'guest@test.com' },
          event: { id: '1', title: 'Team Meeting' }
        },
        {
          id: '4',
          content: 'Great workshop today, thanks everyone!',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: { id: '2', name: 'Organizer User', email: 'organizer@test.com' },
          event: { id: '2', title: 'Workshop' }
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      // Simulate API call
      setMessages(messages.filter(msg => msg.id !== messageId));
      alert('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
  };

  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter(msg => msg.event.id === filter);

  if (loading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Chat & Messages</h1>
            </div>

            {/* Filter */}
            <div className="mb-6">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Messages</option>
                <option value="1">Team Meeting</option>
                <option value="2">Workshop</option>
              </select>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{messages.length}</div>
                <div className="text-sm text-gray-500">Total Messages</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{new Set(messages.map(m => m.user.id)).size}</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{new Set(messages.map(m => m.event.id)).size}</div>
                <div className="text-sm text-gray-500">Events with Chat</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {messages.filter(m => new Date(m.timestamp) > new Date(Date.now() - 86400000)).length}
                </div>
                <div className="text-sm text-gray-500">Messages Today</div>
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredMessages.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No messages found
                  </li>
                ) : (
                  filteredMessages.map((message) => (
                    <li key={message.id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">{message.user.name}</h3>
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {message.event.title}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span>{message.user.email}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(message.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/events/${message.event.id}`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            View Event
                          </button>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
