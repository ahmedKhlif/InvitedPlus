'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, pollsService, eventsService, Poll, Event } from '@/lib/services';
import { ChartBarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    eventId: '',
    allowMultiple: false,
    options: ['', '']
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const profileResponse = await authService.getProfile();
        setUser(profileResponse.user);

        // Fetch polls and events
        const [pollsResponse, eventsResponse] = await Promise.all([
          pollsService.getPolls(),
          eventsService.getEvents()
        ]);

        setPolls(pollsResponse.polls);
        setEvents(eventsResponse.events);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pollData = {
        title: newPoll.title,
        eventId: newPoll.eventId || undefined,
        allowMultiple: newPoll.allowMultiple,
        options: newPoll.options.filter(option => option.trim())
      };

      await pollsService.createPoll(pollData);
      setShowCreateModal(false);
      setNewPoll({ title: '', eventId: '', allowMultiple: false, options: ['', ''] });
      
      // Refresh polls
      const pollsResponse = await pollsService.getPolls();
      setPolls(pollsResponse.polls);
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await pollsService.vote(pollId, { optionId });

      // Show success message
      alert('Vote submitted successfully!');

      // Refresh polls to show updated vote counts
      const pollsResponse = await pollsService.getPolls();
      setPolls(pollsResponse.polls);
    } catch (error: any) {
      console.error('Failed to vote:', error);
      const errorMessage = error.response?.data?.message || 'Failed to vote';
      alert(errorMessage);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      await pollsService.deletePoll(pollId);
      alert('Poll deleted successfully!');

      // Refresh polls list
      const pollsResponse = await pollsService.getPolls();
      setPolls(pollsResponse.polls);
    } catch (error: any) {
      console.error('Failed to delete poll:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete poll';
      alert(errorMessage);
    }
  };

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const canCreatePolls = user?.role === 'ADMIN' || user?.role === 'ORGANIZER';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Polls</h1>
                <p className="mt-1 text-sm text-gray-500">Create and participate in polls</p>
              </div>
            </div>
            {canCreatePolls && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create Poll
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
            <p className="text-gray-500 mb-4">
              {canCreatePolls ? 'Create your first poll to get started!' : 'No polls available at the moment.'}
            </p>
            {canCreatePolls && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create Poll
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                    {poll.event && (
                      <p className="text-sm text-gray-500">Event: {poll.event.title}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {poll._count?.votes || 0} votes • Created {new Date(poll.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(!poll.endDate || new Date(poll.endDate) > new Date()) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                    {poll.allowMultiple && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Multiple Choice
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => router.push(`/polls/${poll.id}/results`)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View Results
                      </button>

                      {/* Poll management buttons for creators and admins */}
                      {(user?.role === 'ADMIN' || poll.createdBy.id === user?.id) && (
                        <>
                          <button
                            onClick={() => handleDeletePoll(poll.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {poll.options.map((option) => {
                    const totalVotes = poll._count?.votes || 0;
                    const optionVotes = option._count?.votes || 0;
                    const percentage = totalVotes > 0
                      ? Math.round((optionVotes / totalVotes) * 100)
                      : 0;

                    // Check if user has already voted for this option
                    const hasUserVoted = option.votes && option.votes.length > 0;
                    const isPollClosed = !!(poll.endDate && new Date(poll.endDate) <= new Date());
                    const canVote = !isPollClosed && !hasUserVoted;

                    return (
                      <div key={option.id} className="relative">
                        <button
                          onClick={() => canVote ? handleVote(poll.id, option.id) : null}
                          disabled={!canVote}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            hasUserVoted
                              ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500'
                              : canVote
                              ? 'hover:bg-gray-50 border-gray-200'
                              : 'bg-gray-50 border-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {option.text}
                              {hasUserVoted && (
                                <span className="ml-2 text-indigo-600 font-semibold">✓ Your Vote</span>
                              )}
                            </span>
                            <span className="text-sm text-gray-500">
                              {optionVotes} votes ({percentage}%)
                            </span>
                          </div>
                          {totalVotes > 0 && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Poll</h3>
              <form onSubmit={handleCreatePoll} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Question</label>
                  <input
                    type="text"
                    required
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="What's your question?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Event (Optional)</label>
                  <select
                    value={newPoll.eventId}
                    onChange={(e) => setNewPoll({ ...newPoll, eventId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Global Poll</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPoll.allowMultiple}
                      onChange={(e) => setNewPoll({ ...newPoll, allowMultiple: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow multiple selections</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Option ${index + 1}`}
                      />
                      {newPoll.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create Poll
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
