'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getUserSquads,
  searchPublicSquads,
  joinSquad,
  AuraSquad,
} from '@/lib/auraSquads';

export default function SquadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userSquads, setUserSquads] = useState<AuraSquad[]>([]);
  const [publicSquads, setPublicSquads] = useState<AuraSquad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadData();
  }, [user, router]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [squads, publicSquadsList] = await Promise.all([
        getUserSquads(user.uid),
        searchPublicSquads(),
      ]);
      
      setUserSquads(squads);
      setPublicSquads(publicSquadsList);
    } catch (error) {
      console.error('Error loading squads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const results = await searchPublicSquads(searchTerm);
      setPublicSquads(results);
    } catch (error) {
      console.error('Error searching squads:', error);
    }
  };

  const handleJoinSquad = async (squad: AuraSquad) => {
    if (!user) return;
    
    setJoining(squad.id);
    try {
      const result = await joinSquad(user, squad.id);
      alert(result.message);
      
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error joining squad:', error);
      alert('Failed to join squad');
    } finally {
      setJoining(null);
    }
  };

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
          <h1 className="text-4xl font-bold mb-2">Aura Squads 👥</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Join small groups for collaborative wellness challenges and support
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/squads/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
          >
            ➕ Create Squad
          </Link>
          <Link
            href="/aura-points"
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
          >
            📊 Points Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Squads */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Your Squads</h2>
              
              {userSquads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You haven&apos;t joined any squads yet
                  </p>
                  <Link
                    href="/squads/create"
                    className="inline-block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                  >
                    Create Your First Squad
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSquads.map(squad => (
                    <Link
                      key={squad.id}
                      href={`/squads/${squad.id}`}
                      className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {squad.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold">{squad.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {squad.members.length}/8 members • Level {squad.level}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-purple-500 font-bold">{squad.totalPoints.toLocaleString()} points</span>
                        {squad.currentChallenge && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Challenge Active
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Discover Public Squads */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Discover Squads</h2>
              
              {/* Search */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search squad names..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                >
                  Search
                </button>
              </div>
              
              {/* Public Squads */}
              <div className="space-y-3">
                {publicSquads.filter(squad => !userSquads.find(us => us.id === squad.id)).map(squad => (
                  <div key={squad.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {squad.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold">{squad.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {squad.members.length}/8 members • {squad.totalPoints.toLocaleString()} points
                          </p>
                          <p className="text-xs text-gray-500">{squad.description}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinSquad(squad)}
                        disabled={joining === squad.id || squad.members.length >= 8}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                      >
                        {joining === squad.id ? 'Joining...' : squad.members.length >= 8 ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
                
                {publicSquads.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No public squads found. Be the first to create one!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}