'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const JOURNAL_TYPES = [
  {
    id: 'daily-checkin',
    title: 'Daily Check-In',
    subtitle: 'Comprehensive daily emotional and mental check-in',
    description: 'Express your feelings, track gratitude, and reflect on your day with guided prompts',
    icon: '📔',
    color: 'from-rose-500 to-pink-500',
    href: '/journals/daily-checkin',
    components: ['Mood Tracker', 'Heart Speak', 'Gratitude', 'Self-Care Activities', 'Letting Go']
  },
  {
    id: 'cbt-therapy',
    title: 'Thought Reframe',
    subtitle: 'Cognitive Behavioral Therapy-based thought restructuring',
    description: 'Challenge negative thoughts and develop balanced perspectives with CBT techniques',
    icon: '🧠',
    color: 'from-blue-500 to-indigo-500',
    href: '/journals/cbt-therapy',
    components: ['Situation Analysis', 'Emotion Rating', 'Thought Challenging', 'Evidence Review', 'Action Planning']
  },
  {
    id: 'gratitude',
    title: 'Thankful Heart',
    subtitle: 'Deep gratitude practice and abundance mindset cultivation',
    description: 'Cultivate appreciation, recognize abundance, and celebrate life\'s blessings',
    icon: '🙏',
    color: 'from-yellow-500 to-orange-500',
    href: '/journals/gratitude',
    components: ['Daily Highlight', 'Gratitude Deep Dive', 'Person Appreciation', 'Abundance Reflection']
  },
  {
    id: 'relationship',
    title: 'Connection Matters',
    subtitle: 'Tracking and improving interpersonal relationships',
    description: 'Strengthen bonds, improve communication, and nurture meaningful connections',
    icon: '💕',
    color: 'from-purple-500 to-pink-500',
    href: '/journals/relationship',
    components: ['Relationship Selection', 'Interaction Quality', 'Communication Check', 'Memory Keeper']
  },
  {
    id: 'goal-achievement',
    title: 'Progress Tracker',
    subtitle: 'Goal setting, progress tracking, and milestone celebration',
    description: 'Stay focused on your goals, track progress, and celebrate achievements',
    icon: '🎯',
    color: 'from-green-500 to-emerald-500',
    href: '/journals/goal-achievement',
    components: ['Progress Tracking', 'Obstacle Management', 'Milestone Recognition', 'Action Planning']
  }
];

export default function JournalSelectionPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              Choose Your Journal ✨
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Each journal is designed for specific wellness goals. Pick the one that resonates with your current needs.
          </p>
        </div>

        {/* Quick Access Button */}
        <div className="text-center mb-8">
          <Link
            href="/journal"
            className="inline-block px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            ← Back to Original Journal
          </Link>
        </div>

        {/* Journal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {JOURNAL_TYPES.map((journal) => (
            <Link
              key={journal.id}
              href={journal.href}
              className="group block"
            >
              <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${journal.color} text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}>
                {/* Icon */}
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  {journal.icon}
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold mb-2">{journal.title}</h2>
                <p className="text-white/90 text-sm font-medium mb-4">{journal.subtitle}</p>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">{journal.description}</p>

                {/* Components Preview */}
                <div className="space-y-2">
                  <p className="text-white/90 text-sm font-medium">Key Components:</p>
                  <div className="flex flex-wrap gap-1">
                    {journal.components.map((component, index) => (
                      <span
                        key={index}
                        className="text-xs bg-white/20 px-2 py-1 rounded-full"
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold mb-4">Not Sure Which Journal to Choose?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">🌅 New to Journaling?</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Start with <strong>Daily Check-In</strong> for a gentle introduction</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
              <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🧠 Working Through Stress?</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">Try <strong>Thought Reframe</strong> for CBT techniques</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎯 Pursuing Goals?</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Use <strong>Progress Tracker</strong> to stay focused</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}