'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TestMicrophonePage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [permissionState, setPermissionState] = useState<string>('Unknown');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const checkPermissions = async () => {
    try {
      setStatus('Checking permissions...');
      
      // Check if navigator.permissions is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(permission.state);
        setStatus(`Permission state: ${permission.state}`);
      } else {
        setStatus('Permissions API not available');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setStatus('Error checking permissions');
    }
  };

  const testMicrophone = async () => {
    try {
      setStatus('Requesting microphone access...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('❌ MediaDevices API not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setStatus('✅ Microphone access granted!');
      
      // Test MediaRecorder
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      recorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
      };
      
      recorder.onstop = () => {
        setStatus('✅ Recording test completed successfully!');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start a short test recording
      recorder.start();
      setIsRecording(true);
      setStatus('🎤 Recording for 3 seconds...');
      
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('Microphone test failed:', error);
      
      let errorMessage = '❌ Microphone test failed: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Browser does not support audio recording.';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      setStatus(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              🎤 Microphone Permission Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This page helps you test if microphone permissions are working correctly.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Status:</h3>
              <p className="text-sm">{status}</p>
              {permissionState !== 'Unknown' && (
                <p className="text-sm mt-1">
                  <strong>Permission State:</strong> {permissionState}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={checkPermissions}
                className="w-full"
                variant="outline"
              >
                Check Permission Status
              </Button>
              
              <Button 
                onClick={testMicrophone}
                disabled={isRecording}
                className="w-full"
              >
                {isRecording ? 'Recording...' : 'Test Microphone Access'}
              </Button>
              
              {isRecording && (
                <Button 
                  onClick={stopRecording}
                  variant="outline"
                  className="w-full"
                >
                  Stop Recording
                </Button>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Troubleshooting:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Make sure your browser allows microphone access</li>
                <li>• Click the lock icon in the address bar to check site permissions</li>
                <li>• Try refreshing the page if permissions were recently changed</li>
                <li>• Check your system's microphone privacy settings</li>
              </ul>
            </div>

            <div className="text-center">
              <a 
                href="/chat" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ← Back to Chat
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
