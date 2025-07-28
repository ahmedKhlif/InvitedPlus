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
  CalendarIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    attendees: number;
    tasks: number;
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    upcoming: 0
  });
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const fetchEvents = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      // Check admin access
      const profileResponse = await authService.getProfile();
      if (!profileResponse.success || profileResponse.user.role !== 'ADMIN') {
        showError('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      const response = await api.get(`/admin/events?${params.toString()}`);
      const eventsData = response.data.events || [];
      setEvents(eventsData);

      // Calculate stats
      const now = new Date();
      const total = eventsData.length;
      const active = eventsData.filter((e: Event) =>
        new Date(e.startDate) <= now && new Date(e.endDate) >= now
      ).length;
      const completed = eventsData.filter((e: Event) =>
        new Date(e.endDate) < now
      ).length;
      const upcoming = eventsData.filter((e: Event) =>
        new Date(e.startDate) > now
      ).length;

      setStats({ total, active, completed, upcoming });
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      showError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/events/${eventId}`);
      showSuccess('Event deleted successfully!');
      fetchEvents();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
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
                  <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
                  Event Management
                </h1>
                <p className="text-gray-600">Oversee and manage all platform events</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card variant="elevated" className="backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Events ({events.length})</CardTitle>
            <CardDescription>Manage and oversee all platform events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No events match your search criteria.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {events.map((event) => (
                  <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            new Date(event.endDate) < new Date() ? 'bg-gray-100 text-gray-800' :
                            new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {new Date(event.endDate) < new Date() ? 'Completed' :
                             new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? 'Active' :
                             'Upcoming'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-500">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>Organizer: {event.organizer.name}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>{event._count.attendees} attendees</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                            <span>{event._count.tasks} tasks</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => router.push(`/events/${event.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        <Button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
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
