'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authService, eventsService, tasksService, chatService, invitesService, pollsService } from '@/lib/services';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  UserIcon,
  DocumentTextIcon,
  LinkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function TestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    const testResults = [];

    // Test Authentication
    try {
      if (!authService.isAuthenticated()) {
        testResults.push({ name: 'Authentication', status: 'error', message: 'Not authenticated' });
        setResults(testResults);
        setLoading(false);
        return;
      }

      const profile = await authService.getProfile();
      testResults.push({ name: 'Authentication', status: 'success', message: `Authenticated as ${profile.user.name}` });
    } catch (error: any) {
      testResults.push({ name: 'Authentication', status: 'error', message: 'Auth failed' });
    }

    // Test Events
    try {
      const events = await eventsService.getEvents();
      testResults.push({ name: 'Events API', status: 'success', message: `Found ${events.events.length} events` });
    } catch (error: any) {
      testResults.push({ name: 'Events API', status: 'error', message: 'Events failed' });
    }

    // Test Tasks
    try {
      const tasks = await tasksService.getTasks();
      testResults.push({ name: 'Tasks API', status: 'success', message: `Found ${tasks.tasks.length} tasks` });
    } catch (error: any) {
      testResults.push({ name: 'Tasks API', status: 'error', message: 'Tasks failed' });
    }

    // Test Chat
    try {
      const chat = await chatService.getMessages();
      testResults.push({ name: 'Chat API', status: 'success', message: `Found ${chat.messages.length} messages` });
    } catch (error: any) {
      testResults.push({ name: 'Chat API', status: 'error', message: 'Chat failed' });
    }

    // Test Polls
    try {
      const polls = await pollsService.getPolls();
      testResults.push({ name: 'Polls API', status: 'success', message: `Found ${polls.polls.length} polls` });
    } catch (error: any) {
      testResults.push({ name: 'Polls API', status: 'error', message: 'Polls failed' });
    }

    // Test Invites
    try {
      const invite = await invitesService.getEventByInviteCode('DEMO2024');
      testResults.push({ name: 'Invites API', status: 'success', message: `Found event: ${invite.event.title}` });
    } catch (error: any) {
      testResults.push({ name: 'Invites API', status: 'error', message: 'Invites failed' });
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🧪 API Test Suite</h1>
            <Link href="/dashboard" className="btn-outline">Back to Dashboard</Link>
          </div>

          {/* Auth Status */}
          <div className={`mb-6 p-4 rounded-lg ${isAuthenticated ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h2 className="font-semibold mb-2">Authentication Status</h2>
            {isAuthenticated ? (
              <p className="text-green-700">✅ Authenticated - Ready to test APIs</p>
            ) : (
              <div className="text-red-700">
                <p className="mb-3">❌ Not authenticated - Please login first</p>
                <Link href="/auth/login" className="btn-primary">Go to Login</Link>
              </div>
            )}
          </div>

          {/* Test Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold mb-3">🔑 Test Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-sm">Organizer</p>
                <p className="text-xs text-gray-600">Email: organizer@invitedplus.com</p>
                <p className="text-xs text-gray-600">Password: organizer123</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-sm">Admin</p>
                <p className="text-xs text-gray-600">Email: admin@invitedplus.com</p>
                <p className="text-xs text-gray-600">Password: admin123</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-sm">Guest</p>
                <p className="text-xs text-gray-600">Email: guest@invitedplus.com</p>
                <p className="text-xs text-gray-600">Password: guest123</p>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">API Endpoint Tests</h2>
              <button
                onClick={runTests}
                disabled={loading || !isAuthenticated}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Running Tests...' : '🚀 Run All Tests'}
              </button>
            </div>

            {/* Test Results */}
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{result.name}</h3>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {result.status === 'success' ? '✅ SUCCESS' : '❌ ERROR'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                </div>
              ))}
            </div>

            {results.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">Ready to test all API endpoints!</p>
                <p className="text-sm">This will test: Authentication, Events, Tasks, Chat, Polls, and Invites</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Quick Links
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/events" className="btn-outline text-center flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Events
              </Link>
              <Link href="/tasks" className="btn-outline text-center flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                Tasks
              </Link>
              <Link href="/chat" className="btn-outline text-center flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                Chat
              </Link>
              <Link href="/invite" className="btn-outline text-center flex items-center justify-center">
                <TicketIcon className="h-4 w-4 mr-1" />
                Invites
              </Link>
              <Link href="/profile" className="btn-outline text-center flex items-center justify-center">
                <UserIcon className="h-4 w-4 mr-1" />
                Profile
              </Link>
              <a href="http://localhost:3001/api/docs" target="_blank" className="btn-outline text-center flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                API Docs
              </a>
              <Link href="/test-email" className="btn-outline text-center flex items-center justify-center">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                Test Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
