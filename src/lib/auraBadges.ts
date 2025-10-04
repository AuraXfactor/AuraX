export interface AuraBadge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'wellness' | 'social' | 'achievement' | 'streak' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: 'journal_entries' | 'streak_days' | 'aura_points' | 'friends_added' | 'vibe_checks' | 'focus_goals' | 'special';
    value: number;
    description: string;
  };
  unlockedAt?: Date;
  isUnlocked?: boolean;
}

export const auraBadges: AuraBadge[] = [
  // Wellness Badges
  {
    id: 'first-journal',
    name: 'First Steps',
    description: 'Wrote your first journal entry',
    emoji: '📝',
    category: 'wellness',
    rarity: 'common',
    requirement: {
      type: 'journal_entries',
      value: 1,
      description: 'Write 1 journal entry'
    }
  },
  {
    id: 'journal-streak-7',
    name: 'Week Warrior',
    description: '7-day journaling streak',
    emoji: '🔥',
    category: 'streak',
    rarity: 'rare',
    requirement: {
      type: 'streak_days',
      value: 7,
      description: 'Journal for 7 consecutive days'
    }
  },
  {
    id: 'journal-streak-30',
    name: 'Monthly Master',
    description: '30-day journaling streak',
    emoji: '🏆',
    category: 'streak',
    rarity: 'epic',
    requirement: {
      type: 'streak_days',
      value: 30,
      description: 'Journal for 30 consecutive days'
    }
  },
  {
    id: 'journal-streak-100',
    name: 'Century Sage',
    description: '100-day journaling streak',
    emoji: '👑',
    category: 'streak',
    rarity: 'legendary',
    requirement: {
      type: 'streak_days',
      value: 100,
      description: 'Journal for 100 consecutive days'
    }
  },
  {
    id: 'mood-tracker',
    name: 'Mood Master',
    description: 'Set your mood baseline',
    emoji: '🎭',
    category: 'wellness',
    rarity: 'common',
    requirement: {
      type: 'special',
      value: 1,
      description: 'Complete mood baseline setup'
    }
  },
  {
    id: 'focus-goal-setter',
    name: 'Goal Getter',
    description: 'Set your first focus goal',
    emoji: '🎯',
    category: 'wellness',
    rarity: 'common',
    requirement: {
      type: 'focus_goals',
      value: 1,
      description: 'Set 1 focus goal'
    }
  },

  // Social Badges
  {
    id: 'first-friend',
    name: 'Connection Starter',
    description: 'Added your first friend',
    emoji: '🤝',
    category: 'social',
    rarity: 'common',
    requirement: {
      type: 'friends_added',
      value: 1,
      description: 'Add 1 friend to your Aura fam'
    }
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Added 10 friends',
    emoji: '🦋',
    category: 'social',
    rarity: 'rare',
    requirement: {
      type: 'friends_added',
      value: 10,
      description: 'Add 10 friends to your Aura fam'
    }
  },
  {
    id: 'aura-fam-leader',
    name: 'Aura Fam Leader',
    description: 'Added 50 friends',
    emoji: '👑',
    category: 'social',
    rarity: 'epic',
    requirement: {
      type: 'friends_added',
      value: 50,
      description: 'Add 50 friends to your Aura fam'
    }
  },
  {
    id: 'vibe-sharer',
    name: 'Vibe Sharer',
    description: 'Shared your first vibe check',
    emoji: '🔮',
    category: 'social',
    rarity: 'common',
    requirement: {
      type: 'vibe_checks',
      value: 1,
      description: 'Share 1 vibe check'
    }
  },
  {
    id: 'vibe-master',
    name: 'Vibe Master',
    description: 'Shared 20 vibe checks',
    emoji: '✨',
    category: 'social',
    rarity: 'rare',
    requirement: {
      type: 'vibe_checks',
      value: 20,
      description: 'Share 20 vibe checks'
    }
  },

  // Achievement Badges
  {
    id: 'aura-points-100',
    name: 'Point Collector',
    description: 'Earned 100 Aura Points',
    emoji: '💎',
    category: 'achievement',
    rarity: 'common',
    requirement: {
      type: 'aura_points',
      value: 100,
      description: 'Earn 100 Aura Points'
    }
  },
  {
    id: 'aura-points-500',
    name: 'Point Pro',
    description: 'Earned 500 Aura Points',
    emoji: '💍',
    category: 'achievement',
    rarity: 'rare',
    requirement: {
      type: 'aura_points',
      value: 500,
      description: 'Earn 500 Aura Points'
    }
  },
  {
    id: 'aura-points-1000',
    name: 'Point Legend',
    description: 'Earned 1000 Aura Points',
    emoji: '👑',
    category: 'achievement',
    rarity: 'epic',
    requirement: {
      type: 'aura_points',
      value: 1000,
      description: 'Earn 1000 Aura Points'
    }
  },
  {
    id: 'aura-points-5000',
    name: 'Point Master',
    description: 'Earned 5000 Aura Points',
    emoji: '🌟',
    category: 'achievement',
    rarity: 'legendary',
    requirement: {
      type: 'aura_points',
      value: 5000,
      description: 'Earn 5000 Aura Points'
    }
  },

  // Milestone Badges
  {
    id: 'first-week',
    name: 'Week One',
    description: 'Completed your first week on AuraZ',
    emoji: '📅',
    category: 'milestone',
    rarity: 'common',
    requirement: {
      type: 'special',
      value: 7,
      description: 'Be active for 7 days'
    }
  },
  {
    id: 'first-month',
    name: 'Monthly Member',
    description: 'Completed your first month on AuraZ',
    emoji: '🗓️',
    category: 'milestone',
    rarity: 'rare',
    requirement: {
      type: 'special',
      value: 30,
      description: 'Be active for 30 days'
    }
  },
  {
    id: 'first-year',
    name: 'Aura Veteran',
    description: 'Completed your first year on AuraZ',
    emoji: '🎂',
    category: 'milestone',
    rarity: 'legendary',
    requirement: {
      type: 'special',
      value: 365,
      description: 'Be active for 365 days'
    }
  },

  // Special Badges
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Joined AuraZ in its early days',
    emoji: '🚀',
    category: 'special',
    rarity: 'legendary',
    requirement: {
      type: 'special',
      value: 1,
      description: 'Join during beta period'
    }
  },
  {
    id: 'aura-avatar-master',
    name: 'Avatar Master',
    description: 'Unlocked all Aura Avatars',
    emoji: '🎭',
    category: 'special',
    rarity: 'epic',
    requirement: {
      type: 'special',
      value: 1,
      description: 'Unlock all available avatars'
    }
  },
  {
    id: 'wellness-warrior',
    name: 'Wellness Warrior',
    description: 'Completed all wellness focus areas',
    emoji: '🛡️',
    category: 'special',
    rarity: 'epic',
    requirement: {
      type: 'special',
      value: 1,
      description: 'Complete all wellness focus areas'
    }
  }
];

export const getBadgeById = (id: string): AuraBadge | undefined => {
  return auraBadges.find(badge => badge.id === id);
};

export const getBadgesByCategory = (category: AuraBadge['category']): AuraBadge[] => {
  return auraBadges.filter(badge => badge.category === category);
};

export const getBadgesByRarity = (rarity: AuraBadge['rarity']): AuraBadge[] => {
  return auraBadges.filter(badge => badge.rarity === rarity);
};

export const getUnlockedBadges = (userStats: {
  journalEntries?: number;
  streakDays?: number;
  auraPoints?: number;
  friendsAdded?: number;
  vibeChecks?: number;
  focusGoals?: number;
  daysActive?: number;
  isEarlyAdopter?: boolean;
  unlockedAvatars?: number;
  completedFocusAreas?: number;
}): AuraBadge[] => {
  return auraBadges.filter(badge => {
    switch (badge.requirement.type) {
      case 'journal_entries':
        return (userStats.journalEntries || 0) >= badge.requirement.value;
      case 'streak_days':
        return (userStats.streakDays || 0) >= badge.requirement.value;
      case 'aura_points':
        return (userStats.auraPoints || 0) >= badge.requirement.value;
      case 'friends_added':
        return (userStats.friendsAdded || 0) >= badge.requirement.value;
      case 'vibe_checks':
        return (userStats.vibeChecks || 0) >= badge.requirement.value;
      case 'focus_goals':
        return (userStats.focusGoals || 0) >= badge.requirement.value;
      case 'special':
        switch (badge.id) {
          case 'mood-tracker':
            return userStats.journalEntries !== undefined; // Assuming mood baseline is set
          case 'first-week':
            return (userStats.daysActive || 0) >= 7;
          case 'first-month':
            return (userStats.daysActive || 0) >= 30;
          case 'first-year':
            return (userStats.daysActive || 0) >= 365;
          case 'early-adopter':
            return userStats.isEarlyAdopter || false;
          case 'aura-avatar-master':
            return (userStats.unlockedAvatars || 0) >= 50; // Assuming 50 total avatars
          case 'wellness-warrior':
            return (userStats.completedFocusAreas || 0) >= 6; // Assuming 6 focus areas
          default:
            return false;
        }
      default:
        return false;
    }
  });
};

export const getNextBadge = (userStats: any): AuraBadge | null => {
  const unlockedBadges = getUnlockedBadges(userStats);
  const lockedBadges = auraBadges.filter(badge => 
    !unlockedBadges.some(unlocked => unlocked.id === badge.id)
  );
  
  // Sort by rarity and requirement value to get the next achievable badge
  return lockedBadges.sort((a, b) => {
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    return a.requirement.value - b.requirement.value;
  })[0] || null;
};