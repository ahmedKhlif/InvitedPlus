'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  partner: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function PrivateChatListPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/private-chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.partner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Private Chat</h1>
                <p className="text-gray-600">Your private conversations with friends</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/friends')}
                variant="outline"
                className="flex items-center"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                View Friends
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <Card variant="elevated" className="backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </CardContent>
        </Card>

        {/* Conversations List */}
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.partner.id}
              variant="elevated"
              className="backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/private-chat/${conversation.partner.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {conversation.partner.avatar ? (
                        <img
                          src={conversation.partner.avatar}
                          alt={conversation.partner.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(conversation.partner.name)}
                        </div>
                      )}
                      {conversation.partner.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{conversation.partner.name}</h3>
                        {conversation.partner.isOnline && (
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate max-w-md">
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search criteria.'
                  : 'Start chatting with your friends to see conversations here.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/friends')}
                  className="mt-4"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Friends
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
