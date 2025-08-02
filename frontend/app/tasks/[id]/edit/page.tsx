'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { authService } from '@/lib/services';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import ImageUpload from '@/components/common/ImageUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
  eventId: string;
  images?: string[];
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
}

interface Event {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  type?: string; // 'organizer' or 'attendee'
}

export default function EditTaskPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
    eventId: '',
    images: [] as string[],
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchEvents();
      fetchCurrentUser();
    }
  }, [taskId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const checkEditPermissions = (taskData: Task, user: any) => {
    if (user.role === 'ADMIN') {
      setCanEdit(true);
    } else if (user.role === 'ORGANIZER') {
      // Organizers can edit tasks they created
      setCanEdit(taskData.createdBy.id === user.id);
    } else {
      // Guests cannot edit task details
      setCanEdit(false);
    }
  };

  // Fetch users after task is loaded (need eventId)
  useEffect(() => {
    if (task?.eventId) {
      fetchUsers();
    }
  }, [task?.eventId]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      const taskData = response.data;
      setTask(taskData);
      
      // Format due date for datetime-local input
      const dueDate = taskData.dueDate 
        ? new Date(taskData.dueDate).toISOString().slice(0, 16)
        : '';
      
      setFormData({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        dueDate,
        assigneeId: taskData.assigneeId || '',
        eventId: taskData.eventId,
        images: taskData.images || [],
      });

      // Check if user can edit this task
      if (currentUser) {
        checkEditPermissions(taskData, currentUser);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch task');
      if (err.response?.status === 401) {
        router.push('/auth/login');
      } else if (err.response?.status === 404) {
        router.push('/tasks');
      } else if (err.response?.status === 403) {
        // Permission denied - redirect to view page
        router.push(`/tasks/${taskId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check permissions when both user and task are loaded
  useEffect(() => {
    if (task && currentUser) {
      checkEditPermissions(task, currentUser);

      // If user cannot edit, redirect to view page
      if (!canEdit && currentUser.role === 'GUEST') {
        setError('You do not have permission to edit this task');
        setTimeout(() => {
          router.push(`/tasks/${taskId}`);
        }, 2000);
      }
    }
  }, [task, currentUser, canEdit, taskId, router]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      if (response.data.success) {
        setEvents(response.data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      // Fallback to empty array if API fails
      setEvents([]);
    }
  };

  const fetchUsers = async () => {
    try {
      // Only fetch eligible assignees for this event (organizer + attendees)
      if (task?.eventId) {
        const response = await api.get(`/events/${task.eventId}/eligible-assignees`);
        if (response.data.success) {
          setUsers(response.data.eligibleAssignees.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type, // 'organizer' or 'attendee'
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch eligible assignees:', err);
      // Fallback to empty array if API fails
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Exclude eventId from update - tasks cannot be moved between events
      const { eventId, ...updateData } = formData;
      await api.patch(`/tasks/${taskId}`, {
        ...updateData,
        dueDate: formData.dueDate || undefined,
        assigneeId: formData.assigneeId || undefined,
      });

      router.push(`/tasks/${taskId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImagesChange = (images: string[]) => {
    setFormData({
      ...formData,
      images,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Task not found</div>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href={`/tasks/${taskId}`}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-600" />
                Edit Task
              </h1>
              <p className="text-gray-600">Update task details and settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <RichTextEditor
                label="Description"
                value={formData.description || ''}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter task description"
                height="150px"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
                Event *
              </label>
              <select
                id="eventId"
                name="eventId"
                required
                value={formData.eventId}
                onChange={handleChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Tasks cannot be moved between events
              </p>
            </div>

            <div>
              <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <select
                id="assigneeId"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) {user.type === 'organizer' ? '👑 Organizer' : '👤 Attendee'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Only event organizer and attendees can be assigned tasks
              </p>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Images
              </label>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={5}
                type="tasks"
                disabled={saving}
              />
              <p className="mt-1 text-sm text-gray-500">
                Add images to help illustrate the task requirements or progress
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link
                href={`/tasks/${taskId}`}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
