'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAuraSquad } from '@/lib/auraSquads';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Friend {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
}

export default function CreateSquadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [squadName, setSquadName] = useState('');
  const [squadDescription, setSquadDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Friend[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadFriends();
  }, [user, router]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsRef = collection(db, 'users', user.uid, 'friends');
      const snapshot = await getDocs(friendsRef);
      
      const friendsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().friendName,
        username: doc.data().friendUsername,
        avatar: doc.data().friendAvatar,
      })) as Friend[];
      
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendUid: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendUid)) {
        newSet.delete(friendUid);
      } else if (newSet.size < 7) { // Max 7 + creator = 8 total
        newSet.add(friendUid);
      }
      return newSet;
    });
  };

  const handleCreateSquad = async () => {
    if (!user || !squadName.trim()) return;
    
    setCreating(true);
    try {
      const squadId = await createAuraSquad({
        creator: user,
        name: squadName,
        description: squadDescription,
        isPrivate,
        initialMembers: Array.from(selectedFriends),
      });
      
      router.push(`/squads/${squadId}`);
    } catch (error) {
      console.error('Error creating squad:', error);
      alert('Failed to create squad');
    } finally {
      setCreating(false);
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Aura Squad</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Form a small group for collaborative wellness challenges
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
          {/* Squad Name */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3">Squad Name</label>
            <input
              type="text"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              placeholder="e.g., Mindful Warriors, Wellness Buddies..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              maxLength={50}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {squadName.length}/50
            </div>
          </div>

          {/* Squad Description */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3">Description</label>
            <textarea
              value={squadDescription}
              onChange={(e) => setSquadDescription(e.target.value)}
              placeholder="What's your squad's wellness mission?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {squadDescription.length}/200
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">Privacy</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium">🔒 Private Squad</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Only invited members can join</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="w-4 h-4 text-purple-600"
                />
                <div>
                  <div className="font-medium">🌍 Public Squad</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Anyone can discover and join</div>
                </div>
              </label>
            </div>
          </div>

          {/* Invite Friends */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3">
              Invite Friends ({selectedFriends.size}/7)
            </label>
            
            {friends.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You need friends to invite to your squad
                </p>
                <Link
                  href="/friends"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Add Friends First
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {friends.map(friend => (
                  <label
                    key={friend.uid}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.has(friend.uid)}
                      onChange={() => toggleFriendSelection(friend.uid)}
                      disabled={!selectedFriends.has(friend.uid) && selectedFriends.size >= 7}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">{friend.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      {friend.username && (
                        <p className="text-sm text-gray-500">@{friend.username}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Squad Philosophy */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">
              🌟 Squad Philosophy
            </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Aura Squads are about <strong>collaborative wellness</strong>, not competition. 
            Support each other, celebrate wins together, and remember that everyone&apos;s journey is unique. 
            The goal is collective growth and mutual encouragement! 🤝
          </p>
          </div>

          {/* Create Button */}
          <div className="flex gap-4">
            <Link
              href="/squads"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center font-semibold"
            >
              Cancel
            </Link>
            <button
              onClick={handleCreateSquad}
              disabled={creating || !squadName.trim()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-semibold"
            >
              {creating ? 'Creating Squad...' : 'Create Squad 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}