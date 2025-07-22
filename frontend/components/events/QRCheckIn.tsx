'use client';

import { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, CameraIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { websocketService } from '@/lib/websocket';

interface QRCheckInProps {
  eventId: string;
  onCheckIn: (attendeeData: any) => void;
  className?: string;
}

interface AttendeeCheckIn {
  id: string;
  name: string;
  email: string;
  checkedInAt: string;
  qrCode: string;
}

export default function QRCheckIn({ eventId, onCheckIn, className = '' }: QRCheckInProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [recentCheckIns, setRecentCheckIns] = useState<AttendeeCheckIn[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Listen for real-time check-ins
    websocketService.onAttendeeCheckin(handleRealTimeCheckIn);
    
    return () => {
      stopScanning();
      websocketService.off('event:attendee_checkin', handleRealTimeCheckIn);
    };
  }, []);

  const handleRealTimeCheckIn = (data: any) => {
    if (data.eventId === eventId) {
      const newCheckIn: AttendeeCheckIn = {
        id: data.attendeeId,
        name: data.attendeeName,
        email: data.attendeeEmail || 'Unknown',
        checkedInAt: data.timestamp,
        qrCode: data.qrCode || ''
      };
      
      setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 9)]); // Keep last 10
      setSuccess(`${data.attendeeName} checked in successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start QR code detection
        startQRDetection();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startQRDetection = () => {
    const detectQR = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // In a real implementation, you would use a QR code library like jsQR
        // For demo purposes, we'll simulate QR detection
        simulateQRDetection();
      }

      if (isScanning) {
        requestAnimationFrame(detectQR);
      }
    };

    detectQR();
  };

  const simulateQRDetection = () => {
    // Simulate QR code detection for demo
    // In real implementation, use jsQR or similar library
    const mockQRCodes = [
      'EVENT_INVITE_ABC123_USER456',
      'EVENT_INVITE_DEF789_USER789',
      'EVENT_INVITE_GHI012_USER012'
    ];

    // Randomly detect a QR code (10% chance per frame)
    if (Math.random() < 0.001) {
      const randomQR = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
      handleQRDetected(randomQR);
    }
  };

  const handleQRDetected = async (qrData: string) => {
    try {
      setScanResult(qrData);
      
      // Parse QR code data
      const parts = qrData.split('_');
      if (parts.length >= 3 && parts[0] === 'EVENT' && parts[1] === 'INVITE') {
        const inviteCode = parts[2];
        const userId = parts[3];
        
        // Process check-in
        await processCheckIn(inviteCode, userId);
      } else {
        setError('Invalid QR code format');
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Failed to process QR code');
    }
  };

  const processCheckIn = async (inviteCode: string, userId: string) => {
    try {
      // In real app, make API call to check in attendee
      const mockAttendee = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        inviteCode: inviteCode
      };

      // Send real-time check-in notification
      websocketService.sendEventCheckin(eventId, mockAttendee.id, mockAttendee.name);
      
      // Call parent callback
      onCheckIn(mockAttendee);
      
      setSuccess(`${mockAttendee.name} checked in successfully!`);
      setScanResult('');
      
      // Continue scanning after brief pause
      setTimeout(() => {
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error checking in attendee:', err);
      setError('Failed to check in attendee');
    }
  };

  const manualCheckIn = () => {
    // For demo - simulate manual check-in
    const mockAttendee = {
      id: `user_${Date.now()}`,
      name: 'Manual Check-in User',
      email: 'manual@example.com'
    };
    
    websocketService.sendEventCheckin(eventId, mockAttendee.id, mockAttendee.name);
    onCheckIn(mockAttendee);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">QR Check-In</h3>
        <div className="flex space-x-2">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <CameraIcon className="h-4 w-4 mr-2" />
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Stop Scanning
            </button>
          )}
          
          <button
            onClick={manualCheckIn}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Manual Check-In
          </button>
        </div>
      </div>

      {/* Camera View */}
      {isScanning && (
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                <QrCodeIcon className="h-16 w-16 text-white opacity-50" />
              </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-50 text-white text-sm p-2 rounded">
                Point camera at QR code to check in attendees
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-700">
            <strong>QR Code Detected:</strong> {scanResult}
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Recent Check-ins</h4>
        {recentCheckIns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>No check-ins yet</p>
            <p className="text-sm">Scan QR codes to see attendees here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCheckIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{checkIn.name}</div>
                    <div className="text-xs text-gray-500">{checkIn.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(checkIn.checkedInAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">How to use QR Check-in:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click "Start Scanning" to activate camera</li>
          <li>• Point camera at attendee's QR code</li>
          <li>• System will automatically detect and check them in</li>
          <li>• Use "Manual Check-In" for attendees without QR codes</li>
        </ul>
      </div>
    </div>
  );
}
