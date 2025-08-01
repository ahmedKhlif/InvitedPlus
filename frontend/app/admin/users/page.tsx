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
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    organizedEvents: number;
    assignedTasks: number;
    chatMessages: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'GUEST'
  });
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    byRole: { ADMIN: 0, ORGANIZER: 0, GUEST: 0 }
  });
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Check if user has admin role
      const profileResponse = await authService.getProfile();
      if (!profileResponse.success || profileResponse.user.role !== 'ADMIN') {
        showError('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedRole) params.append('role', selectedRole);

      const response = await api.get(`/admin/users?${params.toString()}`);
      const usersData = response.data.users || [];
      setUsers(usersData);

      // Calculate stats
      const total = usersData.length;
      const verified = usersData.filter((u: User) => u.isVerified).length;
      const unverified = total - verified;
      const byRole = usersData.reduce((acc: any, user: User) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, { ADMIN: 0, ORGANIZER: 0, GUEST: 0 });

      setStats({ total, verified, unverified, byRole });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      showSuccess('User created successfully!');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'GUEST' });
      fetchUsers();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showSuccess('User role updated successfully!');
      fetchUsers();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      showSuccess('User deleted successfully!');
      fetchUsers();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleVerification = async (userId: string, isVerified: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/verification`, { isVerified: !isVerified });
      showSuccess(`User ${!isVerified ? 'verified' : 'unverified'} successfully!`);
      fetchUsers();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update verification status');
    }
  };

  // Remove duplicate - using handleUpdateUserRole instead

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
                    <UserIcon className="h-8 w-8 mr-3 text-blue-600" />
                    User Management
                  </h1>
                  <p className="text-gray-600">Manage platform users and their roles</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create User
              </Button>
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
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verified</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <XCircleIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unverified</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.unverified}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byRole.ADMIN}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card variant="elevated" className="backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>
                <Button
                  onClick={fetchUsers}
                  className="flex items-center"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card variant="elevated" className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-medium text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                              {user.isVerified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <XCircleIcon className="h-3 w-3 mr-1" />
                                  Unverified
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">{user.email}</span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="ORGANIZER">Organizer</option>
                            <option value="GUEST">Guest</option>
                          </select>

                          <Button
                            onClick={() => handleToggleVerification(user.id, user.isVerified)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </Button>

                          <Button
                            onClick={() => handleDeleteUser(user.id)}
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
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlusIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Create New User
                  </CardTitle>
                  <CardDescription>Add a new user to the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <Input
                      label="Full Name"
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Enter full name"
                      leftIcon={<UserIcon className="h-5 w-5" />}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Enter email address"
                      leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                    />

                    <Input
                      label="Password"
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter password"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="GUEST">Guest</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                      >
                        Create User
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </div>
  );
}
