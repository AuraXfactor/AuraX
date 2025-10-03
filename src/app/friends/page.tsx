'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import FriendSearch from '@/components/social/FriendSearch';
import EnhancedFriendRequests from '@/components/social/EnhancedFriendRequests';
import EnhancedFriendSuggestions from '@/components/social/EnhancedFriendSuggestions';
import FriendsList from '@/components/social/FriendsList';
import AuraFamilyList from '@/components/social/AuraFamilyList';
import UniversalAuraFamList from '@/components/social/UniversalAuraFamList';
import SocialFeed from '@/components/social/SocialFeed';

const tabs = [
  { id: 'friends', label: 'Aura Fam', icon: '👨‍👩‍👧‍👦' },
  { id: 'discover', label: 'Discover', icon: '🔍' },
  { id: 'suggestions', label: 'Suggestions', icon: '💡' },
  { id: 'requests', label: 'Fam Requests', icon: '📬' },
];

function FriendsPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('friends');
  const [requestCount, setRequestCount] = useState(0);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['friends', 'discover', 'suggestions', 'requests', 'feed'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const handleRequestsUpdate = () => {
    // This will be called when requests are handled
    console.log('Friend requests updated - refreshing friends list');
    // Trigger a custom event to refresh friends list
    const event = new CustomEvent('refreshFriendsList');
    window.dispatchEvent(event);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Aura Fam</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your chosen fam for aura farming and growth together
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'requests' && requestCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {requestCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
          {activeTab === 'friends' && <UniversalAuraFamList onMemberRemoved={handleRequestsUpdate} />}
          {activeTab === 'discover' && <FriendSearch onRequestSent={handleRequestsUpdate} />}
          {activeTab === 'suggestions' && <EnhancedFriendSuggestions onRequestSent={handleRequestsUpdate} />}
          {activeTab === 'requests' && <EnhancedFriendRequests onRequestHandled={handleRequestsUpdate} />}
        </div>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <FriendsPageContent />
    </Suspense>
  );
}