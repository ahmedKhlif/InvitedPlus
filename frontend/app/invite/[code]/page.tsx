'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { invitesService } from '@/lib/services';
import { CalendarIcon, MapPinIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees?: number;
  organizer: {
    name: string;
    email: string;
  };
  _count: {
    attendees: number;
  };
}

export default function InvitePage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'accepted' | 'declined' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchEventByInviteCode = async () => {
      try {
        // Call the real API endpoint to get event by invite code
        console.log('Fetching event for invite code:', params.code);

        const response = await invitesService.getEventByInviteCode(params.code);

        if (response.success && response.event) {
          setEvent(response.event);
          console.log('Event loaded successfully:', response.event);
        } else {
          setError('Event not found');
        }
      } catch (error: any) {
        console.error('Failed to fetch event:', error);
        setError('Invalid invite code or event not found');
      } finally {
        setLoading(false);
      }
    };

    if (params.code) {
      fetchEventByInviteCode();
    }
  }, [params.code]);

  const handleRSVP = async (status: 'accepted' | 'declined') => {
    setSubmitting(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login with return URL
        router.push(`/auth/login?returnUrl=/invite/${params.code}`);
        return;
      }

      // Call the real API to submit RSVP
      const rsvpStatus = status === 'accepted' ? 'ACCEPTED' : 'DECLINED';
      console.log('Submitting RSVP:', rsvpStatus, 'for invite code:', params.code);

      const response = await invitesService.rsvpToEvent(params.code, { status: rsvpStatus });

      if (response.success) {
        setRsvpStatus(status);

        if (status === 'accepted') {
          alert('RSVP confirmed! You have successfully joined the event.');
          // Redirect to event details or dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          alert('RSVP declined. Thank you for letting us know.');
        }
      } else {
        alert(response.message || 'Failed to submit RSVP');
      }
    } catch (error: any) {
      console.error('Failed to RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invitation...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 text-lg font-medium mb-4">
            {error || 'Invitation not found'}
          </div>
          <p className="text-gray-600 mb-6">
            The invitation link may be invalid or expired.
          </p>
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (rsvpStatus === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            You have successfully joined <strong>{event.title}</strong>. 
            We look forward to seeing you there!
          </p>
          <div className="space-y-3">
            <Link href="/dashboard" className="block btn-primary">
              Go to Dashboard
            </Link>
            <Link href={`/events/${event.id}`} className="block btn-outline">
              View Event Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (rsvpStatus === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Declined</h2>
          <p className="text-gray-600 mb-6">
            Thank you for letting us know. We hope to see you at future events!
          </p>
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">You're Invited!</h1>
            <p className="text-blue-100">
              {event.organizer.name} has invited you to join an event
            </p>
          </div>

          {/* Event Details */}
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
            
            <p className="text-gray-600 mb-6">{event.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">Start</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.startDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">End</p>
                      <p className="text-gray-600 text-sm">{formatDate(event.endDate)}</p>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-gray-900 font-medium">Location</p>
                        <p className="text-gray-600 text-sm">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Attendance</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-900 font-medium">Current Attendees</p>
                      <p className="text-gray-600 text-sm">
                        {event._count.attendees} people attending
                        {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-white">
                        {event.organizer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Organized by</p>
                      <p className="text-gray-600 text-sm">{event.organizer.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RSVP Actions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Will you attend?</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleRSVP('accepted')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Yes, I\'ll attend'}
                </button>
                <button
                  onClick={() => handleRSVP('declined')}
                  disabled={submitting}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Can\'t make it'}
                </button>
              </div>
              
              <p className="text-gray-500 text-sm mt-4 text-center">
                Don't have an account? You'll be prompted to create one after accepting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
