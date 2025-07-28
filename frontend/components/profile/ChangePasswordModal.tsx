'use client';

import { useState } from 'react';
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password requirements
  const passwordRequirements = [
    { test: (pwd: string) => pwd.length >= 8, text: 'At least 8 characters' },
    { test: (pwd: string) => /[A-Z]/.test(pwd), text: 'One uppercase letter' },
    { test: (pwd: string) => /[a-z]/.test(pwd), text: 'One lowercase letter' },
    { test: (pwd: string) => /\d/.test(pwd), text: 'One number' },
  ];

  const validatePassword = (pwd: string) => {
    const errors = passwordRequirements
      .filter(req => !req.test(pwd))
      .map(req => req.text);
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const validateConfirmPassword = (confirmPwd: string) => {
    if (confirmPwd && confirmPwd !== formData.newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      validatePassword(value);
      if (formData.confirmPassword) {
        validateConfirmPassword(formData.confirmPassword);
      }
    }
    
    if (field === 'confirmPassword') {
      validateConfirmPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate all fields
    if (!formData.currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setError('Please fix the password requirements below');
      setLoading(false);
      return;
    }

    if (!validateConfirmPassword(formData.confirmPassword)) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess('Password changed successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors([]);
        setConfirmPasswordError('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('');
    setPasswordErrors([]);
    setConfirmPasswordError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full">
        <Card variant="elevated">
          <CardHeader className="relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LockClosedIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Change Password</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Password */}
                <Input
                  label="Current Password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={showPasswords.current ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  onRightIconClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  required
                />

                {/* New Password */}
                <div>
                  <Input
                    label="New Password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    rightIcon={showPasswords.new ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    onRightIconClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    required
                  />
                  
                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className={`flex items-center text-xs ${
                        req.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          req.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <Input
                  label="Confirm New Password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onBlur={() => validateConfirmPassword(formData.confirmPassword)}
                  error={confirmPasswordError}
                  placeholder="Confirm new password"
                  leftIcon={<LockClosedIcon className="h-5 w-5" />}
                  rightIcon={showPasswords.confirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  onRightIconClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  required
                />

                {/* Submit Buttons */}
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || passwordErrors.length > 0 || !!confirmPasswordError}
                    className="flex-1"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
