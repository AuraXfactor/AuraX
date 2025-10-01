'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
  getUserQuestProgress,
  enrollInQuest,
  WeeklyQuest,
  BADGES,
} from '@/lib/weeklyQuests';
import {
  getAvailableRewards,
  getFeaturedRewards,
  canUserClaimReward,
  claimReward,
  Reward,
} from '@/lib/rewardsStore';
import { getUserSquads, getSquadLeaderboards, AuraSquad } from '@/lib/auraSquads';
import AuraBoost from '@/components/AuraBoost';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '✨' },
  { id: 'earn', label: 'Earn Points', icon: '💰' },
  { id: 'rewards', label: 'Rewards Store', icon: '🏪' },
  { id: 'quests', label: 'Weekly Quests', icon: '⭐' },
  { id: 'squads', label: 'Aura Squads', icon: '👥' },
];

export default function AuraPointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [transactions, setTransactions] = useState<AuraPointTransaction[]>([]);
  const [activeQuests, setActiveQuests] = useState<WeeklyQuest[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [featuredRewards, setFeaturedRewards] = useState<{
    newArrivals?: Reward[];
    popular?: Reward[];
    limited?: Reward[];
    affordable?: Reward[];
  }>({});
  const [userSquads, setUserSquads] = useState<AuraSquad[]>([]);
  const [leaderboards, setLeaderboards] = useState<{
    topSquads?: Array<AuraSquad & { rank: number }>;
  }>({});
  const [loading, setLoading] = useState(true);
  const [boostPoints, setBoostPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadData();
    
    // Listen to real-time stats updates
    const unsubscribe = listenToUserAuraStats(user.uid, (stats) => {
      setUserStats(stats);
    });
    
    return () => unsubscribe();
  }, [user, router]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [
        stats,
        recentTransactions,
        quests,
        availableRewards,
        featured,
        squads,
        leaderboard,
      ] = await Promise.all([
        getUserAuraStats(user.uid),
        getRecentTransactions(user.uid),
        getActiveQuests(),
        getAvailableRewards(1),
        getFeaturedRewards(),
        getUserSquads(user.uid),
        getSquadLeaderboards(),
      ]);
      
      setUserStats(stats);
      setTransactions(recentTransactions);
      setActiveQuests(quests);
      setRewards(availableRewards);
      setFeaturedRewards(featured);
      setUserSquads(squads);
      setLeaderboards(leaderboard);
    } catch (error) {
      console.error('Error loading data:', error);
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
        alert('Enrolled in quest! Check your progress in the quests tab. 🚀');
        await loadData();
      } else {
        alert('Failed to enroll in quest');
      }
    } catch (error) {
      console.error('Error enrolling in quest:', error);
      alert('Failed to enroll in quest');
    }
  };

  const handleBoostComplete = (points: number) => {
    setBoostPoints(prev => prev + points);
    // Here you would typically update the user's points in the database
    // For now, we'll just show a success message
    alert(`🎉 Aura Boost Complete! You earned ${points} bonus points!`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-3xl">
          <div className="text-3xl font-bold">{userStats?.availablePoints?.toLocaleString() || 0}</div>
          <div className="text-purple-100">Available Points</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-3xl">
          <div className="text-3xl font-bold">{userStats?.currentStreak || 0}</div>
          <div className="text-blue-100">Day Streak 🔥</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-3xl">
          <div className="text-3xl font-bold">{userStats?.level || 1}</div>
          <div className="text-green-100">Level</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-3xl">
          <div className="text-3xl font-bold">{userStats?.badges?.length || 0}</div>
          <div className="text-yellow-100">Badges Earned</div>
        </div>
      </div>

      {/* Aura Boost Feature */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">⚡ Aura Boost</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enhance your wellness energy with guided activities and earn bonus points!
        </p>
        <AuraBoost onBoostComplete={handleBoostComplete} />
        {boostPoints > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✨</span>
              <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                Today's Boost Points: +{boostPoints}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Level Progress */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">Your Journey Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Level {userStats?.level || 1}</span>
              <span>{userStats?.lifetimeEarned || 0} total points earned</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(((userStats?.lifetimeEarned || 0) % 1000) / 10, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {1000 - ((userStats?.lifetimeEarned || 0) % 1000)} points until level {(userStats?.level || 1) + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  +{transaction.points}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
              {transaction.multiplier && transaction.multiplier > 1 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  {transaction.multiplier}x BONUS
                </span>
              )}
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🌟</div>
              <p className="text-gray-600 dark:text-gray-400">Start your wellness journey to earn points!</p>
            </div>
          )}
        </div>
      </div>

      {/* Badges Collection */}
      {userStats?.badges && userStats.badges.length > 0 && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold mb-4">Your Badges Collection</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {userStats.badges.map(badgeId => {
              const badge = BADGES[badgeId as keyof typeof BADGES];
              return badge ? (
                <div key={badgeId} className="text-center p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-bold">{badge.name}</div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderEarnPoints = () => (
    <div className="space-y-6">
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">How to Earn Aura Points</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Points celebrate your self-care journey. Focus on the intrinsic joy of wellness - points are just a bonus! ✨
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { activity: 'Daily Journal Entry', points: 10, desc: 'Write at least 50 words about your day', icon: '📔', link: '/journal' },
            { activity: 'Meditation Session', points: 15, desc: 'Complete a 5+ minute guided meditation', icon: '🧘', link: '/toolkit/meditations' },
            { activity: 'Workout Session', points: 15, desc: 'Finish a 5+ minute workout video', icon: '💪', link: '/toolkit/workouts' },
            { activity: 'Share an Aura', points: 5, desc: 'Post a 24-hour glimpse to friends', icon: '✨', link: '/aura' },
            { activity: 'Support a Friend', points: 3, desc: 'React or reply to a friend\'s Aura', icon: '🤗', link: '/aura' },
            { activity: '7-Day Streak Bonus', points: 50, desc: 'Maintain a week-long journaling streak', icon: '🔥', link: '/journal' },
          ].map(item => (
            <Link
              key={item.activity}
              href={item.link}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl group-hover:scale-110 transition">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.activity}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-500">+{item.points}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Daily Wisdom 🌅</h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            You can earn up to 50 points per day from regular activities. Focus on consistency over quantity!
            Quality self-care is more valuable than racing for points.
          </p>
        </div>
      </div>
    </div>
  );

  const renderRewardsStore = () => (
    <div className="space-y-6">
      {/* Featured Rewards */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">🌟 Featured Rewards</h2>
        
        {featuredRewards.affordable && featuredRewards.affordable.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Affordable Treats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredRewards.affordable.slice(0, 4).map((reward: Reward) => (
                <div key={reward.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{reward.title}</h4>
                    <span className="text-2xl font-bold text-green-600">{reward.cost}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{reward.description}</p>
                  <button
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={!userStats || userStats.availablePoints < reward.cost}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {userStats && userStats.availablePoints >= reward.cost ? 'Claim' : 'Need More Points'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {featuredRewards.limited && featuredRewards.limited.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Limited Edition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredRewards.limited.slice(0, 2).map((reward: Reward) => (
                <div key={reward.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{reward.title}</h4>
                    <span className="text-2xl font-bold text-red-600">{reward.cost}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{reward.description}</p>
                  <div className="text-xs text-red-600 dark:text-red-400 mb-3">
                    Only {(reward.limitQuantity || 0) - reward.claimed} left!
                  </div>
                  <button
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={!userStats || userStats.availablePoints < reward.cost}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    Claim Limited Edition
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Rewards by Category */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">All Rewards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{reward.title}</h4>
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-500">{reward.cost}</div>
                  <div className="text-xs text-gray-500">{reward.rarity}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{reward.description}</p>
              <button
                onClick={() => handleClaimReward(reward.id)}
                disabled={!userStats || userStats.availablePoints < reward.cost}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                {userStats && userStats.availablePoints >= reward.cost ? 'Claim' : `Need ${reward.cost - (userStats?.availablePoints || 0)} more`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuests = () => (
    <div className="space-y-6">
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">Weekly Quests</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Special challenges that reset weekly. Complete them for bonus points and exclusive badges! 🏆
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeQuests.map(quest => (
            <div key={quest.id} className={`p-6 rounded-xl border-2 ${
              quest.difficulty === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' :
              quest.difficulty === 'hard' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              quest.difficulty === 'medium' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
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
                  {quest.reward.badge && (
                    <div className="text-xs opacity-80">+ {quest.reward.badge} badge</div>
                  )}
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
    </div>
  );

  const renderSquads = () => (
    <div className="space-y-6">
      {/* User's Squads */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Aura Squads</h2>
          <Link
            href="/squads/create"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
          >
            Create Squad
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userSquads.map(squad => (
            <Link
              key={squad.id}
              href={`/squads/${squad.id}`}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {squad.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">{squad.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{squad.members.length} members</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-purple-500">{squad.totalPoints.toLocaleString()} pts</span>
                <span className="text-sm text-gray-500">Level {squad.level}</span>
              </div>
              
              {squad.currentChallenge && (
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Active: {squad.currentChallenge.title}
                  </p>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1 mt-1">
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
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Join or create your first Aura Squad to start group challenges!
            </p>
            <Link
              href="/squads/discover"
              className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Discover Squads
            </Link>
          </div>
        )}
      </div>

      {/* Leaderboards */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold mb-4">Squad Leaderboards 🏆</h2>
        
        <div className="space-y-4">
          {leaderboards.topSquads?.slice(0, 5).map((squad: AuraSquad & { rank: number }) => (
            <div key={squad.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                squad.rank === 1 ? 'bg-yellow-500 text-white' :
                squad.rank === 2 ? 'bg-gray-400 text-white' :
                squad.rank === 3 ? 'bg-orange-500 text-white' :
                'bg-gray-200 text-gray-700'
              }`}>
                {squad.rank}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold">{squad.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{squad.members.length} members</p>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-purple-500">{squad.totalPoints.toLocaleString()}</div>
                <div className="text-xs text-gray-500">total points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Aura Points ✨</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Celebrate your wellness journey and unlock amazing rewards
          </p>
        </div>

        {/* Points Summary */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{userStats?.availablePoints?.toLocaleString() || 0}</h2>
              <p className="text-purple-100">Available Aura Points</p>
              <p className="text-purple-200 text-sm mt-1">
                Daily earned: {userStats?.dailyPointsEarned || 0}/50 • Level {userStats?.level || 1}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{userStats?.currentStreak || 0} 🔥</div>
              <p className="text-purple-100 text-sm">Day Streak</p>
              {userStats && userStats.currentStreak > 0 && (
                <p className="text-purple-200 text-xs">
                  Longest: {userStats.longestStreak} days
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'earn' && renderEarnPoints()}
        {activeTab === 'rewards' && renderRewardsStore()}
        {activeTab === 'quests' && renderQuests()}
        {activeTab === 'squads' && renderSquads()}
      </div>
    </div>
  );
}