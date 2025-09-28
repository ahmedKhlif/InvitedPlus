/**
 * Media URL utilities for handling image and file URLs consistently
 */

// Get the backend base URL from environment variables
const getBackendBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus.onrender.com/api';
  return apiUrl.replace('/api', '');
};

/**
 * Convert a relative media URL to a full URL
 * @param mediaUrl - The relative URL (e.g., '/uploads/events/image.webp')
 * @returns Full URL to the media file
 */
export const getFullMediaUrl = (mediaUrl: string): string => {
  // If it's already a full URL, return as-is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl;
  }

  // If it's a blob URL, return as-is
  if (mediaUrl.startsWith('blob:')) {
    return mediaUrl;
  }

  // If it's a data URL, return as-is
  if (mediaUrl.startsWith('data:')) {
    return mediaUrl;
  }

  // Handle placeholder URLs that need to be replaced
  if (mediaUrl.includes('your-storage-domain.com')) {
    console.warn('Placeholder URL detected, replacing:', mediaUrl);
    const pathMatch = mediaUrl.match(/\/([^\/]+\/[^\/]+)$/);
    if (pathMatch) {
      const filePath = pathMatch[1];
      return `${getBackendBaseUrl()}/uploads/${filePath}`;
    }
  }

  // For relative URLs, prepend the backend base URL
  const baseUrl = getBackendBaseUrl();
  
  // Ensure the URL starts with /
  const normalizedUrl = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
  
  return `${baseUrl}${normalizedUrl}`;
};

/**
 * Get the API base URL for uploads
 * @returns API base URL
 */
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus.onrender.com/api';
};

/**
 * Check if a URL is a valid image URL
 * @param url - URL to check
 * @returns boolean indicating if it's likely an image
 */
export const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowercaseUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowercaseUrl.includes(ext)) || url.startsWith('data:image/');
};

/**
 * Get file name from URL
 * @param url - File URL
 * @returns File name
 */
export const getFileName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'Unknown file';
  } catch {
    // If URL parsing fails, try to extract filename from string
    return url.split('/').pop() || 'Unknown file';
  }
};

/**
 * Get file extension from URL
 * @param url - File URL
 * @returns File extension (with dot)
 */
export const getFileExtension = (url: string): string => {
  const fileName = getFileName(url);
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
};
