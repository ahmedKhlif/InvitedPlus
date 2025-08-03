import Link from 'next/link';
import { CalendarIcon, ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function HomePage() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-primary-200">Invited+</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              A smart, collaborative, invite-only event & task management platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn-primary text-lg px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="btn-outline text-lg px-8 py-3 rounded-lg font-semibold border-white text-white hover:bg-white hover:text-primary-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From planning to execution, Invited+ provides all the tools you need for successful events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<CalendarIcon className="h-8 w-8" />}
              title="Event Management"
              description="Create, manage, and track public or private events with ease"
            />
            <FeatureCard
              icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
              title="Task Management"
              description="Organize tasks with drag-and-drop boards and real-time collaboration"
            />
            <FeatureCard
              icon={<ChatBubbleLeftRightIcon className="h-8 w-8" />}
              title="Real-time Chat"
              description="Stay connected with live chat, announcements, and polls"
            />
            <FeatureCard
              icon={<UsersIcon className="h-8 w-8" />}
              title="Invite System"
              description="Manage invitations with unique codes and RSVP tracking"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of event organizers who trust Invited+
          </p>
          <Link
            href="/auth/signup"
            className="btn-primary text-lg px-8 py-3 rounded-lg font-semibold"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="text-primary-600 mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
