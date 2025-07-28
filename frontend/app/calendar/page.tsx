'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsService, authService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  _count?: {
    attendees: number;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    title: string;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const router = useRouter();
  const { canCreateEvent } = usePermissions();

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const response = await authService.getCalendarData(month, year);
        if (response.success) {
          setEvents(response.events || []);
          setTasks(response.tasks || []);
        } else {
          // Fallback to events only
          const eventsResponse = await eventsService.getEvents({ limit: 100 });
          setEvents(eventsResponse.events);
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        // Fallback to events only
        try {
          const eventsResponse = await eventsService.getEvents({ limit: 100 });
          setEvents(eventsResponse.events);
          setTasks([]);
        } catch (fallbackError) {
          console.error('Failed to fetch events:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];

    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CalendarIcon className="h-8 w-8 mr-3" />
                  Event Calendar
                </h1>
                <p className="mt-1 text-sm text-gray-500">View and manage your events and tasks</p>
              </div>
            </div>
            {canCreateEvent() && (
              <button
                onClick={() => router.push('/events/create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create Event
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

        {/* Calendar Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ←
                </button>
                <h2 className="text-xl font-semibold">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  →
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1 rounded ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const dayTasks = getTasksForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-200 ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'
                    } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              onClick={() => router.push(`/events/${event.id}`)}
                              className="text-xs p-1 bg-indigo-100 text-indigo-800 rounded cursor-pointer hover:bg-indigo-200 truncate"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
                            </div>
                          )}

                          {/* Tasks for this date */}
                          {dayTasks.slice(0, 2).map(task => (
                            <div
                              key={task.id}
                              onClick={() => router.push(`/tasks/${task.id}`)}
                              className={`text-xs p-1 rounded cursor-pointer truncate ${
                                task.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : task.priority === 'HIGH' || task.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              📋 {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayTasks.length - 2} more tasks
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {events
                  .filter(event => new Date(event.startDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <CalendarIcon className="h-8 w-8 text-indigo-600 mr-4" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}
                          {event.location && (
                            <>
                              <MapPinIcon className="h-4 w-4 ml-4 mr-1" />
                              {event.location}
                            </>
                          )}
                          {event._count && (
                            <>
                              <UsersIcon className="h-4 w-4 ml-4 mr-1" />
                              {event._count.attendees} attendees
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {events.filter(event => new Date(event.startDate) >= new Date()).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No upcoming events</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
