'use client';

import React, { useState, useRef } from 'react';
import { CameraIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { profileService } from '@/lib/services/profile';
import { useToast } from '@/lib/contexts/ToastContext';

interface ProfilePictureUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatar,
  userName,
  onAvatarUpdate,
  size = 'lg',
  editable = true,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  // Size configurations
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4', 
    xl: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const handleAvatarClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload avatar
      const response = await profileService.uploadAvatar(file);
      
      // Update parent component
      onAvatarUpdate(response.avatarUrl);
      setPreview('');
      
      showSuccess('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError(error.response?.data?.message || 'Failed to upload profile picture');
      setPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatar) return;
    
    try {
      setUploading(true);
      // Call API to remove avatar
      await profileService.removeAvatar();
      onAvatarUpdate('');
      showSuccess('Profile picture removed successfully');
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      showError('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const displayAvatar = preview || currentAvatar;
  const initials = userName.charAt(0).toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar Display */}
      <div 
        className={`
          ${sizeClasses[size]} 
          bg-gradient-to-br from-blue-500 to-purple-600 
          rounded-full 
          flex items-center justify-center 
          overflow-hidden 
          border-4 border-white 
          shadow-lg
          ${editable ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}
          ${uploading ? 'opacity-50' : ''}
        `}
        onClick={handleAvatarClick}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={userName}
            className={`${sizeClasses[size]} rounded-full object-cover`}
          />
        ) : (
          <span className={`${textSizes[size]} font-bold text-white`}>
            {initials}
          </span>
        )}
        
        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {editable && (
        <button
          onClick={handleAvatarClick}
          disabled={uploading}
          className="
            absolute -bottom-1 -right-1 
            bg-blue-600 hover:bg-blue-700 
            disabled:bg-gray-400 
            text-white rounded-full p-2 
            shadow-lg transition-colors
            border-2 border-white
          "
          title="Change profile picture"
        >
          {uploading ? (
            <div className={`${iconSizes[size]} border border-white border-t-transparent rounded-full animate-spin`}></div>
          ) : (
            <CameraIcon className={iconSizes[size]} />
          )}
        </button>
      )}

      {/* Remove Button */}
      {editable && currentAvatar && !uploading && (
        <button
          onClick={handleRemoveAvatar}
          className="
            absolute -top-1 -right-1 
            bg-red-600 hover:bg-red-700 
            text-white rounded-full p-1 
            shadow-lg transition-colors
            border-2 border-white
          "
          title="Remove profile picture"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePictureUpload;
