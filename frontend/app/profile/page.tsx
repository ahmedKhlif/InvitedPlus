'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { profileService } from '../../lib/services/profile';
import { useToast } from '@/lib/contexts/ToastContext';
import { CheckCircleIcon, ExclamationTriangleIcon, CameraIcon } from '@heroicons/react/24/outline';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import ProfilePictureUpload from '@/components/ui/ProfilePictureUpload';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await profileService.getProfile();
        setUser(response.user);
        setFormData({
          name: response.user.name,
          email: response.user.email,
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        localStorage.removeItem('token');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      showError('Error', 'Email is required');
      return;
    }

    setSaving(true);
    try {
      const response = await profileService.updateProfile({
        name: formData.name,
        email: formData.email,
      });

      setUser(response.user);
      setEditing(false);
      showSuccess('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      showError('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
    setEditing(false);
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
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load profile</div>
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
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            </div>
            <div className="flex space-x-3">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Email Verification Status Banner */}
      {!user.isVerified ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Email Verification Required
                  </p>
                  <p className="text-sm text-yellow-700">
                    Please verify your email address to access all platform features and receive important notifications.
                  </p>
                </div>
              </div>
              <Link
                href={`/auth/verify-code?email=${encodeURIComponent(user.email)}`}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Verify Email
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  ✅ Email Verified - Your account is fully activated!
                </p>
                <p className="text-sm text-green-700">
                  You can now access all platform features and will receive important notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <ProfilePictureUpload
                currentAvatar={user.avatar}
                userName={user.name}
                onAvatarUpdate={(newAvatarUrl) => {
                  setUser(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
                }}
                size="lg"
                editable={editing}
              />
              
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ORGANIZER' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'ATTENDEE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isVerified ? (
                      <>
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <p className="text-gray-900">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {user.isVerified ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Email Verified
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            Email Not Verified
                          </>
                        )}
                      </span>
                      {!user.isVerified && (
                        <Link
                          href={`/auth/verify-code?email=${encodeURIComponent(user.email)}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Verify Now
                        </Link>
                      )}
                    </div>
                    {user.isVerified && (
                      <p className="text-sm text-green-600 mt-1">
                        ✅ Your email has been verified and your account is fully activated.
                      </p>
                    )}
                    {!user.isVerified && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ Please verify your email to access all platform features.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="btn-outline"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/tasks"
                className="btn-outline"
              >
                Manage Tasks
              </Link>
              <Link
                href="/events"
                className="btn-outline"
              >
                View Events
              </Link>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="btn-outline"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          showSuccess('Password changed successfully!');
          setShowChangePasswordModal(false);
        }}
      />
    </div>
  );
}
