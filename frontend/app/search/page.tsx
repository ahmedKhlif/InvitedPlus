'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainNavigation from '@/components/layout/MainNavigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  type: 'event' | 'task' | 'user' | 'poll' | 'message';
  title: string;
  description: string;
  url: string;
  metadata: {
    createdAt: string;
    createdBy?: string;
    status?: string;
    priority?: string;
    category?: string;
  };
}

interface SearchFilters {
  type: string;
  dateRange: string;
  status: string;
  priority: string;
  category: string;
}

function SearchPageContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: 'all',
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Mock search results - in real app, make API call
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'event' as const,
          title: 'Team Building Workshop',
          description: 'Annual team building event with fun activities and team bonding exercises.',
          url: '/events/1',
          metadata: {
            createdAt: '2024-01-15T10:30:00Z',
            createdBy: 'John Doe',
            status: 'published',
            category: 'workshop'
          }
        },
        {
          id: '2',
          type: 'task' as const,
          title: 'Book venue for workshop',
          description: 'Find and book a suitable venue for the team building workshop.',
          url: '/tasks/2',
          metadata: {
            createdAt: '2024-01-10T14:20:00Z',
            createdBy: 'Jane Smith',
            status: 'in_progress',
            priority: 'high'
          }
        },
        {
          id: '3',
          type: 'user' as const,
          title: 'John Doe',
          description: 'Event Organizer - Passionate about creating memorable experiences.',
          url: '/users/3',
          metadata: {
            createdAt: '2024-01-01T00:00:00Z',
            status: 'active'
          }
        },
        {
          id: '4',
          type: 'poll' as const,
          title: 'Preferred workshop activities',
          description: 'Vote for your favorite team building activities.',
          url: '/polls/4',
          metadata: {
            createdAt: '2024-01-12T16:45:00Z',
            createdBy: 'Sarah Wilson',
            status: 'active'
          }
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'event':
        return CalendarIcon;
      case 'task':
        return ClipboardDocumentListIcon;
      case 'user':
        return UserIcon;
      case 'poll':
        return ChartBarIcon;
      case 'message':
        return ChatBubbleLeftRightIcon;
      default:
        return MagnifyingGlassIcon;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'text-blue-600 bg-blue-100';
      case 'task':
        return 'text-green-600 bg-green-100';
      case 'user':
        return 'text-purple-600 bg-purple-100';
      case 'poll':
        return 'text-orange-600 bg-orange-100';
      case 'message':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusColors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredResults = results.filter(result => {
    if (filters.type !== 'all' && result.type !== filters.type) return false;
    if (filters.status !== 'all' && result.metadata.status !== filters.status) return false;
    if (filters.priority !== 'all' && result.metadata.priority !== filters.priority) return false;
    if (filters.category !== 'all' && result.metadata.category !== filters.category) return false;
    return true;
  });

  const resultCounts = {
    all: results.length,
    event: results.filter(r => r.type === 'event').length,
    task: results.filter(r => r.type === 'task').length,
    user: results.filter(r => r.type === 'user').length,
    poll: results.filter(r => r.type === 'poll').length,
    message: results.filter(r => r.type === 'message').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Header with Back Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search</h1>
              <p className="mt-1 text-sm text-gray-500">
                Find events, tasks, users, polls, and more across the platform
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Search Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search for events, tasks, users, polls..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </form>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="all">All Types</option>
                      <option value="event">Events</option>
                      <option value="task">Tasks</option>
                      <option value="user">Users</option>
                      <option value="poll">Polls</option>
                      <option value="message">Messages</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="all">All Categories</option>
                      <option value="workshop">Workshop</option>
                      <option value="meeting">Meeting</option>
                      <option value="conference">Conference</option>
                      <option value="social">Social</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({
                        type: 'all',
                        dateRange: 'all',
                        status: 'all',
                        priority: 'all',
                        category: 'all'
                      })}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {query && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Search Results for "{query}"
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredResults.length} of {results.length} results
                  </span>
                </div>

                {/* Type Filter Tabs */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(resultCounts).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setFilters({ ...filters, type })}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        filters.type === type
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Results List */}
              {loading ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="text-center py-8">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search terms or filters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                  {filteredResults.map((result) => {
                    const Icon = getResultIcon(result.type);
                    const colorClasses = getResultColor(result.type);
                    
                    return (
                      <div key={result.id} className="p-6 hover:bg-gray-50">
                        <div className="flex space-x-3">
                          <div className={`flex-shrink-0 p-2 rounded-full ${colorClasses}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link
                                  href={result.url}
                                  className="text-lg font-medium text-gray-900 hover:text-indigo-600"
                                >
                                  {result.title}
                                </Link>
                                <p className="text-sm text-gray-600 mt-1">
                                  {result.description}
                                </p>
                                
                                <div className="flex items-center space-x-4 mt-3">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(result.metadata.createdAt)}
                                  </span>
                                  {result.metadata.createdBy && (
                                    <span className="text-xs text-gray-500">
                                      by {result.metadata.createdBy}
                                    </span>
                                  )}
                                  {result.metadata.status && (
                                    getStatusBadge(result.metadata.status, result.type)
                                  )}
                                  {result.metadata.priority && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      result.metadata.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      result.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {result.metadata.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                  {result.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
