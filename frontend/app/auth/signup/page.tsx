'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon, UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[@$!%*?&]/.test(p) },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<boolean[]>([]);
  const router = useRouter();

  // Update password strength indicators
  useEffect(() => {
    const strength = passwordRequirements.map(req => req.test(formData.password));
    setPasswordStrength(strength);
  }, [formData.password]);

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (name) {
      case 'name':
        if (!value.trim()) errors.name = 'Name is required';
        else if (value.trim().length < 2) errors.name = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email';
        break;
      case 'password':
        if (!value) errors.password = 'Password is required';
        else if (!passwordRequirements.every(req => req.test(value))) {
          errors.password = 'Password does not meet requirements';
        }
        break;
      case 'confirmPassword':
        if (!value) errors.confirmPassword = 'Please confirm your password';
        else if (value !== formData.password) errors.confirmPassword = 'Passwords do not match';
        break;
    }

    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const isFormValid = () => {
    return (
      formData.name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      passwordRequirements.every(req => req.test(formData.password)) &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate all fields
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      setSuccess('Account created successfully! Redirecting to verification page...');
      setTimeout(() => {
        router.push(`/auth/verify-code?email=${encodeURIComponent(formData.email)}`);
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message ||
                          (Array.isArray(err.response?.data?.message)
                            ? err.response.data.message.join(', ')
                            : 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="relative group mx-auto mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center">
              <img
                src="/InvitedPlusLogo.png"
                alt="Invited+ Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Join Invited+
          </h2>
          <p className="text-lg text-gray-600 mb-2">Create amazing events together</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span>Free to start</span>
            <span>•</span>
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span>Setup in 2 minutes</span>
          </div>
        </div>

        {/* Signup Card */}
        <Card variant="elevated" className="backdrop-blur-sm bg-white/80 shadow-2xl border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <CardContent className="relative space-y-6 p-8">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-3">
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
                <div className="mt-3 text-sm text-green-600">
                  Check your email for a 6-digit verification code.
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
                <XMarkIcon className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

          {/* OAuth Signup Buttons */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => window.location.href = 'https://invitedplus-production.up.railway.app/api/auth/google'}
              className="group w-full flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => window.location.href = 'https://invitedplus-production.up.railway.app/api/auth/github'}
              className="group w-full flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="input-group">
              <label htmlFor="name" className="input-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                required
              />
              {fieldErrors.name && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="Enter your email address"
                required
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input pr-12 ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="password-strength">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={`password-requirement ${
                        passwordStrength[index] ? 'met' : 'unmet'
                      }`}
                    >
                      {passwordStrength[index] ? (
                        <CheckIcon className="w-3 h-3 mr-2" />
                      ) : (
                        <XMarkIcon className="w-3 h-3 mr-2" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              )}

              {fieldErrors.password && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input pr-12 ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading || !isFormValid()}
              className="h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating your account...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Create Account
                </div>
              )}
            </Button>
          </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
              Sign in here
            </Link>
          </p>

          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <span>🔒 Secure & Private</span>
            <span>•</span>
            <span>⚡ Lightning Fast</span>
            <span>•</span>
            <span>💝 Free Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
}
