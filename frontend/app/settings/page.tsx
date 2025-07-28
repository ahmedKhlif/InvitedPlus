'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import api from '@/lib/api';
import { useToast } from '@/lib/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import {
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  preferences?: any;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  taskDeadlines: boolean;
  newMessages: boolean;
  pollUpdates: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  allowDirectMessages: boolean;
  allowEventInvites: boolean;
  allowTaskAssignments: boolean;
  showOnlineStatus: boolean;
}

interface AccountSettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  dataExportRequested: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    timezone: 'UTC',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    taskDeadlines: true,
    newMessages: true,
    pollUpdates: false,
    weeklyDigest: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowDirectMessages: true,
    allowEventInvites: true,
    allowTaskAssignments: true,
    showOnlineStatus: true,
  });

  const [account, setAccount] = useState<AccountSettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
    dataExportRequested: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await authService.getProfile();
        const userData = profileResponse.user;
        setUser(userData);

        // Initialize form data
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
          bio: userData.bio || '',
          phone: userData.phone || '',
          timezone: userData.timezone || 'UTC',
        });

        // Load user preferences if available
        if (userData.preferences) {
          const prefs = userData.preferences;
          if (prefs.notifications) {
            setNotifications({ ...notifications, ...prefs.notifications });
          }
          if (prefs.privacy) {
            setPrivacy({ ...privacy, ...prefs.privacy });
          }
          if (prefs.account) {
            setAccount({ ...account, ...prefs.account });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showError('Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/auth/profile', profileForm);
      setUser(response.data.user);
      showSuccess('Profile updated successfully!');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Notification settings handler
  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(newNotifications);

    try {
      await api.put('/auth/preferences', {
        notifications: newNotifications
      });
      showSuccess('Notification settings updated!');
    } catch (error: any) {
      showError('Failed to update notification settings');
      // Revert on error
      setNotifications(notifications);
    }
  };

  // Privacy settings handler
  const handlePrivacyChange = async (key: keyof PrivacySettings, value: any) => {
    const newPrivacy = {
      ...privacy,
      [key]: value
    };
    setPrivacy(newPrivacy);

    try {
      await api.put('/auth/preferences', {
        privacy: newPrivacy
      });
      showSuccess('Privacy settings updated!');
    } catch (error: any) {
      showError('Failed to update privacy settings');
      // Revert on error
      setPrivacy(privacy);
    }
  };

  // Account settings handler
  const handleAccountChange = async (key: keyof AccountSettings, value: any) => {
    const newAccount = {
      ...account,
      [key]: value
    };
    setAccount(newAccount);

    try {
      await api.put('/auth/preferences', {
        account: newAccount
      });
      showSuccess('Account settings updated!');
    } catch (error: any) {
      showError('Failed to update account settings');
      // Revert on error
      setAccount(account);
    }
  };

  // Export data handler
  const handleExportData = async () => {
    try {
      setSaving(true);
      const response = await api.post('/auth/export-data');
      showSuccess('Data export requested! You will receive an email when ready.');
      setAccount(prev => ({ ...prev, dataExportRequested: true }));
    } catch (error: any) {
      showError('Failed to request data export');
    } finally {
      setSaving(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await api.delete('/auth/account');
      showSuccess('Account deleted successfully');
      authService.logout();
      router.push('/');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  // Two-factor authentication toggle
  const handleTwoFactorToggle = async () => {
    try {
      setSaving(true);
      const newValue = !account.twoFactorEnabled;
      
      if (newValue) {
        // Enable 2FA - would typically show QR code setup
        showSuccess('Two-factor authentication setup coming soon!');
      } else {
        // Disable 2FA
        await api.post('/auth/disable-2fa');
        setAccount(prev => ({ ...prev, twoFactorEnabled: false }));
        showSuccess('Two-factor authentication disabled');
      }
    } catch (error: any) {
      showError('Failed to update two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon, description: 'Update your personal information' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon, description: 'Manage notification preferences' },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon, description: 'Control your privacy settings' },
    { id: 'security', name: 'Security', icon: KeyIcon, description: 'Manage security and authentication' },
    { id: 'account', name: 'Account', icon: CogIcon, description: 'Account management and data' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                Welcome, <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-80">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Settings Menu</CardTitle>
                <CardDescription>Choose a category to configure</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start p-4 text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className={`h-5 w-5 mr-3 mt-0.5 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <Card variant="elevated" className="backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {(() => {
                    const currentTab = tabs.find(tab => tab.id === activeTab);
                    if (currentTab?.icon) {
                      const IconComponent = currentTab.icon;
                      return <IconComponent className="h-6 w-6 mr-3 text-blue-600" />;
                    }
                    return null;
                  })()}
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </CardTitle>
                <CardDescription>
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                        icon={UserIcon}
                        required
                      />

                      <Input
                        label="Email Address"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        icon={EnvelopeIcon}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                        leftIcon={<DevicePhoneMobileIcon className="h-5 w-5" />}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={profileForm.timezone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="px-6"
                      >
                        {saving ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Email Notifications
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                          { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminded about upcoming events' },
                          { key: 'taskDeadlines', label: 'Task Deadlines', desc: 'Notifications for task due dates' },
                          { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of your activities' },
                          { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Product updates and announcements' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="text-sm font-medium text-gray-900">{label}</label>
                              <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                            <button
                              onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className={`${
                                notifications[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Push Notifications
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
                          { key: 'newMessages', label: 'New Messages', desc: 'Instant notifications for new chat messages' },
                          { key: 'pollUpdates', label: 'Poll Updates', desc: 'Notifications when polls are created or updated' },
                          { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important security notifications' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="text-sm font-medium text-gray-900">{label}</label>
                              <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                            <button
                              onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                              className={`${
                                notifications[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="space-y-8">
                    {/* Profile Visibility */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Profile Visibility
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Who can see your profile?
                          </label>
                          <select
                            value={privacy.profileVisibility}
                            onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="public">Public - Anyone can see</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private - Only you</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'showEmail', label: 'Show Email Address', desc: 'Allow others to see your email address' },
                          { key: 'showPhone', label: 'Show Phone Number', desc: 'Allow others to see your phone number' },
                          { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Let others know when you are online' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="text-sm font-medium text-gray-900">{label}</label>
                              <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                            <button
                              onClick={() => handlePrivacyChange(key as keyof PrivacySettings, !privacy[key as keyof PrivacySettings])}
                              className={`${
                                privacy[key as keyof PrivacySettings] ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  privacy[key as keyof PrivacySettings] ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Communication Preferences */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Communication
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'allowDirectMessages', label: 'Allow Direct Messages', desc: 'Let others send you direct messages' },
                          { key: 'allowEventInvites', label: 'Allow Event Invitations', desc: 'Receive invitations to events' },
                          { key: 'allowTaskAssignments', label: 'Allow Task Assignments', desc: 'Let others assign tasks to you' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="text-sm font-medium text-gray-900">{label}</label>
                              <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                            <button
                              onClick={() => handlePrivacyChange(key as keyof PrivacySettings, !privacy[key as keyof PrivacySettings])}
                              className={`${
                                privacy[key as keyof PrivacySettings] ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  privacy[key as keyof PrivacySettings] ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-8">
                    {/* Password Management */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <LockClosedIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Password & Authentication
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
                              <p className="text-sm text-gray-500">Update your account password</p>
                            </div>
                            <Button
                              onClick={() => setShowChangePasswordModal(true)}
                              variant="outline"
                              size="sm"
                            >
                              Change Password
                            </Button>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                            </div>
                            <button
                              onClick={handleTwoFactorToggle}
                              disabled={saving}
                              className={`${
                                account.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  account.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Management */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <CogIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Session Management
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Login Notifications</h4>
                              <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                            </div>
                            <button
                              onClick={() => handleAccountChange('loginNotifications', !account.loginNotifications)}
                              className={`${
                                account.loginNotifications ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  account.loginNotifications ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Session Timeout (minutes)
                            </label>
                            <select
                              value={account.sessionTimeout}
                              onChange={(e) => handleAccountChange('sessionTimeout', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={480}>8 hours</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className="space-y-8">
                    {/* Data Management */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <CogIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Data Management
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-blue-900">Export Your Data</h4>
                              <p className="text-sm text-blue-700">Download a copy of all your data</p>
                            </div>
                            <Button
                              onClick={handleExportData}
                              disabled={saving || account.dataExportRequested}
                              variant="outline"
                              size="sm"
                            >
                              {account.dataExportRequested ? 'Export Requested' : 'Export Data'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
                        Danger Zone
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                            </div>
                            <Button
                              onClick={() => setShowDeleteConfirm(true)}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center text-red-900">
                  <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-600" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Deleting your account will:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                    <li>Remove all your events and tasks</li>
                    <li>Delete all your messages and files</li>
                    <li>Remove you from all shared events</li>
                    <li>Cancel all pending invitations</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {saving ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
