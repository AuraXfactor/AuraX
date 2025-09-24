'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendFriendRequest } from '@/lib/friends';
import Link from 'next/link';

interface SharedUser {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  email?: string;
}

export default function AddFriendPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params.userId);
  
  const [sharedUser, setSharedUser] = useState<SharedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (userId === user.uid) {
      router.push('/profile');
      return;
    }
    
    loadUserProfile();
  }, [user, router, userId]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSharedUser({
          uid: userId,
          name: userData.name || userData.email || 'Anonymous',
          username: userData.username,
          avatar: userData.avatar,
          email: userData.email,
        });
      } else {
        alert('User not found');
        router.push('/friends');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      alert('Error loading user profile');
      router.push('/friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !sharedUser) return;
    
    setSending(true);
    try {
      await sendFriendRequest({
        fromUser: user,
        toUid: sharedUser.uid,
        toUserName: sharedUser.name,
        toUserAvatar: sharedUser.avatar,
        message: `Hi ${sharedUser.name}, I'd like to connect with you on AuraX!`,
      });
      
      alert('Friend request sent! 🎉');
      router.push('/friends');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!sharedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <Link href="/friends" className="text-purple-500 hover:underline">
            Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Connect with {sharedUser.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Someone shared their AuraX profile with you!
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8 text-center">
          {/* User Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            {sharedUser.avatar ? (
              <img 
                src={sharedUser.avatar} 
                alt={sharedUser.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-3xl">
                {sharedUser.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <h2 className="text-3xl font-bold mb-2">{sharedUser.name}</h2>
          {sharedUser.username && (
            <p className="text-purple-600 dark:text-purple-400 mb-2">@{sharedUser.username}</p>
          )}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Wants to connect with you on AuraX
          </p>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href="/friends"
              className="flex-1 px-6 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center font-semibold"
            >
              Maybe Later
            </Link>
            <button
              onClick={handleSendFriendRequest}
              disabled={sending}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-semibold"
            >
              {sending ? 'Sending...' : 'Send Friend Request 👥'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🌟 By connecting, you&apos;ll be able to see each other&apos;s Aura posts, support each other&apos;s wellness journey, and join group challenges together!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}