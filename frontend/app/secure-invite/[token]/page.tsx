'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/contexts/ToastContext';
import { authService } from '@/lib/services';
import api from '@/lib/api';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface SecureInvitation {
  id: string;
  token: string;
  email: string;
  expiresAt: string;
  isUsed: boolean;
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location?: string;
    imageUrl?: string;
    organizer: {
      name: string;
      email: string;
    };
  };
}

export default function SecureInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [invitation, setInvitation] = useState<SecureInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const token = params.token as string;

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invites/secure/${token}/verify`);
      setInvitation(response.data.invitation);
    } catch (error: any) {
      console.error('Failed to fetch invitation:', error);
      setError(error.response?.data?.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!currentUser) {
      showError('Please log in first', 'You need to be logged in to accept this invitation.');
      router.push(`/auth/login?redirect=/secure-invite/${token}`);
      return;
    }

    if (currentUser.email !== invitation?.email) {
      showError('Email Mismatch', `This invitation is for ${invitation?.email}. Please log in with the correct email address.`);
      return;
    }

    setAccepting(true);
    try {
      const response = await api.post(`/invites/secure/${token}/accept`);

      if (response.data.success) {
        showSuccess('Invitation Accepted!', `Welcome to "${invitation?.event.title}"!`);
        router.push(`/events/${invitation?.event.id}`);
      }
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      showError('Failed to Accept', error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();
  const isUsed = invitation?.isUsed;
  const canAccept = invitation && !isExpired && !isUsed && currentUser?.email === invitation.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 You're Personally Invited!</h1>
          <p className="text-lg text-gray-600">{invitation.event.title}</p>
        </div>

        {/* Security Badge */}
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-indigo-900">🔐 Secure Personal Invitation</h3>
                <p className="text-sm text-indigo-700">This invitation is exclusively for {invitation.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Invitation Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Event Image */}
            {invitation.event.imageUrl && (
              <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                <img 
                  src={invitation.event.imageUrl} 
                  alt={invitation.event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              </div>
            )}

            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{invitation.event.title}</h2>
                <p className="text-gray-600">{invitation.event.description}</p>
              </div>

              {/* Event Details */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Event Date</p>
                    <p className="text-sm text-gray-600">{formatDate(invitation.event.startDate)}</p>
                  </div>
                </div>

                {invitation.event.location && (
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{invitation.event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Organizer</p>
                    <p className="text-sm text-gray-600">{invitation.event.organizer.name}</p>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900">🔒 Secure Access</h4>
                  <p className="text-sm text-green-700">One-time use token</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <EnvelopeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900">✉️ Email Verified</h4>
                  <p className="text-sm text-blue-700">Only for {invitation.email}</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-orange-900">⏰ Time Limited</h4>
                  <p className="text-sm text-orange-700">Expires in 7 days</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                {!currentUser ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      📧 <strong>Email Verification Required:</strong> This secure invitation can only be accessed by the email address it was sent to ({invitation.email}). You'll need to log in with this email address to accept the invitation.
                    </p>
                    <Button 
                      onClick={() => router.push(`/auth/login?redirect=/secure-invite/${token}`)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      size="lg"
                    >
                      🔐 Log In to Accept Invitation
                    </Button>
                  </div>
                ) : currentUser.email !== invitation.email ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        ❌ <strong>Email Mismatch:</strong> You're logged in as {currentUser.email}, but this invitation is for {invitation.email}.
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push(`/auth/login?redirect=/secure-invite/${token}`)}
                      variant="outline"
                      className="w-full"
                    >
                      Log In with Correct Email
                    </Button>
                  </div>
                ) : isUsed ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600">✅ This invitation has already been used.</p>
                  </div>
                ) : isExpired ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">⏰ This invitation has expired.</p>
                  </div>
                ) : (
                  <Button 
                    onClick={acceptInvitation}
                    disabled={accepting}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {accepting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Accepting...</span>
                      </div>
                    ) : (
                      '🎫 Accept Secure Invitation'
                    )}
                  </Button>
                )}
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">🛡️ Security Notice:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• This invitation link is unique and can only be used once</li>
                  <li>• You must be logged in with {invitation.email} to access it</li>
                  <li>• The invitation will expire in 7 days for security</li>
                  <li>• If you didn't expect this invitation, please ignore this email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact {invitation.event.organizer.name} or visit our support center.</p>
        </div>
      </div>
    </div>
  );
}
