'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      text: "Invited+ transformed how we organize our community events. The secure invitation system is a game-changer!",
      author: "Sarah Chen",
      role: "Community Manager",
      avatar: "👩‍💼"
    },
    {
      text: "The real-time collaboration features make event planning so much smoother. Our team loves it!",
      author: "Marcus Johnson",
      role: "Event Coordinator",
      avatar: "👨‍💻"
    },
    {
      text: "Finally, an event platform that understands privacy and security. Perfect for our corporate events.",
      author: "Elena Rodriguez",
      role: "Corporate Events Director",
      avatar: "👩‍💼"
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 animate-pulse">
            <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
                <Image
                  src="/InvitedPlusLogo.png"
                  alt="Invited+ Logo"
                  width={120}
                  height={120}
                  className="relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Welcome to <span className="text-yellow-300 animate-pulse">Invited+</span>
            </h1>

            <div className="flex items-center justify-center mb-6">
              <SparklesIcon className="h-6 w-6 text-yellow-300 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-xl md:text-3xl text-blue-100 font-light">
                Where Events Come to Life
              </p>
              <SparklesIcon className="h-6 w-6 text-yellow-300 ml-2 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            </div>

            <p className="text-lg md:text-xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              A smart, collaborative, invite-only event & task management platform that transforms how you plan, organize, and execute unforgettable experiences. Join thousands of event organizers who trust Invited+ to bring their visions to life.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/auth/signup"
                className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300 hover:from-pink-600 hover:to-purple-700"
              >
                <BoltIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                Get Started Free
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Link>

              <Link
                href="/auth/login"
                className="group inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
              >
                <HeartIcon className="h-5 w-5 mr-2 group-hover:text-pink-300 transition-colors" />
                Sign In
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-blue-200">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                <span className="text-sm">Real-time Collaboration</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
                <span className="text-sm">10,000+ Happy Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-6">
              Everything you need to create magic
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From planning to execution, Invited+ provides all the tools you need for successful events.
              Experience the future of event management with our cutting-edge features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <FeatureCard
              icon={<CalendarIcon className="h-10 w-10" />}
              title="Smart Event Management"
              description="Create, manage, and track public or private events with AI-powered insights and automated workflows"
              gradient="from-blue-500 to-cyan-500"
              delay="0"
            />
            <FeatureCard
              icon={<ClipboardDocumentListIcon className="h-10 w-10" />}
              title="Advanced Task Boards"
              description="Organize tasks with drag-and-drop Kanban boards, real-time collaboration, and progress tracking"
              gradient="from-green-500 to-emerald-500"
              delay="100"
            />
            <FeatureCard
              icon={<ChatBubbleLeftRightIcon className="h-10 w-10" />}
              title="Live Communication"
              description="Stay connected with real-time chat, voice messages, file sharing, and interactive polls"
              gradient="from-purple-500 to-pink-500"
              delay="200"
            />
            <FeatureCard
              icon={<ShieldCheckIcon className="h-10 w-10" />}
              title="Secure Invitations"
              description="Manage invitations with encrypted tokens, email verification, and advanced RSVP tracking"
              gradient="from-orange-500 to-red-500"
              delay="300"
            />
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-t border-gray-200">
            <StatCard number="10,000+" label="Happy Users" />
            <StatCard number="50,000+" label="Events Created" />
            <StatCard number="99.9%" label="Uptime" />
            <StatCard number="24/7" label="Support" />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by event organizers worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say about Invited+
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </blockquote>

              <div className="flex items-center justify-center">
                <div className="text-4xl mr-4">{testimonials[currentTestimonial].avatar}</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].author}</div>
                  <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-indigo-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-24 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <SparklesIcon className="h-16 w-16 text-yellow-300 mx-auto mb-6 animate-spin" style={{ animationDuration: '4s' }} />
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Ready to create magic?
            </h2>
            <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of event organizers who trust Invited+ to bring their visions to life.
              Start your journey today and experience the future of event management.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/auth/signup"
              className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300 hover:from-pink-600 hover:to-purple-700"
            >
              <BoltIcon className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              Start Free Today
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

            <Link
              href="/auth/login"
              className="group inline-flex items-center justify-center px-12 py-5 text-xl font-semibold text-white border-2 border-white/30 rounded-full backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              <HeartIcon className="h-6 w-6 mr-3 group-hover:text-pink-300 transition-colors" />
              Welcome Back
            </Link>
          </div>

          {/* Final Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200 text-sm">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-400" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-400" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: string;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>

      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
        {number}
      </div>
      <div className="text-gray-600 font-medium">
        {label}
      </div>
    </div>
  );
}
