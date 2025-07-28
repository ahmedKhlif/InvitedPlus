'use client';

import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>
        </div>

        {/* Reset Password Card */}
        <Card variant="elevated" className="backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
                <div className="mt-3 text-sm text-green-600">
                  Didn't receive the email? Check your spam folder or
                  <button
                    onClick={() => setSuccess('')}
                    className="font-medium text-green-700 hover:text-green-800 ml-1 underline"
                  >
                    try again
                  </button>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateEmail(email)}
                  error={emailError}
                  placeholder="Enter your email address"
                  icon={EnvelopeIcon}
                  required
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !!emailError}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            {/* Additional Help */}
            <div className="text-center text-sm text-gray-600">
              <p>
                Remember your password?
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-800 ml-1">
                  Sign in instead
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
