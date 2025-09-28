'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendFriendRequest,
  searchUsers,
  updateUserProfile,
  getPublicProfile
} from '@/lib/socialSystem';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugFriendsPage() {
  const { user } = useAuth();
  const [log, setLog] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (user) {
      addLog(`🔑 Signed in as: ${user.email} (${user.uid})`);
      debugUserProfile();
    }
  }, [user]);

  const debugUserProfile = async () => {
    if (!user) return;
    
    try {
      addLog('🔍 Checking user profile...');
      
      // Check main user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        addLog(`✅ User document exists: isPublic=${userData.isPublic}, username=${userData.username}`);
      } else {
        addLog('❌ User document does not exist');
      }
      
      // Check public profile
      const publicProfile = await getPublicProfile(user.uid);
      if (publicProfile) {
        addLog(`✅ Public profile exists: ${publicProfile.name} (@${publicProfile.username})`);
      } else {
        addLog('❌ Public profile does not exist');
      }
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error checking profile: ${error.message}`);
    }
  };

  const handleEnsureProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      addLog('🔄 Ensuring user has complete profile...');
      
      await updateUserProfile(user, {
        name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        username: user.email?.split('@')[0] || `user${user.uid.slice(-4)}`,
        bio: 'Testing AuraX social features',
        interests: ['wellness', 'community'],
        isPublic: true,
      });
      
      addLog('✅ Profile updated successfully');
      await debugUserProfile();
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      addLog('🔍 Searching for users...');
      
      const results = await searchUsers({
        query: '',
        currentUserId: user.uid,
        limitCount: 5,
      });
      
      addLog(`✅ Found ${results.length} users:`);
      results.forEach((result, index) => {
        addLog(`   ${index + 1}. ${result.name} (@${result.username}) - ID: ${result.userId}`);
      });
      
      if (results.length > 0) {
        setTargetUserId(results[0].userId);
        addLog(`🎯 Set target user for testing: ${results[0].name}`);
      }
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error searching users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestFriendRequest = async () => {
    if (!user || !targetUserId) {
      addLog('❌ Need user and target user ID');
      return;
    }
    
    setLoading(true);
    try {
      addLog(`🚀 Sending friend request to: ${targetUserId}`);
      
      const requestId = await sendFriendRequest({
        fromUser: user,
        toUserId: targetUserId,
        message: 'Test friend request from debug page',
      });
      
      addLog(`✅ Friend request sent successfully! ID: ${requestId}`);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Friend request failed: ${error.message}`);
      addLog(`❌ Error code: ${error.code}`);
      addLog(`❌ Full error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSpecificEmails = async () => {
    if (!user) return;
    
    setLoading(true);
    const emails = ['twinesounds@gmail.com', 'twinemugabe@gmail.com'];
    
    try {
      for (const email of emails) {
        addLog(`🔍 Searching for: ${email}`);
        
        const results = await searchUsers({
          query: email,
          currentUserId: user.uid,
          limitCount: 10,
        });
        
        if (results.length > 0) {
          addLog(`✅ Found user: ${results[0].name} (${results[0].userId})`);
          
          // Try to send friend request
          try {
            const requestId = await sendFriendRequest({
              fromUser: user,
              toUserId: results[0].userId,
              message: `Hi ${results[0].name}! I'd like to connect with you on AuraX! 🌟`,
            });
            addLog(`✅ Friend request sent to ${results[0].name}! ID: ${requestId}`);
          } catch (reqError: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            addLog(`❌ Failed to send request to ${results[0].name}: ${reqError.message}`);
          }
        } else {
          addLog(`❌ No user found with email: ${email}`);
        }
      }
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error in email search: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to debug friends system</h1>
          <a href="/login" className="px-6 py-3 bg-blue-500 text-white rounded-lg">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            🔧 Debug Friends System
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile & Setup
              </h2>
              
              <button
                onClick={handleEnsureProfile}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : '👤 Ensure Profile Setup'}
              </button>
              
              <button
                onClick={debugUserProfile}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Checking...' : '🔍 Check Profile Status'}
              </button>
              
              <button
                onClick={handleSearchUsers}
                disabled={loading}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : '👥 Search Users'}
              </button>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Friend Request Testing
              </h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target User ID:
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user ID to send request to..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <button
                onClick={handleTestFriendRequest}
                disabled={loading || !targetUserId}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : '🚀 Test Friend Request'}
              </button>
              
              <button
                onClick={handleSearchSpecificEmails}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : '📧 Send Requests to Specified Emails'}
              </button>
            </div>
          </div>
          
          {/* Debug Log */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🐛 Debug Log
            </h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {log.length === 0 ? (
                <p>Debug log will appear here...</p>
              ) : (
                log.map((entry, index) => (
                  <div key={index} className="mb-1">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🎯 Testing Instructions
            </h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>Click &quot;Ensure Profile Setup&quot; to make sure your profile is complete</li>
              <li>Click &quot;Check Profile Status&quot; to verify everything is set up</li>
              <li>Click &quot;Search Users&quot; to find other users and get a target ID</li>
              <li>Click &quot;Test Friend Request&quot; to test sending a request</li>
              <li>Click &quot;Send Requests to Specified Emails&quot; to complete the requirement</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}