# Centralized Aura Points System - Complete Implementation

## 🎯 Problem Solved

The original aura points system had several critical issues:
- **Multiple Point Sources**: Dashboard, profile, and journals used different point tracking systems
- **Inconsistent Data**: Points were stored in different places with different calculations
- **No Centralized Management**: Each component had its own point logic
- **Streak System Issues**: Streak tracking was fragmented and had no restore functionality
- **Badge System Disconnected**: Badges weren't properly integrated with point milestones

## 🏗️ New Centralized Architecture

### Core Components

1. **`/src/lib/centralizedAuraSystem.ts`** - Main centralized system
2. **Updated Dashboard** - `/src/app/aura-points/page.tsx`
3. **Updated Profile** - `/src/app/profile/page.tsx`
4. **Updated Journals** - All journal types now use centralized points
5. **Legacy Sync** - Automatic migration from old system

## 📊 Centralized Data Structure

### User Stats (`CentralizedAuraStats`)
```typescript
{
  // Core Points
  totalPoints: number;           // All-time earned
  availablePoints: number;       // Available to spend
  lifetimeEarned: number;        // Total earned
  lifetimeSpent: number;         // Total spent on rewards
  
  // Streak Management
  currentStreak: number;         // Current active streak
  longestStreak: number;         // Best streak ever
  streakType: 'journal' | 'daily' | 'mixed';
  streakRestoreCount: number;    // Times restored this month (max 5)
  
  // Daily/Weekly Tracking
  dailyPointsEarned: number;     // Points earned today
  weeklyPointsEarned: number;    // Points earned this week
  
  // Progression
  level: number;                 // Current level (1-10)
  experiencePoints: number;      // XP for leveling
  nextLevelXP: number;          // XP needed for next level
  
  // Achievements
  badges: string[];             // Earned badge IDs
  totalActivities: number;      // Total activities completed
  activityCounts: Record<AuraActivity, number>; // Per-activity counts
}
```

### Point Activities
```typescript
type AuraActivity = 
  | 'journal_entry'           // +10 base points
  | 'specialized_journal'     // +15 base points (CBT, Gratitude, etc.)
  | 'meditation_complete'     // +15 base points
  | 'workout_complete'        // +15 base points
  | 'aura_post'              // +5 base points
  | 'friend_support'         // +3 base points
  | 'streak_bonus'           // +5-50 points based on streak length
  | 'level_up'               // +25 points
  | 'badge_earned'           // +10 points
  | 'quest_completed'        // +25-200 points based on quest
  | 'squad_challenge'        // +20 points
  | 'daily_checkin'          // +5 points
  | 'mood_tracking'          // +3 points
  | 'goal_setting'           // +5 points
  | 'first_time_bonus';      // +20 points
```

## 🎮 Point Calculation Algorithm

### Base Points + Smart Bonuses
```typescript
const basePoints = AURA_POINT_VALUES[activity];
const qualityMultiplier = Math.min(quality / 100, 1.5); // Max 1.5x for quality
const completionMultiplier = Math.min(completion / 100, 1.2); // Max 1.2x for completion
const streakMultiplier = calculateStreakMultiplier(currentStreak);

const totalPoints = Math.round(
  basePoints * qualityMultiplier * completionMultiplier * streakMultiplier
);
```

### Streak Multipliers
- 3+ days: 1.1x
- 7+ days: 1.2x
- 30+ days: 1.5x
- 100+ days: 2.0x

### Daily Caps
- **Activity Caps**: Each activity has daily limits (e.g., journal_entry: 1/day)
- **Overall Daily Cap**: 100 points maximum per day
- **Prevents Grinding**: Encourages quality over quantity

## 🏆 Badge System

### Automatic Badge Earning
Badges are automatically awarded based on:
- **Point Milestones**: 100, 500, 1000, 5000 points
- **Streak Milestones**: 3, 7, 30, 100 days
- **Activity Milestones**: 50 meditations, 100 journal entries, etc.
- **Level Milestones**: Reaching specific levels

### Badge Categories
- **Streak Badges**: Getting Started, Week Warrior, Monthly Master, Century Sage
- **Points Badges**: Point Collector, Point Pro, Point Legend, Point Master
- **Activity Badges**: Journal Master, Zen Master, Social Butterfly
- **Special Badges**: Level-based and achievement-based

## 🔥 Streak Management

### Global Streak Tracking
- **Unified System**: All activities contribute to streak
- **Streak Types**: journal, daily, mixed
- **Automatic Updates**: Streak updates based on any activity
- **Streak Bonuses**: Extra points for maintaining streaks

### Streak Restore Feature
- **5 Restores Per Month**: Users can restore broken streaks
- **One-Time Use**: Each restore gives 1 day to continue streak
- **Monthly Reset**: Restore count resets each month
- **Smart UI**: Restore button only shows when needed

## 📱 Updated Dashboard Features

### Enhanced Stats Display
- **Available Points**: Shows current spendable points
- **Total Points**: Shows all-time earned points
- **Daily Progress**: Shows today's point earnings
- **Streak Info**: Current streak, best streak, streak type
- **Level Progress**: XP progress with visual bar
- **Activity Counts**: Total activities completed

### Real-Time Updates
- **Live Data**: Dashboard updates in real-time
- **Transaction History**: Recent point earnings with details
- **Badge Collection**: Visual badge display with rarity
- **Streak Restore**: One-click streak restoration

## 🔄 Legacy System Migration

### Automatic Sync
```typescript
// Syncs legacy auraTotal points to centralized system
await syncLegacyAuraPoints(userUid);
```

### Backward Compatibility
- **Profile Integration**: Profile still shows aura points from centralized system
- **Gradual Migration**: Old and new systems work together during transition
- **Data Preservation**: No data loss during migration

## 🎯 Point Sources Integration

### Journal System
- **Regular Journal**: 10 base points + quality bonuses
- **Specialized Journals**: 15 base points + completion bonuses
- **CBT Therapy**: Extra bonuses for emotional progress
- **Daily Check-in**: Completion-based scoring

### Other Activities
- **Meditation**: 15 base points + completion bonuses
- **Workouts**: 15 base points + duration bonuses
- **Aura Posts**: 5 base points + engagement bonuses
- **Friend Support**: 3 base points + consistency bonuses

## 🚀 Key Benefits

### For Users
- **Consistent Experience**: Same point system across all features
- **Clear Progress**: Centralized dashboard shows everything
- **Streak Protection**: 5 monthly streak restores
- **Smart Bonuses**: Quality and consistency are rewarded
- **Badge Rewards**: Automatic badge earning with point bonuses

### For Developers
- **Single Source of Truth**: All points managed in one place
- **Easy Integration**: Simple API for awarding points
- **Scalable**: Easy to add new activities and point sources
- **Maintainable**: Centralized logic reduces bugs
- **Analytics Ready**: Rich data for user behavior analysis

## 📈 Algorithm Summary

### Point Calculation Formula
```
Total Points = Base Points × Quality Multiplier × Completion Multiplier × Streak Multiplier

Where:
- Base Points: Fixed per activity type (5-25 points)
- Quality Multiplier: 1.0x to 1.5x based on activity quality
- Completion Multiplier: 1.0x to 1.2x based on completion percentage
- Streak Multiplier: 1.0x to 2.0x based on current streak length
```

### Daily Limits
- **Per Activity**: 1-10 times per day depending on activity
- **Overall Daily**: 100 points maximum per day
- **Prevents Abuse**: Encourages sustainable engagement

### Level Progression
- **Level 1**: 0-999 XP
- **Level 2**: 1000-2999 XP
- **Level 3**: 3000-5999 XP
- **Level 4**: 6000-9999 XP
- **Level 5**: 10000-14999 XP
- **Level 6**: 15000-24999 XP
- **Level 7**: 25000-39999 XP
- **Level 8**: 40000-59999 XP
- **Level 9**: 60000-99999 XP
- **Level 10**: 100000+ XP

## 🎉 Implementation Complete

The centralized aura points system is now fully implemented and integrated across:
- ✅ Dashboard with real-time updates
- ✅ Profile with centralized stats
- ✅ All journal types (regular + specialized)
- ✅ Streak management with restore feature
- ✅ Badge system with automatic earning
- ✅ Legacy system migration
- ✅ Point calculation algorithm
- ✅ Daily caps and quality bonuses

The system provides a unified, engaging, and sustainable point economy that encourages quality wellness activities while preventing abuse through smart caps and bonuses.