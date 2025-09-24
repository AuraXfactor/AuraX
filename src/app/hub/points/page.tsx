'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getUserAuraStats,
  getRecentTransactions,
  listenToUserAuraStats,
  UserAuraStats,
  AuraPointTransaction,
} from '@/lib/auraPoints';
import {
  getActiveQuests,
  enrollInQuest,
  WeeklyQuest,
  BADGES,
} from '@/lib/weeklyQuests';
import {
  getFeaturedRewards,
  claimReward,
  Reward,
} from '@/lib/rewardsStore';
import { getUserSquads, AuraSquad } from '@/lib/auraSquads';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊', href: '/hub/points' },
  { id: 'earn', label: 'Earn', icon: '💰', href: '/hub/points?tab=earn' },
  { id: 'rewards', label: 'Rewards', icon: '🏪', href: '/hub/points?tab=rewards' },
  { id: 'quests', label: 'Quests', icon: '⭐', href: '/hub/points?tab=quests' },
  { id: 'squads', label: 'Squads', icon: '👥', href: '/squads' },
];

function PointsHubContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle, setBreadcrumbs } = useNavigation();
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [transactions, setTransactions] = useState<AuraPointTransaction[]>([]);
  const [activeQuests, setActiveQuests] = useState<WeeklyQuest[]>([]);
  const [featuredRewards, setFeaturedRewards] = useState<{
    affordable?: Reward[];
    limited?: Reward[];
    popular?: Reward[];
    newArrivals?: Reward[];
  }>({});
  const [userSquads, setUserSquads] = useState<AuraSquad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
    
    loadData();
    updateNavigationState(tab);
    
    // Listen to real-time stats updates
    const unsubscribe = listenToUserAuraStats(user.uid, (stats) => {
      setUserStats(stats);
    });
    
    return () => unsubscribe();
  }, [user, router, searchParams]);

  const updateNavigationState = (tab: string) => {
    switch (tab) {
      case 'earn':
        setPageTitle('Earn Points');
        setBreadcrumbs([{ label: 'Points' }, { label: 'Earn' }]);
        break;
      case 'rewards':
        setPageTitle('Rewards Store');
        setBreadcrumbs([{ label: 'Points' }, { label: 'Rewards' }]);
        break;
      case 'quests':
        setPageTitle('Weekly Quests');
        setBreadcrumbs([{ label: 'Points' }, { label: 'Quests' }]);
        break;
      case 'squads':
        setPageTitle('Aura Squads');
        setBreadcrumbs([{ label: 'Points' }, { label: 'Squads' }]);
        break;
      default:
        setPageTitle('Aura Points');
        setBreadcrumbs([{ label: 'Points' }]);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const [stats, recentTransactions, quests, rewards, squads] = await Promise.all([
        getUserAuraStats(user.uid),
        getRecentTransactions(user.uid, 5),
        getActiveQuests(),
        getFeaturedRewards(),
        getUserSquads(user.uid),
      ]);

      setUserStats(stats);
      setTransactions(recentTransactions);
      setActiveQuests(quests);
      setFeaturedRewards(rewards);
      setUserSquads(squads);
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!user) return;
    
    try {
      const result = await claimReward(user, rewardId);
      if (result.success) {
        alert(result.message);
        await loadData(); // Refresh data
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward');
    }
  };

  const handleEnrollQuest = async (questId: string) => {
    if (!user) return;
    
    try {
      const success = await enrollInQuest(user, questId);
      if (success) {
        alert('Enrolled in quest! 🚀');
        await loadData();
      } else {
        alert('Failed to enroll in quest');
      }
    } catch (error) {
      console.error('Error enrolling in quest:', error);
      alert('Failed to enroll in quest');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Points Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2">{userStats?.availablePoints?.toLocaleString() || 0}</div>
          <div className="text-purple-100 text-lg">Available Aura Points</div>
          <div className="text-purple-200 text-sm mt-2">
            Daily: {userStats?.dailyPointsEarned || 0}/50 • Level {userStats?.level || 1}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats?.currentStreak || 0}</div>
            <div className="text-purple-100 text-sm">Day Streak 🔥</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats?.badges?.length || 0}</div>
            <div className="text-purple-100 text-sm">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats?.lifetimeEarned || 0}</div>
            <div className="text-purple-100 text-sm">Total Earned</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {transactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  +{transaction.points}
                </div>
                <div>
                  <p className="font-medium text-sm">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
              {transaction.multiplier && transaction.multiplier > 1 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  {transaction.multiplier}x
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/journal"
          className="p-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl hover:from-rose-600 hover:to-orange-600 transition text-center"
        >
          <div className="text-3xl mb-2">📔</div>
          <div className="font-bold text-sm">Journal</div>
          <div className="text-rose-100 text-xs">+10 pts</div>
        </Link>
        
        <Link
          href="/toolkit/meditations"
          className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition text-center"
        >
          <div className="text-3xl mb-2">🧘</div>
          <div className="font-bold text-sm">Meditate</div>
          <div className="text-emerald-100 text-xs">+15 pts</div>
        </Link>
        
        <Link
          href="/aura"
          className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition text-center"
        >
          <div className="text-3xl mb-2">✨</div>
          <div className="font-bold text-sm">Share Aura</div>
          <div className="text-purple-100 text-xs">+5 pts</div>
        </Link>
        
        <Link
          href="/squads"
          className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition text-center"
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="font-bold text-sm">Squads</div>
          <div className="text-blue-100 text-xs">+25-100 pts</div>
        </Link>
      </div>
    </div>
  );

  const renderEarnTab = () => (
    <div className="space-y-6">
      {/* Daily Progress */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Today&apos;s Progress</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Daily Points</span>
            <span>{userStats?.dailyPointsEarned || 0} / 50</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(((userStats?.dailyPointsEarned || 0) / 50) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Journal', status: 'pending', points: 10, icon: '📔' },
            { label: 'Meditation', status: 'completed', points: 15, icon: '🧘' },
            { label: 'Share Aura', status: 'pending', points: 5, icon: '✨' },
            { label: 'Support Friend', status: 'completed', points: 3, icon: '🤗' },
          ].map(activity => (
            <div
              key={activity.label}
              className={`p-3 rounded-xl border text-center ${
                activity.status === 'completed'
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="text-2xl mb-1">{activity.icon}</div>
              <div className="font-medium text-sm">{activity.label}</div>
              <div className={`text-xs ${
                activity.status === 'completed' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {activity.status === 'completed' ? '✅ Done' : `+${activity.points} pts`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Point Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { activity: 'Write Journal Entry', points: 10, desc: 'Express your thoughts (50+ words)', icon: '📔', link: '/journal', difficulty: 'easy' },
          { activity: 'Complete Meditation', points: 15, desc: 'Finish 80% of guided session', icon: '🧘', link: '/toolkit/meditations', difficulty: 'medium' },
          { activity: 'Finish Workout', points: 15, desc: 'Complete wellness exercise', icon: '💪', link: '/toolkit/workouts', difficulty: 'medium' },
          { activity: 'Share Aura Post', points: 5, desc: 'Share a 24h glimpse with friends', icon: '✨', link: '/aura', difficulty: 'easy' },
          { activity: 'Support a Friend', points: 3, desc: 'React to friend&apos;s Aura post', icon: '🤗', link: '/aura', difficulty: 'easy' },
          { activity: '7-Day Streak', points: 50, desc: 'Maintain journaling consistency', icon: '🔥', link: '/journal', difficulty: 'hard' },
        ].map(item => (
          <Link
            key={item.activity}
            href={item.link}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl group-hover:scale-110 transition">{item.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{item.activity}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-purple-500">+{item.points}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Daily Wisdom */}
      <div className="p-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl">
        <h3 className="font-bold text-lg mb-2">💡 Daily Wisdom</h3>
        <p className="text-amber-100">
          Focus on consistency over quantity! You can earn up to 50 points daily. 
          Quality self-care matters more than racing for points. 🌟
        </p>
      </div>
    </div>
  );

  const renderRewardsTab = () => (
    <div className="space-y-6">
      {/* Points Balance */}
      <div className="text-center p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl">
        <div className="text-4xl font-bold">{userStats?.availablePoints?.toLocaleString() || 0}</div>
        <div className="text-yellow-100">Points to Spend</div>
      </div>

      {/* Featured Rewards */}
      {featuredRewards.affordable && featuredRewards.affordable.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">🛍️ Affordable Treats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredRewards.affordable.slice(0, 4).map((reward: Reward) => (
              <div key={reward.id} className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{reward.title}</h3>
                  <span className="text-2xl font-bold text-green-600">{reward.cost}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{reward.description}</p>
                <button
                  onClick={() => handleClaimReward(reward.id)}
                  disabled={!userStats || userStats.availablePoints < reward.cost}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {userStats && userStats.availablePoints >= reward.cost ? 'Claim Now' : 'Need More Points'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Rewards Button */}
      <div className="text-center">
        <Link
          href="/aura-points?tab=rewards"
          className="inline-block px-8 py-4 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition"
        >
          Browse All Rewards 🏪
        </Link>
      </div>
    </div>
  );

  const renderQuestsTab = () => (
    <div className="space-y-6">
      <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl">
        <h2 className="text-xl font-bold mb-2">Weekly Quests</h2>
        <p className="text-blue-100">Special challenges for bonus points and exclusive rewards</p>
      </div>

      <div className="space-y-4">
        {activeQuests.slice(0, 3).map(quest => (
          <div
            key={quest.id}
            className={`p-6 rounded-2xl border-2 ${
              quest.difficulty === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' :
              quest.difficulty === 'hard' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              quest.difficulty === 'medium' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{quest.title}</h3>
                <p className="text-sm opacity-80">{quest.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                quest.difficulty === 'legendary' ? 'bg-white/20 text-white' :
                quest.difficulty === 'hard' ? 'bg-red-200 text-red-800' :
                quest.difficulty === 'medium' ? 'bg-blue-200 text-blue-800' :
                'bg-green-200 text-green-800'
              }`}>
                {quest.difficulty.toUpperCase()}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>0 / {quest.requirement.target}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold">+{quest.reward.points}</span>
                <span className="text-sm opacity-80 ml-1">points</span>
              </div>
              <button
                onClick={() => handleEnrollQuest(quest.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  quest.difficulty === 'legendary' ? 'bg-white/20 hover:bg-white/30 text-white' :
                  'bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                Enroll
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSquadsTab = () => (
    <div className="space-y-6">
      {/* Squad Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userSquads.map(squad => (
          <Link
            key={squad.id}
            href={`/squads/${squad.id}`}
            className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {squad.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold">{squad.name}</h3>
                <p className="text-sm text-gray-500">{squad.members.length} members</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Points</span>
                <span className="font-bold text-purple-500">{squad.totalPoints.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Squad Level</span>
                <span className="font-bold">{squad.level}</span>
              </div>
            </div>
            
            {squad.currentChallenge && (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  🏆 {squad.currentChallenge.title}
                </p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1 mt-2">
                  <div 
                    className="bg-blue-500 h-1 rounded-full"
                    style={{ width: `${(squad.currentChallenge.currentProgress / squad.currentChallenge.target) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
      
      {userSquads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">Join Your First Squad</h3>
          <p className="text-gray-500 mb-4">Collaborate with friends on wellness challenges</p>
          <Link
            href="/squads/create"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
          >
            Create Squad 🚀
          </Link>
        </div>
      )}
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
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'earn' && renderEarnTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
        {activeTab === 'quests' && renderQuestsTab()}
        {activeTab === 'squads' && renderSquadsTab()}
      </div>
    </div>
  );
}

export default function PointsHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <PointsHubContent />
    </Suspense>
  );
}