'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { logOut } from '@/lib/firebaseAuth';
import { getUserAuraStats, UserAuraStats } from '@/lib/auraPoints';
import { getUserQuestHistory, BADGES } from '@/lib/weeklyQuests';
import { getUserPurchases, PurchaseRecord } from '@/lib/rewardsStore';
import { getUserSquads, AuraSquad } from '@/lib/auraSquads';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  focusAreas?: string[];
  auraTotal?: number;
  createdAt?: { toDate?: () => Date } | null;
}

interface WellnessStats {
  totalJournalEntries: number;
  totalMeditations: number;
  totalWorkouts: number;
  totalAuraPosts: number;
  longestStreak: number;
  friendsCount: number;
}

const tabs = [
  { id: 'stats', label: 'Overview', icon: '📊', href: '/hub/profile' },
  { id: 'achievements', label: 'Achievements', icon: '🏆', href: '/hub/profile?tab=achievements' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
  { id: 'help', label: 'Help', icon: '❓', href: '/hub/profile?tab=help' },
];

export default function ProfileHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle, setBreadcrumbs } = useNavigation();
  const [activeTab, setActiveTab] = useState('stats');
  const [profile, setProfile] = useState<UserProfile>({});
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [wellnessStats, setWellnessStats] = useState<WellnessStats>({
    totalJournalEntries: 0,
    totalMeditations: 0,
    totalWorkouts: 0,
    totalAuraPosts: 0,
    longestStreak: 0,
    friendsCount: 0,
  });
  const [questHistory, setQuestHistory] = useState<{
    completed: number;
    totalPoints: number;
    badges: string[];
    currentQuests: Array<Record<string, unknown>>;
  }>({ completed: 0, totalPoints: 0, badges: [], currentQuests: [] });
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [userSquads, setUserSquads] = useState<AuraSquad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const tab = searchParams.get('tab') || 'stats';
    setActiveTab(tab);
    
    loadData();
    updateNavigationState(tab);
  }, [user, router, searchParams]);

  const updateNavigationState = (tab: string) => {
    switch (tab) {
      case 'achievements':
        setPageTitle('Achievements');
        setBreadcrumbs([{ label: 'Profile' }, { label: 'Achievements' }]);
        break;
      case 'settings':
        setPageTitle('Settings');
        setBreadcrumbs([{ label: 'Profile' }, { label: 'Settings' }]);
        break;
      case 'help':
        setPageTitle('Help & Support');
        setBreadcrumbs([{ label: 'Profile' }, { label: 'Help' }]);
        break;
      default:
        setPageTitle('Profile');
        setBreadcrumbs([{ label: 'Profile' }]);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const [userDoc, stats, history, userPurchases, squads] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getUserAuraStats(user.uid),
        getUserQuestHistory(user.uid),
        getUserPurchases(user.uid),
        getUserSquads(user.uid),
      ]);

      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }

      setUserStats(stats);
      setQuestHistory(history);
      setPurchases(userPurchases);
      setUserSquads(squads);

      // Mock wellness stats - would be calculated from actual data
      setWellnessStats({
        totalJournalEntries: Math.floor(Math.random() * 50) + 10,
        totalMeditations: Math.floor(Math.random() * 30) + 5,
        totalWorkouts: Math.floor(Math.random() * 25) + 3,
        totalAuraPosts: Math.floor(Math.random() * 20) + 2,
        longestStreak: stats?.longestStreak || 0,
        friendsCount: Math.floor(Math.random() * 15) + 2,
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await logOut();
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out');
      }
    }
  };

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.name || user?.displayName || 'Anonymous'}</h2>
            <p className="text-purple-100">@{profile.username || 'username'}</p>
            <p className="text-purple-200 text-sm">{profile.email || user?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                ✨ {userStats?.totalPoints || 0} Points
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                Level {userStats?.level || 1}
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Wellness Stats */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Your Wellness Journey</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl">
            <div className="text-2xl font-bold">{wellnessStats.totalJournalEntries}</div>
            <div className="text-rose-100 text-sm">Journal Entries</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl">
            <div className="text-2xl font-bold">{wellnessStats.totalMeditations}</div>
            <div className="text-emerald-100 text-sm">Meditations</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl">
            <div className="text-2xl font-bold">{wellnessStats.totalWorkouts}</div>
            <div className="text-pink-100 text-sm">Workouts</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl">
            <div className="text-2xl font-bold">{wellnessStats.friendsCount}</div>
            <div className="text-blue-100 text-sm">Friends</div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Achievements</h2>
          <Link
            href="/hub/profile?tab=achievements"
            className="text-purple-500 hover:text-purple-600 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        {userStats?.badges && userStats.badges.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {userStats.badges.slice(0, 6).map(badgeId => {
              const badge = BADGES[badgeId as keyof typeof BADGES];
              return badge ? (
                <div key={badgeId} className="text-center p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-bold">{badge.name}</div>
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-gray-500">Start your wellness journey to earn achievements!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/settings"
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <div className="font-medium text-sm">Settings</div>
        </Link>
        
        <Link
          href="/hub/profile?tab=help"
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
        >
          <div className="text-3xl mb-2">❓</div>
          <div className="font-medium text-sm">Help</div>
        </Link>
        
        <button className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center">
          <div className="text-3xl mb-2">📤</div>
          <div className="font-medium text-sm">Export Data</div>
        </button>
        
        <button
          onClick={handleSignOut}
          className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition text-center"
        >
          <div className="text-3xl mb-2">🚪</div>
          <div className="font-medium text-sm text-red-600">Sign Out</div>
        </button>
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{userStats?.badges?.length || 0}</div>
          <div className="text-yellow-100 text-sm">Badges Earned</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{questHistory.completed || 0}</div>
          <div className="text-purple-100 text-sm">Quests Done</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{userSquads.length}</div>
          <div className="text-blue-100 text-sm">Squads Joined</div>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Badge Collection</h2>
        
        {userStats?.badges && userStats.badges.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userStats.badges.map(badgeId => {
              const badge = BADGES[badgeId as keyof typeof BADGES];
              return badge ? (
                <div key={badgeId} className="text-center p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white hover:scale-105 transition">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-xs font-bold">{badge.name}</div>
                  <div className="text-xs opacity-80 mt-1">{badge.description}</div>
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">No badges yet</h3>
            <p className="text-gray-500 mb-4">Complete activities and quests to earn your first badge</p>
            <Link
              href="/hub/points?tab=earn"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
            >
              Start Earning 🚀
            </Link>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Wellness Milestones</h2>
        <div className="space-y-4">
          {[
            { label: 'First Journal Entry', completed: wellnessStats.totalJournalEntries > 0, icon: '📔' },
            { label: '7-Day Streak', completed: wellnessStats.longestStreak >= 7, icon: '🔥' },
            { label: '10 Meditations', completed: wellnessStats.totalMeditations >= 10, icon: '🧘' },
            { label: '5 Workouts', completed: wellnessStats.totalWorkouts >= 5, icon: '💪' },
            { label: 'First Friend', completed: wellnessStats.friendsCount > 0, icon: '👥' },
            { label: 'Join a Squad', completed: userSquads.length > 0, icon: '🏆' },
          ].map(milestone => (
            <div
              key={milestone.label}
              className={`flex items-center gap-4 p-4 rounded-xl ${
                milestone.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`text-3xl ${milestone.completed ? '' : 'opacity-50'}`}>
                {milestone.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${milestone.completed ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  {milestone.label}
                </h3>
              </div>
              {milestone.completed ? (
                <span className="text-green-600 font-bold">✅</span>
              ) : (
                <span className="text-gray-400">○</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="space-y-6">
      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Getting Started', desc: 'Learn how to use AuraX', icon: '🚀', color: 'from-blue-500 to-indigo-500' },
          { title: 'Points & Rewards', desc: 'Understand the gamification system', icon: '🏆', color: 'from-yellow-500 to-orange-500' },
          { title: 'Privacy & Security', desc: 'Manage your data and privacy', icon: '🔒', color: 'from-green-500 to-emerald-500' },
          { title: 'Community Guidelines', desc: 'How to interact respectfully', icon: '🤝', color: 'from-purple-500 to-pink-500' },
          { title: 'Troubleshooting', desc: 'Common issues and solutions', icon: '🔧', color: 'from-gray-500 to-slate-500' },
          { title: 'Contact Support', desc: 'Get help from our team', icon: '💬', color: 'from-cyan-500 to-blue-500' },
        ].map(item => (
          <div
            key={item.title}
            className={`p-6 bg-gradient-to-r ${item.color} text-white rounded-2xl hover:scale-105 transition cursor-pointer`}
          >
            <div className="text-4xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-white/80 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Data Management */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Data Management</h2>
        <div className="space-y-3">
          <button className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold">Export All Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download your complete wellness data</p>
            </div>
            <span className="text-2xl">📤</span>
          </button>
          
          <button className="w-full p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold">Privacy Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Control who sees your data</p>
            </div>
            <span className="text-2xl">🔒</span>
          </button>
          
          <button className="w-full p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-semibold text-red-700 dark:text-red-300">Delete Account</h3>
              <p className="text-sm text-red-600 dark:text-red-400">Permanently remove all data</p>
            </div>
            <span className="text-2xl">🗑️</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">About AuraX</h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Version 2.0.0</p>
          <p>Your mental wellness companion with gamified journaling, social connections, and mindfulness tools.</p>
          <div className="flex gap-4 mt-4">
            <button className="text-purple-500 hover:text-purple-600 font-medium">Privacy Policy</button>
            <button className="text-purple-500 hover:text-purple-600 font-medium">Terms of Service</button>
            <button className="text-purple-500 hover:text-purple-600 font-medium">Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 md:px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium hidden sm:inline">{tab.label}</span>
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'achievements' && renderStatsTab()} {/* Reusing stats for now */}
        {activeTab === 'help' && renderHelpTab()}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Link
              href="/settings"
              className="inline-block px-8 py-4 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition"
            >
              Go to Settings ⚙️
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}