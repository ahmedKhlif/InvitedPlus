'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  allowMultipleVotes: boolean;
  showResults: boolean;
  expiresAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    title: string;
  };
  userVote?: string[]; // Array of option IDs the user voted for
  createdAt: string;
}

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  onToggleStatus?: (pollId: string, isActive: boolean) => void;
  canManage?: boolean;
}

export default function PollCard({ poll, onVote, onToggleStatus, canManage }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVote || []);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (optionId: string) => {
    if (!poll.isActive) return;

    setIsVoting(true);
    try {
      if (poll.allowMultipleVotes) {
        // Toggle option for multiple votes
        const newSelection = selectedOptions.includes(optionId)
          ? selectedOptions.filter(id => id !== optionId)
          : [...selectedOptions, optionId];
        setSelectedOptions(newSelection);
      } else {
        // Single vote
        setSelectedOptions([optionId]);
      }
      
      await onVote(poll.id, optionId);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getOptionPercentage = (votes: number) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
  };

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const hasVoted = poll.userVote && poll.userVote.length > 0;
  const showResults = poll.showResults || hasVoted || isExpired || !poll.isActive;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{poll.question}</h3>
          {poll.description && (
            <p className="text-sm text-gray-600 mb-3">{poll.description}</p>
          )}
          
          {/* Meta Information */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>{poll.createdBy.name}</span>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(poll.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              <span>{poll.totalVotes} votes</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {poll.isActive && !isExpired ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <XCircleIcon className="h-3 w-3 mr-1" />
              {isExpired ? 'Expired' : 'Closed'}
            </span>
          )}
          
          {canManage && onToggleStatus && (
            <button
              onClick={() => onToggleStatus(poll.id, !poll.isActive)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {poll.isActive ? 'Close' : 'Reopen'}
            </button>
          )}
        </div>
      </div>

      {/* Event Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {poll.event.title}
        </span>
      </div>

      {/* Expiration Notice */}
      {poll.expiresAt && !isExpired && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Expires:</strong> {formatDate(poll.expiresAt)}
          </p>
        </div>
      )}

      {/* Poll Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = getOptionPercentage(option.votes);
          const isSelected = selectedOptions.includes(option.id);
          const userVotedForThis = poll.userVote?.includes(option.id);

          return (
            <div key={option.id} className="relative">
              {showResults ? (
                // Results View
                <div className="relative">
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{option.text}</span>
                      {userVotedForThis && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{option.votes} votes</span>
                      <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 rounded-b-md transition-all duration-300"
                       style={{ width: `${percentage}%` }}>
                  </div>
                </div>
              ) : (
                // Voting View
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={!poll.isActive || isExpired || isVoting}
                  className={`w-full text-left p-3 border rounded-md transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    !poll.isActive || isExpired || isVoting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{option.text}</span>
                    {poll.allowMultipleVotes && isSelected && (
                      <CheckCircleIcon className="h-4 w-4 text-indigo-500" />
                    )}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Voting Instructions */}
      {!showResults && poll.isActive && !isExpired && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 flex items-center">
            <LightBulbIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            {poll.allowMultipleVotes
              ? 'You can select multiple options for this poll.'
              : 'You can only select one option for this poll.'
            }
          </p>
        </div>
      )}

      {/* Results Summary */}
      {showResults && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total votes: {poll.totalVotes}</span>
            {hasVoted && (
              <span className="text-green-600 font-medium flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                You voted
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
