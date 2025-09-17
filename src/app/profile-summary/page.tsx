'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import Link from 'next/link';

interface UserProfile {
  name: string;
  username: string;
  email: string;
  avatar: string;
  focusAreas: string[];
  preferredTherapy: string;
  reminderTime: string;
  moodBaseline: string[];
  auraPoints: number;
  createdAt: Date;
  lastLogin: Date;
}

const focusAreaLabels: { [key: string]: { label: string; icon: string } } = {
  'stress-relief': { label: 'Stress Relief', icon: '🧘‍♀️' },
  'addiction-recovery': { label: 'Addiction Recovery', icon: '💪' },
  'better-sleep': { label: 'Better Sleep', icon: '😴' },
  'productivity-focus': { label: 'Productivity & Focus', icon: '🎯' },
  'relationships-connection': { label: 'Relationships & Connection', icon: '💝' },
  'self-love-confidence': { label: 'Self-Love & Confidence', icon: '✨' }
};

export default function ProfileSummary() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        router.push('/signup');
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile as UserProfile);
        } else {
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        router.push('/onboarding');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Celebration Animation */}
        <div className="text-center mb-8 animate-pop">
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-6xl shadow-2xl animate-pop">
              {profile.avatar}
            </div>
            
            {/* Floating celebration emojis */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="absolute top-1/2 -right-6 text-xl animate-bounce" style={{ animationDelay: '1s' }}>🌟</div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8 animate-pop" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome, {profile.name}!
          </h1>
          <p className="text-lg text-gray-600">
            Your Aura journey starts now 🌟
          </p>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 animate-pop" style={{ animationDelay: '0.6s' }}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                {profile.avatar}
              </div>
              <div>
                <h3 className="text-xl font-bold">{profile.name}</h3>
                <p className="text-gray-600">@{profile.username}</p>
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Your Focus Areas</h4>
              <div className="space-y-2">
                {profile.focusAreas.map((areaId) => {
                  const area = focusAreaLabels[areaId];
                  return (
                    <div key={areaId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                      <span className="text-xl">{area.icon}</span>
                      <span className="font-medium">{area.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mood Baseline */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Your Current Vibe</h4>
              <div className="flex gap-2">
                {profile.moodBaseline.map((emoji, index) => (
                  <div key={index} className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-xl">
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Aura Points */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">Aura Points</h4>
                  <p className="text-sm text-gray-600">Start your journey!</p>
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {profile.auraPoints}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {profile.preferredTherapy && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-2xl p-3">
                <span className="font-medium">Preferred therapy:</span> {profile.preferredTherapy}
              </div>
            )}
            
            <div className="text-sm text-gray-600 bg-gray-50 rounded-2xl p-3">
              <span className="font-medium">Journal reminders:</span> {profile.reminderTime}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 animate-pop" style={{ animationDelay: '0.9s' }}>
          <Link 
            href="/journal"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 px-6 rounded-2xl font-medium text-center block hover:scale-105 transition-transform shadow-lg"
          >
            Start Your First Journal Entry ✍️
          </Link>
          
          <Link 
            href="/toolkit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 px-6 rounded-2xl font-medium text-center block hover:scale-105 transition-transform shadow-lg"
          >
            Explore Wellness Toolkit 🧘‍♀️
          </Link>
          
          <Link 
            href="/"
            className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-2xl font-medium text-center block hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Motivational Footer */}
        <div className="text-center mt-8 animate-pop" style={{ animationDelay: '1.2s' }}>
          <p className="text-sm text-gray-500">
            You're all set! Let's make today amazing 🚀
          </p>
        </div>
      </div>
    </div>
  );
}