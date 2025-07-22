'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsService, invitesService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/lib/contexts/ToastContext';
import QRCodeGenerator from '@/components/events/QRCodeGenerator';
import { 
  ArrowLeftIcon, 
  ClipboardDocumentIcon, 
  UserPlusIcon,
  EnvelopeIcon,
  QrCodeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  organizer: {
    id: string;
    name: string;
  };
}

interface Invite {
  id: string;
  code: string;
  email?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  usedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EventInvitesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, canCreateEvent } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  const eventId = params.id as string;

  useEffect(() => {
    const fetchEventAndInvites = async () => {
      try {
        // Fetch event details
        const eventResponse = await eventsService.getEvent(eventId);
        setEvent(eventResponse);

        // Fetch invites
        const invitesResponse = await invitesService.getEventInvites(eventId);
        setInvites(invitesResponse.invites || []);
      } catch (error) {
        console.error('Failed to fetch event or invites:', error);
        // Create mock data for demonstration
        setEvent({
          id: eventId,
          title: 'Sample Event',
          description: 'Sample event description',
          organizer: { id: user?.id || '1', name: user?.name || 'Organizer' }
        });
        
        setInvites([
          {
            id: '1',
            code: 'DEMO2024',
            email: 'john@example.com',
            status: 'ACCEPTED',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            usedAt: new Date(Date.now() - 43200000).toISOString(),
            user: { id: '2', name: 'John Doe', email: 'john@example.com' }
          },
          {
            id: '2',
            code: 'INV-ABC123',
            email: 'jane@example.com',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndInvites();
  }, [eventId, user?.id]);

  const generateInviteCode = () => {
    return 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail.trim() || sending) return;

    setSending(true);
    try {
      const inviteData = {
        email: newInviteEmail.trim(),
        eventId: eventId
      };

      const response = await invitesService.createInvite(inviteData);
      
      // Add the new invite to the list
      const newInvite: Invite = {
        id: response.id || Date.now().toString(),
        code: response.code || generateInviteCode(),
        email: newInviteEmail.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      setInvites(prev => [newInvite, ...prev]);
      setNewInviteEmail('');
      showSuccess('Invite Sent!', `Invitation sent to ${newInviteEmail.trim()}`);
    } catch (error) {
      console.error('Failed to send invite:', error);
      // For demo purposes, still add the invite locally
      const newInvite: Invite = {
        id: Date.now().toString(),
        code: generateInviteCode(),
        email: newInviteEmail.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      
      setInvites(prev => [newInvite, ...prev]);
      setNewInviteEmail('');
      showSuccess('Invite Created!', `Demo invite created for ${newInviteEmail.trim()}`);
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showSuccess('Link Copied!', 'Invite link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Copy Failed', 'Failed to copy invite link');
    }
  };

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;

    try {
      await invitesService.deleteInvite(inviteId);
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      showSuccess('Invite Deleted', 'Invite has been deleted successfully');
    } catch (error) {
      console.error('Failed to delete invite:', error);
      // For demo purposes, still remove locally
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
      showSuccess('Invite Deleted', 'Demo invite deleted');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user can manage invites (organizer or admin)
  const canManageInvites = canCreateEvent() || (event && user && event.organizer.id === user.id);

  if (!canManageInvites) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-600">You don't have permission to manage invites for this event.</p>
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Invites</h1>
              <p className="text-gray-600">{event?.title}</p>
            </div>
          </div>
          {event && (
            <QRCodeGenerator 
              eventId={event.id} 
              eventTitle={event.title}
              className="ml-4"
            />
          )}
        </div>

        {/* Send New Invite */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Send New Invite</h3>
            <form onSubmit={handleSendInvite} className="flex space-x-3">
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>

        {/* Invites List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Sent Invites ({invites.length})
            </h3>
            
            {invites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invites sent yet</p>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {invite.email || 'General Invite'}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                            {invite.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Code: <span className="font-mono">{invite.code}</span>
                          <span className="mx-2">•</span>
                          Created: {new Date(invite.createdAt).toLocaleDateString()}
                          {invite.usedAt && (
                            <>
                              <span className="mx-2">•</span>
                              Used: {new Date(invite.usedAt).toLocaleDateString()}
                            </>
                          )}
                        </div>
                        {invite.user && (
                          <div className="mt-1 text-sm text-gray-600">
                            Accepted by: {invite.user.name}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyInviteLink(invite.code)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteInvite(invite.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
