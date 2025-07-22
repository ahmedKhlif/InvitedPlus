import { api } from '../api';

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AvatarUploadResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  avatarUrl: string;
}

export const profileService = {
  // Get current user profile
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Convert image to WebP on frontend (optional optimization)
  async convertToWebP(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size (resize to 300x300)
        canvas.width = 300;
        canvas.height = 300;

        // Draw image with cover fit
        const aspectRatio = img.width / img.height;
        let drawWidth = 300;
        let drawHeight = 300;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawWidth = 300 * aspectRatio;
          offsetX = -(drawWidth - 300) / 2;
        } else {
          drawHeight = 300 / aspectRatio;
          offsetY = -(drawHeight - 300) / 2;
        }

        ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
              });
              resolve(webpFile);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },
};
