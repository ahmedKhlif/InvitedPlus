'use client';

import { useState, useRef } from 'react';
import { PlayIcon, PauseIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ChatMessage } from '@/lib/services/chat';

interface MediaMessageProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

// Helper function to get full media URL
const getFullMediaUrl = (mediaUrl: string): string => {
  // Check if it's a placeholder URL that needs to be replaced
  if (mediaUrl.includes('your-storage-domain.com')) {
    console.warn('Placeholder URL detected, replacing with localhost:', mediaUrl);
    // Extract the file path from the placeholder URL
    const pathMatch = mediaUrl.match(/\/([^\/]+\/[^\/]+)$/);
    if (pathMatch) {
      const filePath = pathMatch[1];
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus-production.up.railway.app/api').replace('/api', '');
      const fullUrl = `${backendUrl}/uploads/${filePath}`;
      console.log('Generated corrected media URL:', fullUrl);
      return fullUrl;
    }
  }

  if (mediaUrl.startsWith('http')) {
    return mediaUrl; // Already a full URL
  }

  // Get backend server URL without /api since uploads are served directly
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://invitedplus-production.up.railway.app/api').replace('/api', '');
  const fullUrl = `${backendUrl}${mediaUrl}`;
  console.log('Generated media URL:', fullUrl); // Debug logging
  return fullUrl;
};

export default function MediaMessage({ message, isOwnMessage }: MediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);



  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Add error handling for unsupported audio formats
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio. The audio format may not be supported by your browser.');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const getFileIcon = (mediaType?: string) => {
    if (!mediaType) return <DocumentIcon className="h-8 w-8" />;
    
    if (mediaType.startsWith('image/')) return <PhotoIcon className="h-8 w-8" />;
    if (mediaType.startsWith('audio/')) return <PlayIcon className="h-8 w-8" />;
    return <DocumentIcon className="h-8 w-8" />;
  };

  const getFileName = (url?: string) => {
    if (!url) return 'Unknown file';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Unknown file';
  };

  if (message.type === 'IMAGE' && message.mediaUrl) {
    const fullImageUrl = getFullMediaUrl(message.mediaUrl);
    return (
      <div className={`max-w-xs lg:max-w-md ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      } rounded-lg p-2`}>
        {!imageError ? (
          <img
            src={fullImageUrl}
            alt="Shared image"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onError={() => setImageError(true)}
            onClick={() => window.open(fullImageUrl, '_blank')}
          />
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">Image</div>
              <div className="text-xs text-gray-500">Failed to load</div>
            </div>
          </div>
        )}
        {message.content && message.content !== 'Shared an image' && (
          <div className="mt-2 text-sm">{message.content}</div>
        )}
      </div>
    );
  }

  if (message.type === 'VOICE' && message.mediaUrl) {
    const fullVoiceUrl = getFullMediaUrl(message.mediaUrl);
    console.log('Voice message URL:', fullVoiceUrl, 'Media type:', message.mediaType); // Debug

    if (voiceError) {
      return (
        <div className={`p-3 rounded-lg max-w-xs ${
          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isOwnMessage ? 'bg-red-500' : 'bg-red-400'
            }`}>
              <PlayIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Voice message</div>
              <div className="text-xs opacity-75">Failed to load audio</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-3 rounded-lg max-w-xs ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isOwnMessage ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-500 hover:bg-gray-600'
            } text-white transition-colors`}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Voice message</span>
              <span className="text-xs opacity-75">
                {formatDuration(currentTime)} / {formatDuration(message.duration || 0)}
              </span>
            </div>

            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full ${
                  isOwnMessage ? 'bg-blue-300' : 'bg-gray-500'
                } transition-all duration-100`}
                style={{
                  width: `${message.duration ? (currentTime / message.duration) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={fullVoiceUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={(e) => {
            console.error('Audio loading error for URL:', fullVoiceUrl, 'Error:', e);
            setIsPlaying(false);
            setVoiceError(true);
          }}
          className="hidden"
        />
      </div>
    );
  }

  if (message.type === 'FILE' && message.mediaUrl) {
    const fullFileUrl = getFullMediaUrl(message.mediaUrl);
    return (
      <div className={`max-w-xs p-3 rounded-lg ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <a
          href={fullFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className={isOwnMessage ? 'text-blue-200' : 'text-gray-500'}>
            {getFileIcon(message.mediaType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {getFileName(message.mediaUrl)}
            </div>
            <div className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
              {message.mediaType || 'Unknown type'}
            </div>
          </div>
        </a>
        {message.content && !message.content.startsWith('Shared a file:') && (
          <div className="mt-2 text-sm">{message.content}</div>
        )}
      </div>
    );
  }

  // Fallback for text messages or unknown types
  return (
    <div className={`px-4 py-2 rounded-lg ${
      isOwnMessage
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="text-sm">{message.content}</div>
    </div>
  );
}
