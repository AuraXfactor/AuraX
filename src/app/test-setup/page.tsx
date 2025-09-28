'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  runTestSetup, 
  setupTestFriendship, 
  testAccounts,
  createTestAccount,
  setupTestAccountProfile,
  createTestPosts
} from '@/utils/testAccounts';
import { 
  sendFriendRequest,
  searchUsers,
  updateUserProfile
} from '@/lib/socialSystem';
import { migrateExistingUsersToPublicProfiles } from '@/utils/migrateUsers';

export default function TestSetupPage() {
  const { user } = useAuth();
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFullSetup = async () => {
    setLoading(true);
    setLog([]);
    
    try {
      addLog('🚀 Starting comprehensive test setup...');
      
      // First migrate existing users
      addLog('🔄 Migrating existing users to public profiles...');
      await migrateExistingUsersToPublicProfiles();
      addLog('✅ User migration complete');
      
      const { alice, bob } = await runTestSetup();
      addLog(`✅ Created test accounts: ${alice.email} and ${bob.email}`);
      
      // Setup friendship
      await setupTestFriendship(alice, bob);
      addLog('📤 Friend request sent from Alice to Bob');
      
      addLog('🎉 Test setup complete! Now test manually:');
      addLog('1. Sign in as Bob and accept Alice&apos;s friend request');
      addLog('2. Both accounts can now see each other&apos;s posts');
      addLog('3. Test messaging between friends');
      addLog('4. Create and join groups');
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateUsers = async () => {
    setLoading(true);
    
    try {
      addLog('🔄 Migrating existing users to public profiles...');
      await migrateExistingUsersToPublicProfiles();
      addLog('✅ User migration complete - all existing users now have public profiles');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error migrating users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (accountIndex: number) => {
    setLoading(true);
    
    try {
      const accountData = testAccounts[accountIndex];
      addLog(`Creating account: ${accountData.name}...`);
      
      const user = await createTestAccount(accountData);
      await setupTestAccountProfile(user, accountData);
      await createTestPosts(user, accountData);
      
      addLog(`✅ Account created successfully: ${accountData.name}`);
      addLog(`📧 Email: ${accountData.email}`);
      addLog(`🔑 Password: ${accountData.password}`);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error creating account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequestToEmail = async (email: string) => {
    if (!user) {
      addLog('❌ Please sign in first');
      return;
    }
    
    setLoading(true);
    
    try {
      addLog(`🔍 Searching for user with email: ${email}...`);
      
      // Search for the user by email (we'll need to implement this)
      const searchResults = await searchUsers({
        query: email,
        currentUserId: user.uid,
      });
      
      if (searchResults.length === 0) {
        addLog(`❌ No user found with email: ${email}`);
        return;
      }
      
      const targetUser = searchResults[0];
      addLog(`👤 Found user: ${targetUser.name}`);
      
      await sendFriendRequest({
        fromUser: user,
        toUserId: targetUser.userId,
        message: `Hi ${targetUser.name}! I'd like to connect with you on AuraX! 🌟`,
      });
      
      addLog(`✅ Friend request sent to ${targetUser.name}!`);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error sending friend request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrentProfile = async () => {
    if (!user) {
      addLog('❌ Please sign in first');
      return;
    }
    
    setLoading(true);
    
    try {
      addLog('🔄 Updating current user profile...');
      
      await updateUserProfile(user, {
        isPublic: true,
        interests: ['wellness', 'community', 'support'],
        focusAreas: ['mental health', 'personal growth'],
        bio: 'Testing the AuraX social system! 🚀',
      });
      
      addLog('✅ Profile updated successfully!');
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      addLog(`❌ Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            🧪 AuraX Social System Test Setup
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Test Account Creation
              </h2>
              
              <button
                onClick={handleMigrateUsers}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 font-medium mb-4"
              >
                {loading ? 'Migrating...' : '🔄 Migrate Existing Users'}
              </button>
              
              <button
                onClick={handleFullSetup}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium"
              >
                {loading ? 'Setting up...' : '🚀 Run Full Test Setup'}
              </button>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleCreateAccount(0)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  Create Alice&apos;s Account
                </button>
                
                <button
                  onClick={() => handleCreateAccount(1)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  Create Bob&apos;s Account
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current User Actions
              </h2>
              
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Signed in as: {user.email}
                  </p>
                  
                  <button
                    onClick={handleUpdateCurrentProfile}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50"
                  >
                    Make Profile Public & Update
                  </button>
                  
                  <button
                    onClick={() => handleSendRequestToEmail('twinesounds@gmail.com')}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
                  >
                    Send Request to twinesounds@gmail.com
                  </button>
                  
                  <button
                    onClick={() => handleSendRequestToEmail('twinemugabe@gmail.com')}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
                  >
                    Send Request to twinemugabe@gmail.com
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to use current user actions
                </p>
              )}
            </div>
          </div>
          
          {/* Test Account Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Test Account Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testAccounts.map((account, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {account.name} (@{account.username})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {account.bio}
                  </p>
                  <div className="text-xs space-y-1">
                    <p><strong>Email:</strong> {account.email}</p>
                    <p><strong>Password:</strong> {account.password}</p>
                    <p><strong>Interests:</strong> {account.interests.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Manual Testing Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              🎯 Manual Testing Steps
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>Run &quot;Full Test Setup&quot; to create both accounts</li>
              <li>Open new incognito window and sign in as Bob</li>
              <li>Navigate to Friends → Requests tab and accept Alice&apos;s request</li>
              <li>Both accounts: Go to Friends → Social Feed and create posts</li>
              <li>Verify posts appear in each other&apos;s feeds</li>
              <li>Test messaging: Friends → click &quot;Message&quot; button</li>
              <li>Test groups: Navigate to /groups and create/join groups</li>
              <li>Send friend requests to twinesounds@gmail.com and twinemugabe@gmail.com</li>
            </ol>
          </div>
          
          {/* Action Log */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📝 Action Log
            </h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {log.length === 0 ? (
                <p>Ready to run tests... Click a button above to start!</p>
              ) : (
                log.map((entry, index) => (
                  <div key={index} className="mb-1">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}