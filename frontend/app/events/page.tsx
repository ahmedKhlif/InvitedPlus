'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsService, Event } from '@/lib/services';
import { usePermissions, PermissionGate } from '@/lib/hooks/usePermissions';
import { PlusIcon, CalendarIcon, UsersIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { canCreateEvent } = usePermissions();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsService.getEvents();
        setEvents(response.events || []);
      } catch (error: any) {
        console.error('Failed to fetch events:', error);
        setError('Failed to load events');
        if (error.response?.status === 401) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Events
                  </h1>
                  <p className="text-gray-600 text-sm">Discover and manage events</p>
                </div>
              </div>
            </div>
            <PermissionGate resource="events" action="create">
              <button
                onClick={() => router.push('/events/create')}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Event
              </button>
            </PermissionGate>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/events/create')}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Event</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="group relative bg-white/70 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status || 'DRAFT'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Code: {event.inviteCode}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      <span>
                        {event._count?.attendees || 0} attendee{(event._count?.attendees || 0) !== 1 ? 's' : ''}
                        {event.maxAttendees && ` / ${event.maxAttendees} max`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="flex-1 btn-outline text-center"
                    >
                      View Details
                    </Link>
                    <PermissionGate resource="tasks" action="create">
                      <Link
                        href={`/tasks?eventId=${event.id}`}
                        className="flex-1 btn-primary text-center"
                      >
                        Manage Tasks
                      </Link>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


    </div>
  );
}
