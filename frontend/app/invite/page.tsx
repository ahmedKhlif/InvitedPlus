'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { invitesService } from '@/lib/services';
import { CalendarIcon, MapPinIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<string>('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const router = useRouter();

  const handleLookupEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError('');
    setEvent(null);

    try {
      const response = await invitesService.getEventByInviteCode(inviteCode.trim());
      setEvent(response.event);
      setRsvpStatus(response.userRsvpStatus || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!event || !inviteCode) return;

    setRsvpLoading(true);
    setError('');

    try {
      await invitesService.rsvpToEvent(inviteCode, { status });
      setRsvpStatus(status);
      
      // Refresh event data to get updated attendee count
      const response = await invitesService.getEventByInviteCode(inviteCode);
      setEvent(response.event);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Join Event</h1>
          <p className="text-lg text-gray-600">
            Enter your invite code to view event details and RSVP
          </p>
        </div>

        {/* Invite Code Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form onSubmit={handleLookupEvent} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <div className="flex space-x-3">
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code (e.g., DEMO2024)"
                  className="flex-1 input"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !inviteCode.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Looking up...' : 'Find Event'}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Access */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Quick access to demo events:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInviteCode('DEMO2024')}
                className="btn-outline text-sm"
              >
                DEMO2024
              </button>
              <button
                onClick={() => setInviteCode('TEST-EVENT-001')}
                className="btn-outline text-sm"
              >
                TEST-EVENT-001
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Event Details */}
        {event && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {inviteCode}
                </span>
              </div>

              <p className="text-gray-600 mb-6">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm">{formatDate(event.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm">{event.location}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center text-gray-600">
                  <UsersIcon className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Attendees</p>
                    <p className="text-sm">
                      {event._count?.attendees || 0}
                      {event.maxAttendees && ` / ${event.maxAttendees}`} people
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Organized by</p>
                  <p>{event.organizer.name}</p>
                </div>
              </div>

              {/* RSVP Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">RSVP Status</h3>
                
                {rsvpStatus ? (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      rsvpStatus === 'ACCEPTED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rsvpStatus === 'ACCEPTED' ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Attending
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Not Attending
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-4">You haven't responded to this invitation yet.</p>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleRsvp('ACCEPTED')}
                    disabled={rsvpLoading}
                    className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                      rsvpStatus === 'ACCEPTED' ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
                  >
                    {rsvpLoading ? 'Updating...' : 'Accept Invitation'}
                  </button>
                  <button
                    onClick={() => handleRsvp('DECLINED')}
                    disabled={rsvpLoading}
                    className={`btn-outline disabled:opacity-50 disabled:cursor-not-allowed ${
                      rsvpStatus === 'DECLINED' ? 'border-red-300 text-red-700' : ''
                    }`}
                  >
                    {rsvpLoading ? 'Updating...' : 'Decline Invitation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
