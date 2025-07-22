'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { pollsService, authService } from '@/lib/services';
import { ChartBarIcon, UserIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PollResult {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  voters?: {
    id: string;
    name: string;
    email: string;
    votedAt: string;
  }[];
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  totalVotes: number;
  endDate?: string;
  allowMultiple: boolean;
  createdBy: {
    id: string;
    name: string;
  };
}

interface PollResults {
  success: boolean;
  poll: Poll;
  results: PollResult[];
  canViewDetails: boolean;
}

export default function PollResultsPage() {
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;

  useEffect(() => {
    if (pollId) {
      fetchPollResults();
      fetchCurrentUser();
    }
  }, [pollId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchPollResults = async () => {
    try {
      const response = await pollsService.getResults(pollId);
      setPollResults(response);
    } catch (error: any) {
      console.error('Failed to fetch poll results:', error);
      setError(error.response?.data?.message || 'Failed to load poll results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !pollResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load poll results</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            href="/polls"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  const { poll, results, canViewDetails } = pollResults;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/polls"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Poll Results</h1>
                <p className="mt-1 text-sm text-gray-500">Detailed voting results</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Poll Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{poll.title}</h2>
              {poll.description && (
                <p className="text-gray-600 mt-2">{poll.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{poll.totalVotes}</div>
              <div className="text-sm text-gray-500">Total Votes</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Created by {poll.createdBy.name}
            </div>
            {poll.endDate && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Ends {new Date(poll.endDate).toLocaleDateString()}
              </div>
            )}
            {poll.allowMultiple && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Multiple Choice
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {results.map((option, index) => (
            <div key={option.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{option.text}</h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{option.votes}</div>
                  <div className="text-sm text-gray-500">{option.percentage}%</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === 0 ? 'bg-indigo-600' :
                    index === 1 ? 'bg-green-600' :
                    index === 2 ? 'bg-yellow-600' :
                    index === 3 ? 'bg-red-600' :
                    'bg-purple-600'
                  }`}
                  style={{ width: `${option.percentage}%` }}
                ></div>
              </div>

              {/* Voter details (only for poll creators and admins) */}
              {canViewDetails && option.voters && option.voters.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Voters ({option.voters.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {option.voters.map((voter) => (
                      <div key={voter.id} className="flex items-center p-2 bg-gray-50 rounded">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {voter.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {voter.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(voter.votedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No votes message */}
        {poll.totalVotes === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No votes yet</h3>
            <p className="text-gray-500">Be the first to vote on this poll!</p>
            <Link
              href={`/polls`}
              className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Back to Polls
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
