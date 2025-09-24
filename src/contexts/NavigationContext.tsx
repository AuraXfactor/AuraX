'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Navigation structure based on innovative reorganization
export type MainTab = 'journal' | 'connect' | 'points' | 'profile';

export type SubTab = {
  journal: 'write' | 'library' | 'toolkit' | 'recent';
  connect: 'feed' | 'friends' | 'groups' | 'chat';
  points: 'overview' | 'earn' | 'rewards' | 'quests' | 'squads';
  profile: 'stats' | 'settings' | 'achievements' | 'help';
};

interface NavigationState {
  activeTab: MainTab;
  subTab: string;
  pageTitle: string;
  showSearch: boolean;
  showNotifications: boolean;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

interface NavigationContextType {
  state: NavigationState;
  setActiveTab: (tab: MainTab, subTab?: string) => void;
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs: NavigationState['breadcrumbs']) => void;
  toggleSearch: () => void;
  toggleNotifications: () => void;
  getNavigationConfig: () => NavigationConfig;
}

// Navigation configuration for each main tab
interface NavigationConfig {
  [key: string]: {
    label: string;
    icon: string;
    color: string;
    subTabs: Array<{
      id: string;
      label: string;
      icon: string;
      href: string;
      description?: string;
    }>;
  };
}

const NAVIGATION_CONFIG: NavigationConfig = {
  journal: {
    label: 'Journal',
    icon: '📔',
    color: 'from-rose-500 to-orange-500',
    subTabs: [
      { id: 'write', label: 'Write Entry', icon: '✍️', href: '/journal', description: 'Create a new journal entry' },
      { id: 'recent', label: 'Recent Entries', icon: '📄', href: '/journal/recent', description: 'View your latest entries' },
      { id: 'library', label: 'Journal Library', icon: '📚', href: '/journal/library', description: 'Browse all journal collections' },
      { id: 'toolkit', label: 'Guided Content', icon: '🧰', href: '/toolkit', description: 'Meditations, workouts, and tools' },
    ],
  },
  connect: {
    label: 'Connect',
    icon: '🌟',
    color: 'from-purple-500 to-pink-500',
    subTabs: [
      { id: 'feed', label: 'Aura Feed', icon: '✨', href: '/aura', description: 'View friends\' 24h glimpses' },
      { id: 'friends', label: 'Friends', icon: '👥', href: '/friends', description: 'Manage your friend network' },
      { id: 'groups', label: 'Groups', icon: '💬', href: '/groups', description: 'Group chats and communities' },
      { id: 'chat', label: 'Direct Chat', icon: '💭', href: '/soulchat', description: 'Private conversations' },
    ],
  },
  points: {
    label: 'Points',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    subTabs: [
      { id: 'overview', label: 'Dashboard', icon: '📊', href: '/aura-points', description: 'Your points overview' },
      { id: 'earn', label: 'Earn Points', icon: '💰', href: '/aura-points?tab=earn', description: 'How to earn more points' },
      { id: 'rewards', label: 'Rewards Store', icon: '🏪', href: '/aura-points?tab=rewards', description: 'Spend points on rewards' },
      { id: 'quests', label: 'Weekly Quests', icon: '⭐', href: '/aura-points?tab=quests', description: 'Special challenges' },
      { id: 'squads', label: 'Aura Squads', icon: '👥', href: '/squads', description: 'Collaborative challenges' },
    ],
  },
  profile: {
    label: 'Me',
    icon: '👤',
    color: 'from-indigo-500 to-purple-500',
    subTabs: [
      { id: 'stats', label: 'Profile', icon: '📊', href: '/profile', description: 'Your wellness journey stats' },
      { id: 'achievements', label: 'Achievements', icon: '🏆', href: '/profile/achievements', description: 'Badges and milestones' },
      { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings', description: 'App preferences and security' },
      { id: 'help', label: 'Help & Support', icon: '❓', href: '/help', description: 'Get help and export data' },
    ],
  },
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState>({
    activeTab: 'journal',
    subTab: 'write',
    pageTitle: 'My Journal',
    showSearch: false,
    showNotifications: false,
    breadcrumbs: [],
  });

  // Auto-detect active tab based on current route
  useEffect(() => {
    const detectActiveTab = (): { tab: MainTab; subTab: string; title: string } => {
      if (pathname.startsWith('/journal')) {
        if (pathname.includes('/library')) return { tab: 'journal', subTab: 'library', title: 'Journal Library' };
        if (pathname.includes('/recent')) return { tab: 'journal', subTab: 'recent', title: 'Recent Entries' };
        return { tab: 'journal', subTab: 'write', title: 'My Journal' };
      }
      
      if (pathname.startsWith('/aura') && !pathname.includes('aura-points')) {
        return { tab: 'connect', subTab: 'feed', title: 'Aura Feed' };
      }
      
      if (pathname.startsWith('/friends')) {
        return { tab: 'connect', subTab: 'friends', title: 'Friends' };
      }
      
      if (pathname.startsWith('/groups')) {
        return { tab: 'connect', subTab: 'groups', title: 'Groups' };
      }
      
      if (pathname.startsWith('/soulchat')) {
        return { tab: 'connect', subTab: 'chat', title: 'Messages' };
      }
      
      if (pathname.startsWith('/aura-points') || pathname.startsWith('/squads')) {
        if (pathname.includes('/squads')) return { tab: 'points', subTab: 'squads', title: 'Aura Squads' };
        return { tab: 'points', subTab: 'overview', title: 'Aura Points' };
      }
      
      if (pathname.startsWith('/profile')) {
        if (pathname.includes('/achievements')) return { tab: 'profile', subTab: 'achievements', title: 'Achievements' };
        return { tab: 'profile', subTab: 'stats', title: 'Profile' };
      }
      
      if (pathname.startsWith('/settings')) {
        return { tab: 'profile', subTab: 'settings', title: 'Settings' };
      }
      
      if (pathname.startsWith('/help')) {
        return { tab: 'profile', subTab: 'help', title: 'Help & Support' };
      }
      
      if (pathname.startsWith('/toolkit')) {
        return { tab: 'journal', subTab: 'toolkit', title: 'Wellness Toolkit' };
      }
      
      // Default fallback
      return { tab: 'journal', subTab: 'write', title: 'AuraX' };
    };

    const detected = detectActiveTab();
    setState(prev => ({
      ...prev,
      activeTab: detected.tab,
      subTab: detected.subTab,
      pageTitle: detected.title,
    }));
  }, [pathname]);

  const setActiveTab = (tab: MainTab, subTab?: string) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      subTab: subTab || NAVIGATION_CONFIG[tab].subTabs[0].id,
    }));
  };

  const setPageTitle = (title: string) => {
    setState(prev => ({ ...prev, pageTitle: title }));
  };

  const setBreadcrumbs = (breadcrumbs: NavigationState['breadcrumbs']) => {
    setState(prev => ({ ...prev, breadcrumbs }));
  };

  const toggleSearch = () => {
    setState(prev => ({ ...prev, showSearch: !prev.showSearch }));
  };

  const toggleNotifications = () => {
    setState(prev => ({ ...prev, showNotifications: !prev.showNotifications }));
  };

  const getNavigationConfig = () => NAVIGATION_CONFIG;

  return (
    <NavigationContext.Provider value={{
      state,
      setActiveTab,
      setPageTitle,
      setBreadcrumbs,
      toggleSearch,
      toggleNotifications,
      getNavigationConfig,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export { NAVIGATION_CONFIG };