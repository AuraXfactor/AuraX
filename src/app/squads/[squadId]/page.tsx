'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getSquadDetails,
  listenToSquad,
  leaveSquad,
  startSquadChallenge,
  AuraSquad,
} from '@/lib/auraSquads';
import {
  getUserAuraStats,
  getRecentTransactions,
  AuraPointTransaction,
} from '@/lib/auraPoints';

const CHALLENGE_TEMPLATES = [
  {
    id: 'meditation_minutes',
    title: 'Squad Meditation Marathon',
    description: 'Collectively meditate for 300 minutes this week',
    icon: '🧘',
    reward: 200,
  },
  {
    id: 'journal_entries',
    title: 'Squad Journal Sprint',
    description: 'Write 35 journal entries together this week',
    icon: '📔',
    reward: 350,
  },
  {
    id: 'aura_posts',
    title: 'Squad Sharing Spree',
    description: 'Share 20 Aura posts together this week',
    icon: '✨',
    reward: 150,
  },
  {
    id: 'friend_support',
    title: 'Squad Support Squad',
    description: 'Support 50 friends together this week',
    icon: '🤗',
    reward: 250,
  },
];

export default function SquadDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ squadId: string }>();
  const squadId = decodeURIComponent(params.squadId);
  
  const [squad, setSquad] = useState<AuraSquad | null>(null);
  const [memberStats, setMemberStats] = useState<Array<{
    uid: string;
    name?: string;
    avatar?: string;
    points: number;
    contribution: number;
  }>>([]);
  const [squadTransactions, setSquadTransactions] = useState<AuraPointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [startingChallenge, setStartingChallenge] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadSquadData();
    
    // Listen to real-time squad updates
    const unsubscribe = listenToSquad(squadId, (updatedSquad) => {
      setSquad(updatedSquad);
    });
    
    return () => unsubscribe();
  }, [user, router, squadId]);

  const loadSquadData = async () => {
    try {
      const { squad: squadData, memberStats: members } = await getSquadDetails(squadId);
      
      if (!squadData) {
        router.push('/squads');
        return;
      }
      
      // Check if user is a member
      if (!squadData.members.includes(user?.uid || '')) {
        router.push('/squads');
        return;
      }
      
      setSquad(squadData);
      setMemberStats(members);
      
      // Load recent squad-related transactions
      if (user) {
        const transactions = await getRecentTransactions(user.uid);
        const squadTransactions = transactions.filter(t => t.squadId === squadId);
        setSquadTransactions(squadTransactions);
      }
    } catch (error) {
      console.error('Error loading squad data:', error);
      router.push('/squads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!user || !squad || !confirm(`Are you sure you want to leave ${squad.name}?`)) return;
    
    try {
      const result = await leaveSquad(user, squadId);
      if (result.success) {
        router.push('/squads');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error leaving squad:', error);
      alert('Failed to leave squad');
    }
  };

  const handleStartChallenge = async (challengeId: string) => {
    if (!user || !squad) return;
    
    setStartingChallenge(true);
    try {
      const result = await startSquadChallenge(user, squadId, challengeId);
      alert(result.message);
      
      if (result.success) {
        setShowChallengeModal(false);
        await loadSquadData();
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge');
    } finally {
      setStartingChallenge(false);
    }
  };

  const getProgressPercentage = () => {
    if (!squad?.currentChallenge) return 0;
    return Math.min((squad.currentChallenge.currentProgress / squad.currentChallenge.target) * 100, 100);
  };

  const renderChallengeModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Start Squad Challenge</h2>
            <button
              onClick={() => setShowChallengeModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {CHALLENGE_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleStartChallenge(template.id)}
                disabled={startingChallenge}
                className="w-full p-4 text-left border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <h3 className="font-bold">{template.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
                <div className="text-purple-600 font-bold">+{template.reward} points to split</div>
              </button>
            ))}
          </div>
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

  if (!squad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Squad not found</h2>
          <Link href="/squads" className="text-purple-500 hover:underline">
            Back to Squads
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = squad.admins.includes(user?.uid || '');

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/squads" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to Squads
            </Link>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{squad.name}</h1>
                <p className="text-purple-100 mb-2">{squad.description}</p>
                <div className="flex items-center gap-4 text-purple-200">
                  <span>{squad.members.length}/8 members</span>
                  <span>•</span>
                  <span>Level {squad.level}</span>
                  <span>•</span>
                  <span>{squad.totalPoints.toLocaleString()} total points</span>
                </div>
              </div>
              
              {isAdmin && !squad.currentChallenge && (
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                  Start Challenge
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Challenge */}
          <div className="space-y-6">
            {squad.currentChallenge ? (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-4">🏆 Active Challenge</h2>
                
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">{squad.currentChallenge.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{squad.currentChallenge.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{squad.currentChallenge.currentProgress} / {squad.currentChallenge.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-500">+{squad.currentChallenge.reward}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">points to split</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ends: {squad.currentChallenge.deadline.toDate().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-4">No Active Challenge</h2>
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {isAdmin ? 'Start a challenge to rally your squad!' : 'Waiting for an admin to start a challenge'}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowChallengeModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
                    >
                      Start Challenge
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Squad Activity */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Squad Activity</h2>
              
              {squadTransactions.length > 0 ? (
                <div className="space-y-3">
                  {squadTransactions.slice(0, 5).map(transaction => (
                    <div key={transaction.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{transaction.description}</p>
                        <span className="text-green-500 font-bold">+{transaction.points}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {transaction.createdAt?.toDate?.()?.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Squad activity will appear here as members earn points together!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Members</h2>
              
              <div className="space-y-3">
                {memberStats.map((member, index) => (
                  <div key={member.uid} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-purple-200 text-purple-800'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{(member.name || 'A').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        {squad.admins.includes(member.uid) && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Admin</span>
                        )}
                        {member.uid === user?.uid && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{member.points.toLocaleString()} points</span>
                        <span>•</span>
                        <span>{member.contribution}% contribution</span>
                      </div>
                    </div>
                    
                    {member.uid !== user?.uid && (
                      <Link
                        href={`/soulchat/${member.uid}`}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        Message
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLeaveSquad}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Leave Squad
                </button>
              </div>
            </div>

            {/* Squad Stats */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Stats</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
                  <div className="text-2xl font-bold">{squad.totalPoints.toLocaleString()}</div>
                  <div className="text-purple-100 text-sm">Total Points</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl">
                  <div className="text-2xl font-bold">{squad.level}</div>
                  <div className="text-blue-100 text-sm">Squad Level</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl">
                  <div className="text-2xl font-bold">{squad.achievements.length}</div>
                  <div className="text-green-100 text-sm">Achievements</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl">
                  <div className="text-2xl font-bold">{squad.members.length}</div>
                  <div className="text-yellow-100 text-sm">Members</div>
                </div>
              </div>

              {squad.achievements.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Squad Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {squad.achievements.map(achievement => (
                      <span
                        key={achievement}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                      >
                        🏆 {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Challenge Modal */}
        {showChallengeModal && renderChallengeModal()}
      </div>
    </div>
  );
}