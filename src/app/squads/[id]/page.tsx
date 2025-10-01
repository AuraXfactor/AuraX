'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getSquadDetails, 
  joinSquad, 
  leaveSquad, 
  startSquadChallenge,
  AuraSquad 
} from '@/lib/auraSquads';
import { sendFriendRequest } from '@/lib/socialSystem';

export default function SquadDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const squadId = params.id as string;
  
  const [squad, setSquad] = useState<AuraSquad | null>(null);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [startingChallenge, setStartingChallenge] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadSquadDetails();
  }, [user, router, squadId]);

  const loadSquadDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { squad: squadData, memberStats: stats } = await getSquadDetails(squadId);
      setSquad(squadData);
      setMemberStats(stats);
    } catch (error) {
      console.error('Error loading squad details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!user) return;
    
    try {
      setJoining(true);
      const result = await joinSquad(user, squadId);
      
      if (result.success) {
        alert(result.message);
        await loadSquadDetails();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error joining squad:', error);
      alert('Failed to join squad');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to leave this squad?')) return;
    
    try {
      setLeaving(true);
      const result = await leaveSquad(user, squadId);
      
      if (result.success) {
        alert(result.message);
        router.push('/aura-points');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error leaving squad:', error);
      alert('Failed to leave squad');
    } finally {
      setLeaving(false);
    }
  };

  const handleStartChallenge = async (challengeId: string) => {
    if (!user) return;
    
    try {
      setStartingChallenge(true);
      const result = await startSquadChallenge(user, squadId, challengeId);
      
      if (result.success) {
        alert(result.message);
        await loadSquadDetails();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge');
    } finally {
      setStartingChallenge(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return;
    
    try {
      setSendingRequest(userId);
      await sendFriendRequest({
        fromUser: user,
        toUserId: userId,
        message: 'Let\'s connect and support each other\'s wellness journey! 🌟'
      });
      alert('Friend request sent! 🎉');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const isMember = squad && user && squad.members.includes(user.uid);
  const isAdmin = squad && user && squad.admins.includes(user.uid);

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
          <div className="text-4xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2">Squad not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This squad may have been deleted or doesn't exist.
          </p>
          <Link
            href="/aura-points"
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Back to Aura Points
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/aura-points"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              ← Back
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{squad.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">{squad.description}</p>
            </div>
            {isMember && (
              <div className="flex gap-2">
                {isAdmin && (
                  <button
                    onClick={() => handleStartChallenge('meditation_minutes')}
                    disabled={startingChallenge || !!squad.currentChallenge}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {startingChallenge ? 'Starting...' : 'Start Challenge'}
                  </button>
                )}
                <button
                  onClick={handleLeaveSquad}
                  disabled={leaving}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {leaving ? 'Leaving...' : 'Leave Squad'}
                </button>
              </div>
            )}
            {!isMember && (
              <button
                onClick={handleJoinSquad}
                disabled={joining}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join Squad'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Squad Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Squad Stats */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Stats</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{squad.totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{squad.members.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{squad.level}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{squad.achievements.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                </div>
              </div>
            </div>

            {/* Current Challenge */}
            {squad.currentChallenge && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-4">Active Challenge</h2>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">{squad.currentChallenge.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{squad.currentChallenge.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{squad.currentChallenge.currentProgress} / {squad.currentChallenge.target}</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(squad.currentChallenge.currentProgress / squad.currentChallenge.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Reward: {squad.currentChallenge.reward} points
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Deadline: {squad.currentChallenge.deadline?.toDate?.()?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Squad Achievements */}
            {squad.achievements.length > 0 && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-4">Squad Achievements</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {squad.achievements.map((achievement, index) => (
                    <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="text-sm font-medium">Achievement {index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Members */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Members ({squad.members.length})</h2>
              
              <div className="space-y-3">
                {memberStats.map((member, index) => (
                  <div key={member.uid} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {member.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.points.toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">{member.contribution}%</div>
                        <div className="text-xs text-gray-500">contribution</div>
                      </div>
                      {member.uid !== user?.uid && (
                        <button
                          onClick={() => handleSendFriendRequest(member.uid)}
                          disabled={sendingRequest === member.uid}
                          className="p-1 text-blue-500 hover:text-blue-700 transition disabled:opacity-50"
                          title="Send friend request"
                        >
                          {sendingRequest === member.uid ? '...' : '👋'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Squad Actions */}
            {isMember && (
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-4">Squad Actions</h2>
                
                <div className="space-y-3">
                  <Link
                    href={`/squads/${squadId}/chat`}
                    className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-center"
                  >
                    💬 Squad Chat
                  </Link>
                  
                  <Link
                    href={`/squads/${squadId}/challenges`}
                    className="block w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center"
                  >
                    🏆 View Challenges
                  </Link>
                  
                  <Link
                    href={`/squads/${squadId}/leaderboard`}
                    className="block w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-center"
                  >
                    📊 Leaderboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}