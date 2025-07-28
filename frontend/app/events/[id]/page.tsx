'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import QRCodeGenerator from '@/components/events/QRCodeGenerator';
import { usePermissions, PermissionGate } from '@/lib/hooks/usePermissions';
import { CalendarIcon, UsersIcon, MapPinIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ImageGallery from '@/components/common/ImageGallery';
import { authService } from '@/lib/services';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees?: number;
  inviteCode: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  category?: string;
  tags?: string;
  imageUrl?: string;
  images?: string[];
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  attendees: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    status: string;
    joinedAt: string;
  }>;
}

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Fetch current user
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        // Fetch event
        const response = await api.get(`/events/${params.id}`);
        setEvent(response.data);
      } catch (error: any) {
        console.error('Failed to fetch event:', error);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteEvent = async () => {
    if (!event || !currentUser) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/events/${event.id}`);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Check if current user is the organizer or admin
  const canEditEvent = currentUser && event && (
    currentUser.id === event.organizer.id ||
    currentUser.role === 'ADMIN'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error || 'Event not found'}</div>
          <Link href="/events" className="btn-primary">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/events"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Events
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <PermissionGate resource="tasks" action="create">
                <Link
                  href={`/tasks?eventId=${event.id}`}
                  className="btn-primary flex items-center space-x-2"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span>Manage Tasks</span>
                </Link>
              </PermissionGate>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Event Details</h2>
              </div>
              <div className="px-6 py-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-900">{event.description}</p>
                  </div>

                  {/* Event Images */}
                  {((event.images && event.images.length > 0) || event.imageUrl) && (
                    <div>
                      <ImageGallery
                        images={event.images && event.images.length > 0 ? event.images : (event.imageUrl ? [event.imageUrl] : [])}
                        title="Event Images"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Start Date</h3>
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900">{formatDate(event.startDate)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">End Date</h3>
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900">{formatDate(event.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900">{event.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Category and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {event.category && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {event.tags && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {event.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Organizer</h3>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-white">
                          {event.organizer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{event.organizer.name}</p>
                        <p className="text-gray-500 text-sm">{event.organizer.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Invite Code</h3>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {event.inviteCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(event.inviteCode);
                          alert('Invite code copied to clipboard!');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Attendees</h2>
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">
                      {event.attendees.length}
                      {event.maxAttendees && ` / ${event.maxAttendees}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                {event.attendees.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No attendees yet</p>
                ) : (
                  <div className="space-y-4">
                    {event.attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center">
                        <div className="relative mr-3">
                          {(attendee.user as any).avatar ? (
                            <img
                              src={`http://localhost:3001${(attendee.user as any).avatar}`}
                              alt={attendee.user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {attendee.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{attendee.user.name}</p>
                          <p className="text-gray-500 text-sm">{attendee.user.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(attendee.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="px-6 py-6 space-y-3">
                {/* Edit and Delete buttons for organizers/admins */}
                {canEditEvent && (
                  <>
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit Event</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleDeleteEvent}
                      disabled={deleteLoading}
                      className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <TrashIcon className="h-4 w-4" />
                        <span>{deleteLoading ? 'Deleting...' : 'Delete Event'}</span>
                      </div>
                    </button>
                  </>
                )}

                <PermissionGate resource="tasks" action="create">
                  <Link
                    href={`/tasks?eventId=${event.id}`}
                    className="block w-full btn-primary text-center"
                  >
                    Manage Tasks
                  </Link>
                </PermissionGate>
                <PermissionGate resource="tasks" action="read">
                  <Link
                    href={`/tasks/board?eventId=${event.id}`}
                    className="block w-full btn-outline text-center"
                  >
                    Task Board
                  </Link>
                </PermissionGate>
                <Link
                  href={`/events/${event.id}/chat`}
                  className="block w-full btn-outline text-center"
                >
                  Event Chat
                </Link>
                <Link
                  href={`/events/${event.id}/whiteboard`}
                  className="block w-full btn-outline text-center"
                >
                  Whiteboard
                </Link>
                <PermissionGate resource="events" action="create">
                  <Link
                    href={`/events/${event.id}/invites`}
                    className="block w-full btn-outline text-center"
                  >
                    Manage Invites
                  </Link>
                </PermissionGate>
                <QRCodeGenerator
                  eventId={event.id}
                  eventTitle={event.title}
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
