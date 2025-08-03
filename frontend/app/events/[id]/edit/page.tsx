'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/common/ImageUpload';
import { authService } from '@/lib/services';
import { api } from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RichTextEditor from '@/components/ui/RichTextEditor';
import TagInput from '@/components/ui/TagInput';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxAttendees?: number;
  isPublic: boolean;
  status: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  organizer: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EditEventPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxAttendees: '',
    isPublic: true,
    status: 'DRAFT',
    category: '',
    tags: [] as string[],
    images: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Get current user
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        const response = await api.get(`/events/${eventId}`);
        const eventData = response.data;
        setEvent(eventData);
        
        // Check if user can edit this event
        if (user && eventData && user.id !== eventData.organizer.id && user.role !== 'ADMIN') {
          setError('You do not have permission to edit this event');
          return;
        }
        
        // Format dates for datetime-local input
        const startDate = eventData.startDate 
          ? new Date(eventData.startDate).toISOString().slice(0, 16)
          : '';
        const endDate = eventData.endDate 
          ? new Date(eventData.endDate).toISOString().slice(0, 16)
          : '';
        
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          startDate,
          endDate,
          location: eventData.location || '',
          maxAttendees: eventData.maxAttendees ? eventData.maxAttendees.toString() : '',
          isPublic: eventData.isPublic ?? true,
          status: eventData.status || 'DRAFT',
          category: eventData.category || '',
          tags: typeof eventData.tags === 'string'
            ? eventData.tags.split(',').filter((tag: string) => tag.trim())
            : eventData.tags || [],
          images: eventData.images || [],
        });
      } catch (error: any) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      images,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      };

      await api.patch(`/events/${eventId}`, updateData);
      router.push(`/events/${eventId}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      setError(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading event...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Event
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600">Update your event details and settings</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Event Information</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <RichTextEditor
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Describe your event"
                required
                height="200px"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Location and Max Attendees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Event location"
                />
              </div>
              <div>
                <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attendees
                </label>
                <input
                  type="number"
                  id="maxAttendees"
                  name="maxAttendees"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a category</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="meetup">Meetup</option>
                  <option value="networking">Networking</option>
                  <option value="social">Social</option>
                  <option value="party">Party</option>
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="corporate">Corporate</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="educational">Educational</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <TagInput
                  label="Tags"
                  value={formData.tags}
                  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                  placeholder="Add tags to help people find your event"
                  maxTags={10}
                  suggestions={[
                    'tech', 'networking', 'business', 'social', 'educational',
                    'workshop', 'conference', 'meetup', 'party', 'celebration',
                    'wedding', 'birthday', 'corporate', 'charity', 'sports',
                    'music', 'art', 'food', 'travel', 'outdoor'
                  ]}
                />
              </div>
            </div>

            {/* Settings */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Public event (visible to all users)
                </label>
              </div>
            </div>

            {/* Event Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Images
              </label>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={10}
                type="events"
                disabled={saving}
              />
              <p className="mt-1 text-sm text-gray-500">
                Add images to showcase your event and attract attendees
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link
                href={`/events/${eventId}`}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
