'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/services';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  type: 'MESSAGE' | 'POLL' | 'ANNOUNCEMENT';
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  event: {
    id: string;
    title: string;
  };
  createdAt: string;
  isReported: boolean;
  reportCount: number;
}

interface ChatStats {
  totalMessages: number;
  reportedMessages: number;
  activeChats: number;
  totalPolls: number;
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reportedFilter, setReportedFilter] = useState('all');
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const fetchMessages = async () => {
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

      // Use the regular chat messages endpoint to get all messages
      const messagesResponse = await api.get('/chat/messages', {
        params: { limit: 100 } // Get more messages for admin view
      });

      // Transform the data to match our interface
      const transformedMessages = messagesResponse.data.messages?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        type: msg.type || 'MESSAGE',
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          email: msg.sender.email,
          role: 'GUEST' // Default role since it's not in the response
        },
        event: msg.event || { id: 'global', title: 'Global Chat' },
        createdAt: msg.createdAt,
        isReported: false, // This would need to be added to the backend
        reportCount: 0
      })) || [];

      // Calculate basic stats from the messages
      const calculatedStats = {
        totalMessages: transformedMessages.length,
        reportedMessages: transformedMessages.filter((msg: any) => msg.isReported).length,
        activeChats: new Set(transformedMessages.map((msg: any) => msg.event?.id || 'global')).size,
        totalPolls: transformedMessages.filter((msg: any) => msg.type === 'POLL').length
      };

      setMessages(transformedMessages);
      setStats(calculatedStats);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      showError('Failed to load messages. Please try again.');
      setMessages([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Note: Delete functionality would need to be implemented in the backend
    showError('Message deletion is not yet implemented in the backend API');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MESSAGE': return 'text-blue-600 bg-blue-100';
      case 'POLL': return 'text-purple-600 bg-purple-100';
      case 'ANNOUNCEMENT': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-600 bg-red-100';
      case 'ORGANIZER': return 'text-blue-600 bg-blue-100';
      case 'GUEST': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    const matchesReported = reportedFilter === 'all' || 
                           (reportedFilter === 'reported' && message.isReported) ||
                           (reportedFilter === 'clean' && !message.isReported);
    
    return matchesSearch && matchesType && matchesReported;
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
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
                  <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Chat & Messages
                </h1>
                <p className="text-gray-600">Moderate communications and manage content</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Reported</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.reportedMessages}</p>
                    <p className="text-sm text-gray-600">Need attention</p>
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
                    <p className="text-sm font-medium text-gray-500">Active Chats</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
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
                    <p className="text-sm font-medium text-gray-500">Total Polls</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPolls}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card variant="elevated" className="backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="MESSAGE">Messages</option>
                  <option value="POLL">Polls</option>
                  <option value="ANNOUNCEMENT">Announcements</option>
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={reportedFilter}
                  onChange={(e) => setReportedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Messages</option>
                  <option value="reported">Reported Only</option>
                  <option value="clean">Clean Only</option>
                </select>
              </div>
              <Button
                onClick={fetchMessages}
                className="flex items-center"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Messages ({filteredMessages.length})</CardTitle>
            <CardDescription>Monitor and moderate platform communications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No messages match your current filters.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(message.type)}`}>
                            {message.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(message.sender.role)}`}>
                            {message.sender.role}
                          </span>
                          {message.isReported && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                              REPORTED ({message.reportCount})
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-900 mb-3 font-medium">{message.content}</p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>{message.sender.name}</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>{message.event.title}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{new Date(message.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => router.push(`/events/${message.event.id}/chat`)}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Chat
                        </Button>

                        <Button
                          onClick={() => handleDeleteMessage(message.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
