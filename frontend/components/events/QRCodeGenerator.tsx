'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useToast } from '@/lib/contexts/ToastContext';

interface QRCodeGeneratorProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

export default function QRCodeGenerator({ eventId, eventTitle, className = '' }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create the event join URL
        const eventUrl = `${window.location.origin}/events/${eventId}/join`;
        
        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [eventId]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `${eventTitle}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyEventLink = async () => {
    const eventUrl = `${window.location.origin}/events/${eventId}/join`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      showSuccess('Link Copied!', 'Event link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      showError('Copy Failed', 'Failed to copy event link');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center ${className}`}
      >
        📱 QR Code
      </button>

      {/* QR Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event QR Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <h4 className="text-md font-medium text-gray-800 mb-4">{eventTitle}</h4>
              
              {qrCodeUrl && (
                <div className="mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="Event QR Code"
                    className="mx-auto border border-gray-200 rounded"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to quickly join the event or share it with others!
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={downloadQRCode}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  📥 Download QR Code
                </button>
                
                <button
                  onClick={copyEventLink}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  🔗 Copy Event Link
                </button>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
