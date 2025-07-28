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
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  UsersIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt: string;
  profilePrivacy: string;
}

interface FriendRequest {
  id: string;
  message?: string;
  createdAt: string;
  sender: Friend;
  receiver: Friend;
}

export default function FriendsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      if (response.data.success) {
        setFriends(response.data.friends);
      }
    } catch (error: any) {
      console.error('Failed to fetch friends:', error);
      showError('Failed to load friends');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await api.get('/friends/requests?type=received');
      if (response.data.success) {
        setFriendRequests(response.data.requests);
      }
    } catch (error: any) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await api.get('/friends/requests?type=sent');
      if (response.data.success) {
        setSentRequests(response.data.requests);
      }
    } catch (error: any) {
      console.error('Failed to fetch sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const result = await api.patch(`/friends/request/${requestId}/respond`, { response });
      if (result.data.success) {
        showSuccess(`Friend request ${response}`);
        fetchFriendRequests();
        if (response === 'accepted') {
          fetchFriends();
        }
      }
    } catch (error: any) {
      showError(error.response?.data?.message || `Failed to ${response} friend request`);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const result = await api.delete(`/friends/${friendId}`);
      if (result.data.success) {
        showSuccess('Friend removed successfully');
        fetchFriends();
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to remove friend');
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

  const getOnlineStatus = (friend: Friend) => {
    if (friend.isOnline) {
      return { text: 'Online', color: 'text-green-600', dot: 'bg-green-500' };
    }

    if (!friend.lastSeenAt) {
      return { text: 'Offline', color: 'text-gray-600', dot: 'bg-gray-400' };
    }

    const lastSeen = new Date(friend.lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffMinutes < 5) {
      return { text: 'Just now', color: 'text-yellow-600', dot: 'bg-yellow-500' };
    } else if (diffMinutes < 60) {
      return { text: `${diffMinutes} min ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return { text: `${hours} hour${hours > 1 ? 's' : ''} ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return { text: `${days} day${days > 1 ? 's' : ''} ago`, color: 'text-gray-600', dot: 'bg-gray-400' };
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading friends...</p>
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
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
                <p className="text-gray-600">Manage your friends and friend requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/users')}
                variant="outline"
                className="flex items-center"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'friends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests ({friendRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sent ({sentRequests.length})
            </button>
          </nav>
        </div>

        {/* Search (only for friends tab) */}
        {activeTab === 'friends' && (
          <Card variant="elevated" className="backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <Input
                placeholder="Search friends by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </CardContent>
          </Card>
        )}

        {/* Content based on active tab */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFriends.map((friend) => {
              const status = getOnlineStatus(friend);
              return (
                <Card key={friend.id} variant="elevated" className="backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {getInitials(friend.name)}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.dot} rounded-full border-2 border-white`}></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                          <p className={`text-sm ${status.color}`}>{status.text}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFriend(friend.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/private-chat/${friend.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Message"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `mailto:${friend.email}`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/users/${friend.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <UserIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <Card key={request.id} variant="elevated" className="backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {request.sender.avatar ? (
                          <img
                            src={request.sender.avatar}
                            alt={request.sender.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(request.sender.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.sender.name}</h3>
                        <p className="text-sm text-gray-600">{request.sender.email}</p>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => respondToRequest(request.id, 'accepted')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => respondToRequest(request.id, 'declined')}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {friendRequests.length === 0 && (
              <Card variant="elevated" className="backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No friend requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any pending friend requests.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentRequests.map((request) => (
              <Card key={request.id} variant="elevated" className="backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {request.receiver.avatar ? (
                          <img
                            src={request.receiver.avatar}
                            alt={request.receiver.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(request.receiver.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.receiver.name}</h3>
                        <p className="text-sm text-gray-600">{request.receiver.email}</p>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 font-medium">Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sentRequests.length === 0 && (
              <Card variant="elevated" className="backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sent requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't sent any friend requests yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state for friends */}
        {activeTab === 'friends' && filteredFriends.length === 0 && (
          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search criteria.'
                  : 'Start building your network by finding and adding friends.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/users')}
                  className="mt-4"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
