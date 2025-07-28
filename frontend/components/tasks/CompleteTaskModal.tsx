'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    completionNote?: string;
    completionImages?: string[];
  };
  onTaskCompleted: () => void;
}

export default function CompleteTaskModal({
  isOpen,
  onClose,
  task,
  onTaskCompleted
}: CompleteTaskModalProps) {
  const [formData, setFormData] = useState({
    completionNote: '',
    completionImages: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // Populate form with existing completion data when editing
  useEffect(() => {
    if (isOpen && task.status === 'COMPLETED') {
      setFormData({
        completionNote: task.completionNote || '',
        completionImages: task.completionImages || [],
      });
      setImagePreview(task.completionImages || []);
    } else if (isOpen) {
      // Reset form for new completion
      setFormData({
        completionNote: '',
        completionImages: [],
      });
      setImagePreview([]);
    }
  }, [isOpen, task.status, task.completionNote, task.completionImages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/upload/image/tasks', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data.imageUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        completionImages: [...prev.completionImages, ...uploadedUrls]
      }));

      // Create preview URLs for display
      const previewUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...previewUrls]);

    } catch (error) {
      console.error('Failed to upload completion images:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      completionImages: prev.completionImages.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/tasks/${task.id}/complete`, {
        completionNote: formData.completionNote || undefined,
        completionImages: formData.completionImages.length > 0 ? formData.completionImages : undefined,
      });

      if (response.data.success) {
        onTaskCompleted();
        onClose();
        // Reset form
        setFormData({
          completionNote: '',
          completionImages: [],
        });
        setImagePreview([]);
      }
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      setError(err.response?.data?.message || 'Failed to complete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {task.status === 'COMPLETED' ? 'Edit Completion Details' : 'Complete Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-gray-600 text-sm">{task.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Completion Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Notes
                <span className="text-gray-500 font-normal ml-1">(Optional)</span>
              </label>
              <textarea
                value={formData.completionNote}
                onChange={(e) => setFormData(prev => ({ ...prev, completionNote: e.target.value }))}
                placeholder="Add any notes about how you completed this task, challenges faced, or additional details..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={1000}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.completionNote.length}/1000 characters
              </div>
            </div>

            {/* Completion Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Proof Images
                <span className="text-gray-500 font-normal ml-1">(Optional)</span>
              </label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {uploadingImage ? 'Uploading...' : 'Add Proof Images'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    Upload images showing task completion
                  </span>
                </div>

                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Completion proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (task.status === 'COMPLETED' ? 'Updating...' : 'Completing...')
                  : (task.status === 'COMPLETED' ? 'Update Completion' : 'Complete Task')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
