'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  // Password requirements
  const passwordRequirements = [
    { test: (pwd: string) => pwd.length >= 8, text: 'At least 8 characters' },
    { test: (pwd: string) => /[A-Z]/.test(pwd), text: 'One uppercase letter' },
    { test: (pwd: string) => /[a-z]/.test(pwd), text: 'One lowercase letter' },
    { test: (pwd: string) => /\d/.test(pwd), text: 'One number' },
  ];

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (pwd: string) => {
    const errors = passwordRequirements
      .filter(req => !req.test(pwd))
      .map(req => req.text);
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const validateConfirmPassword = (confirmPwd: string) => {
    if (confirmPwd && confirmPwd !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate password
    if (!validatePassword(password)) {
      setError('Please fix the password requirements below');
      setLoading(false);
      return;
    }

    // Validate confirm password
    if (!validateConfirmPassword(confirmPassword)) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess('Password reset successfully! You can now sign in with your new password.');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again or request a new reset link.');
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
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
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
                  Redirecting to sign in page...
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password Field */}
                <div>
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    placeholder="Enter new password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    rightIcon={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    required
                  />

                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className={`flex items-center text-xs ${
                        req.test(password) ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          req.test(password) ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password Field */}
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    validateConfirmPassword(e.target.value);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  error={confirmPasswordError}
                  placeholder="Confirm new password"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  required
                />
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !token || passwordErrors.length > 0 || !!confirmPasswordError}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
