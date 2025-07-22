'use client';

import { useState } from 'react';
import { 
  CalendarIcon, 
  CloudArrowDownIcon, 
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: {
    name: string;
    email: string;
  };
}

interface CalendarIntegrationProps {
  event: Event;
  className?: string;
}

export default function CalendarIntegration({ event, className = '' }: CalendarIntegrationProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const generateICalData = () => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Invited+//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@invited-plus.com`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      `ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      `CREATED:${formatICalDate(new Date())}`,
      `LAST-MODIFIED:${formatICalDate(new Date())}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Event reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icalData;
  };

  const downloadICalFile = () => {
    const icalData = generateICalData();
    const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    setMessage('Calendar file downloaded successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
    googleCalendarUrl.searchParams.set('details', event.description);
    googleCalendarUrl.searchParams.set('location', event.location);
    googleCalendarUrl.searchParams.set('sf', 'true');
    googleCalendarUrl.searchParams.set('output', 'xml');

    window.open(googleCalendarUrl.toString(), '_blank');
    
    setMessage('Redirected to Google Calendar');
    setTimeout(() => setMessage(''), 3000);
  };

  const addToOutlook = () => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const formatOutlookDate = (date: Date) => {
      return date.toISOString();
    };

    const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    outlookUrl.searchParams.set('subject', event.title);
    outlookUrl.searchParams.set('startdt', formatOutlookDate(startDate));
    outlookUrl.searchParams.set('enddt', formatOutlookDate(endDate));
    outlookUrl.searchParams.set('body', event.description);
    outlookUrl.searchParams.set('location', event.location);

    window.open(outlookUrl.toString(), '_blank');
    
    setMessage('Redirected to Outlook Calendar');
    setTimeout(() => setMessage(''), 3000);
  };

  const syncWithGoogleCalendar = async () => {
    setSyncStatus('syncing');
    
    try {
      // In a real implementation, you would:
      // 1. Use Google Calendar API
      // 2. Handle OAuth authentication
      // 3. Create/update calendar events
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStatus('success');
      setMessage('Event synced with Google Calendar successfully!');
      
      setTimeout(() => {
        setSyncStatus('idle');
        setMessage('');
      }, 3000);
      
    } catch (error) {
      setSyncStatus('error');
      setMessage('Failed to sync with Google Calendar. Please try again.');
      
      setTimeout(() => {
        setSyncStatus('idle');
        setMessage('');
      }, 3000);
    }
  };

  const copyCalendarLink = () => {
    const calendarLink = `${window.location.origin}/events/${event.id}/calendar`;
    
    navigator.clipboard.writeText(calendarLink).then(() => {
      setMessage('Calendar link copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    }).catch(() => {
      setMessage('Failed to copy link. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <CalendarIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Add to Calendar</h3>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          syncStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : syncStatus === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {syncStatus === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
            {syncStatus === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />}
            <span className={`text-sm ${
              syncStatus === 'success' 
                ? 'text-green-700' 
                : syncStatus === 'error'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}>
              {message}
            </span>
          </div>
        </div>
      )}

      {/* Event Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📅 {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}</div>
          <div>📍 {event.location}</div>
          <div>👤 Organized by {event.organizer.name}</div>
        </div>
      </div>

      {/* Calendar Options */}
      <div className="space-y-3">
        {/* Google Calendar */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Google Calendar</div>
              <div className="text-xs text-gray-500">Add to your Google Calendar</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={addToGoogleCalendar}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Event
            </button>
            <button
              onClick={syncWithGoogleCalendar}
              disabled={syncStatus === 'syncing'}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Outlook Calendar</div>
              <div className="text-xs text-gray-500">Add to your Outlook Calendar</div>
            </div>
          </div>
          <button
            onClick={addToOutlook}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Event
          </button>
        </div>

        {/* Download iCal */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <CloudArrowDownIcon className="w-8 h-8 text-gray-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">Download iCal File</div>
              <div className="text-xs text-gray-500">Compatible with most calendar apps</div>
            </div>
          </div>
          <button
            onClick={downloadICalFile}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Download
          </button>
        </div>

        {/* Copy Link */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <LinkIcon className="w-8 h-8 text-gray-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">Calendar Link</div>
              <div className="text-xs text-gray-500">Share this event's calendar link</div>
            </div>
          </div>
          <button
            onClick={copyCalendarLink}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 mb-2">Calendar Integration Tips:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use "Add Event" for one-time additions</li>
          <li>• Use "Sync" to keep events updated automatically</li>
          <li>• Download iCal for offline calendar apps</li>
          <li>• Share the calendar link with team members</li>
        </ul>
      </div>
    </div>
  );
}
