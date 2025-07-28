'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!validateEmail(email)) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/test-email', { email });
      setResult(response.data);
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Failed to test email service',
        details: err.response?.data?.message || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/test"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Test Page
          </Link>
        </div>

        {/* Email Test Card */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center">
              <PaperAirplaneIcon className="h-6 w-6 mr-2" />
              Email Service Test
            </CardTitle>
            <CardDescription>
              Test your SMTP configuration by sending a test email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Result Message */}
            {result && (
              <div className={`rounded-lg p-4 animate-in slide-in-from-top-2 duration-300 ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {result.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className={`text-xs mt-1 ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Test Form */}
            <form onSubmit={handleTestEmail} className="space-y-6">
              <Input
                label="Test Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                error={emailError}
                placeholder="Enter email to receive test message"
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                required
              />

              <Button
                type="submit"
                disabled={loading || !!emailError}
                className="w-full"
                size="lg"
              >
                {loading ? 'Sending Test Email...' : 'Send Test Email'}
              </Button>
            </form>

            {/* SMTP Configuration Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">SMTP Configuration</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Host:</strong> smtp.gmail.com</p>
                <p><strong>Port:</strong> 587</p>
                <p><strong>Security:</strong> STARTTLS</p>
                <p><strong>Status:</strong> {result?.success ? '✅ Working' : result?.success === false ? '❌ Failed' : '⏳ Not tested'}</p>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                This test verifies that your email service can send emails successfully.
                Check your inbox (and spam folder) for the test message.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
