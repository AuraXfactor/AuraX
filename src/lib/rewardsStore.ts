import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Reward, getAuraStatsRef, getUserAuraStats } from './auraPoints';

// Re-export Reward for external use
export type { Reward };

// Phase 1: Digital Goods (Launch)
const DIGITAL_REWARDS: Omit<Reward, 'id' | 'createdAt' | 'claimed'>[] = [
  // Badges
  {
    title: 'Mindful Master Badge',
    description: 'Show off your meditation dedication',
    cost: 500,
    category: 'badge',
    type: 'digital',
    phase: 1,
    rarity: 'rare',
    metadata: { badgeIcon: '🧘‍♀️' },
    isActive: true,
  },
  {
    title: 'Consistency Champion Badge',
    description: 'Proof of your journaling streak',
    cost: 750,
    category: 'badge',
    type: 'digital',
    phase: 1,
    rarity: 'epic',
    metadata: { badgeIcon: '👑' },
    isActive: true,
    requirements: { level: 5 },
  },
  {
    title: 'Social Butterfly Badge',
    description: 'Master of community connection',
    cost: 300,
    category: 'badge',
    type: 'digital',
    phase: 1,
    rarity: 'common',
    metadata: { badgeIcon: '🦋' },
    isActive: true,
  },
  
  // Themes
  {
    title: 'Midnight Dreams Theme',
    description: 'A beautiful dark theme with starry accents',
    cost: 1000,
    category: 'theme',
    type: 'digital',
    phase: 1,
    rarity: 'epic',
    metadata: { themeId: 'midnight_dreams' },
    isActive: true,
  },
  {
    title: 'Ocean Breeze Theme',
    description: 'Calming blue tones for peace of mind',
    cost: 800,
    category: 'theme',
    type: 'digital',
    phase: 1,
    rarity: 'rare',
    metadata: { themeId: 'ocean_breeze' },
    isActive: true,
  },
  {
    title: 'Golden Hour Theme',
    description: 'Warm, inspiring sunset colors',
    cost: 1200,
    category: 'theme',
    type: 'digital',
    phase: 1,
    rarity: 'epic',
    metadata: { themeId: 'golden_hour' },
    isActive: true,
    requirements: { level: 10 },
  },
  {
    title: 'Rainbow Celebration Theme',
    description: 'Vibrant colors for legendary achievements',
    cost: 2000,
    category: 'theme',
    type: 'digital',
    phase: 1,
    rarity: 'legendary',
    metadata: { themeId: 'rainbow_celebration' },
    isActive: true,
    requirements: { level: 20, badges: ['legendary_explorer'] },
  },
  
  // Stickers & Frames
  {
    title: 'Zen Sticker Pack',
    description: 'Animated meditation stickers for chats',
    cost: 250,
    category: 'sticker',
    type: 'digital',
    phase: 1,
    rarity: 'common',
    isActive: true,
  },
  {
    title: 'Motivational Frame Pack',
    description: 'Inspiring frames for your Aura posts',
    cost: 400,
    category: 'frame',
    type: 'digital',
    phase: 1,
    rarity: 'rare',
    isActive: true,
  },
  {
    title: 'Celebration Animation',
    description: 'Special animation for your profile',
    cost: 600,
    category: 'badge',
    type: 'digital',
    phase: 1,
    rarity: 'rare',
    metadata: { badgeIcon: '✨', special: 'animated' },
    isActive: true,
  },
];

// Phase 2: Partner Rewards (Growth)
const PARTNER_REWARDS: Omit<Reward, 'id' | 'createdAt' | 'claimed'>[] = [
  // Airtime & Data
  {
    title: '$5 Airtime Credit',
    description: 'Universal mobile airtime for any carrier',
    cost: 1000,
    category: 'partner',
    type: 'service',
    phase: 2,
    rarity: 'common',
    metadata: { partnerName: 'Telecom Partners', validityDays: 30 },
    isActive: false, // Will activate when partnerships are ready
  },
  {
    title: '1GB Data Bundle',
    description: 'Mobile data for staying connected',
    cost: 800,
    category: 'partner',
    type: 'service',
    phase: 2,
    rarity: 'common',
    metadata: { partnerName: 'Telecom Partners', validityDays: 30 },
    isActive: false,
  },
  
  // Discounts
  {
    title: '20% Off Healthy Bites Cafe',
    description: 'Discount at wellness-focused restaurants',
    cost: 500,
    category: 'partner',
    type: 'service',
    phase: 2,
    rarity: 'common',
    metadata: { partnerName: 'Healthy Bites Cafe', discountPercent: 20, validityDays: 30 },
    isActive: false,
  },
  {
    title: '15% Off Gym Membership',
    description: 'Partner gym membership discount',
    cost: 750,
    category: 'partner',
    type: 'service',
    phase: 2,
    rarity: 'rare',
    metadata: { partnerName: 'FitLife Gyms', discountPercent: 15, validityDays: 60 },
    isActive: false,
  },
  
  // Merchandise
  {
    title: 'AuraX Water Bottle',
    description: 'Premium stainless steel water bottle',
    cost: 1500,
    category: 'merchandise',
    type: 'physical',
    phase: 2,
    rarity: 'rare',
    isActive: false,
    isLimited: true,
    limitQuantity: 100,
  },
  {
    title: 'AuraX Mindfulness Journal',
    description: 'Physical journal with guided prompts',
    cost: 2000,
    category: 'merchandise',
    type: 'physical',
    phase: 2,
    rarity: 'epic',
    isActive: false,
    isLimited: true,
    limitQuantity: 50,
  },
  {
    title: 'AuraX T-Shirt',
    description: 'Comfortable cotton tee with AuraX logo',
    cost: 1200,
    category: 'merchandise',
    type: 'physical',
    phase: 2,
    rarity: 'rare',
    isActive: false,
    isLimited: true,
    limitQuantity: 200,
  },
];

// User purchase record
export interface PurchaseRecord {
  id: string;
  userUid: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  type: 'badge' | 'theme' | 'sticker' | 'frame' | 'partner' | 'merchandise';
  status: 'claimed' | 'pending' | 'shipped' | 'delivered';
  metadata?: Record<string, unknown>;
  claimedAt: Timestamp | null;
  deliveredAt?: Timestamp | null;
  shippingInfo?: {
    address: string;
    trackingNumber?: string;
  };
}

// Get all available rewards
export async function getAvailableRewards(phase: 1 | 2 = 1): Promise<Reward[]> {
  try {
    const q = query(
      collection(db, 'rewards'),
      where('isActive', '==', true),
      where('phase', '==', phase),
      orderBy('cost', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reward[];
  } catch (error) {
    console.error('Error getting available rewards:', error);
    return [];
  }
}

// Get rewards by category
export async function getRewardsByCategory(category: Reward['category']): Promise<Reward[]> {
  try {
    const q = query(
      collection(db, 'rewards'),
      where('isActive', '==', true),
      where('category', '==', category),
      orderBy('cost', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reward[];
  } catch (error) {
    console.error('Error getting rewards by category:', error);
    return [];
  }
}

// Check if user can afford and meets requirements for a reward
export async function canUserClaimReward(
  userUid: string, 
  rewardId: string
): Promise<{ canClaim: boolean; reason?: string }> {
  try {
    const [userStats, rewardDoc] = await Promise.all([
      getUserAuraStats(userUid),
      getDoc(doc(db, 'rewards', rewardId))
    ]);
    
    if (!userStats) {
      return { canClaim: false, reason: 'User stats not found' };
    }
    
    if (!rewardDoc.exists()) {
      return { canClaim: false, reason: 'Reward not found' };
    }
    
    const reward = rewardDoc.data() as Reward;
    
    if (!reward.isActive) {
      return { canClaim: false, reason: 'Reward is no longer available' };
    }
    
    if (userStats.availablePoints < reward.cost) {
      return { canClaim: false, reason: `Need ${reward.cost - userStats.availablePoints} more points` };
    }
    
    // Check level requirement
    if (reward.requirements?.level && userStats.level < reward.requirements.level) {
      return { canClaim: false, reason: `Must be level ${reward.requirements.level}` };
    }
    
    // Check badge requirements
    if (reward.requirements?.badges) {
      const missingBadges = reward.requirements.badges.filter(
        badge => !userStats.badges.includes(badge)
      );
      if (missingBadges.length > 0) {
        return { canClaim: false, reason: `Missing required badges: ${missingBadges.join(', ')}` };
      }
    }
    
    // Check achievement requirements
    if (reward.requirements?.achievements) {
      const missingAchievements = reward.requirements.achievements.filter(
        achievement => !userStats.achievements.includes(achievement)
      );
      if (missingAchievements.length > 0) {
        return { canClaim: false, reason: `Missing required achievements: ${missingAchievements.join(', ')}` };
      }
    }
    
    // Check if limited quantity is available
    if (reward.isLimited && reward.limitQuantity && reward.claimed >= reward.limitQuantity) {
      return { canClaim: false, reason: 'Limited quantity sold out' };
    }
    
    return { canClaim: true };
  } catch (error) {
    console.error('Error checking reward eligibility:', error);
    return { canClaim: false, reason: 'Error checking eligibility' };
  }
}

// Claim a reward
export async function claimReward(
  user: User,
  rewardId: string,
  shippingInfo?: PurchaseRecord['shippingInfo']
): Promise<{ success: boolean; message: string; purchaseId?: string }> {
  try {
    const eligibility = await canUserClaimReward(user.uid, rewardId);
    if (!eligibility.canClaim) {
      return { success: false, message: eligibility.reason || 'Cannot claim reward' };
    }
    
    const [userStats, rewardDoc] = await Promise.all([
      getUserAuraStats(user.uid),
      getDoc(doc(db, 'rewards', rewardId))
    ]);
    
    if (!userStats || !rewardDoc.exists()) {
      return { success: false, message: 'Reward or user data not found' };
    }
    
    const reward = rewardDoc.data() as Reward;
    
    const batch = writeBatch(db);
    
    // Create purchase record
    const purchaseData = {
      userUid: user.uid,
      rewardId,
      rewardTitle: reward.title,
      pointsCost: reward.cost,
      type: reward.category,
      status: reward.type === 'physical' ? 'pending' : 'claimed',
      metadata: reward.metadata,
      claimedAt: serverTimestamp(),
      shippingInfo,
    };
    
    const purchaseRef = doc(collection(db, 'users', user.uid, 'purchases'));
    batch.set(purchaseRef, purchaseData);
    
    // Update user stats
    const userStatsRef = getAuraStatsRef(user.uid);
    const updateData: Record<string, unknown> = {
      availablePoints: userStats.availablePoints - reward.cost,
      lifetimeSpent: userStats.lifetimeSpent + reward.cost,
    };
    
    // Apply the reward based on type
    if (reward.category === 'badge') {
      updateData.badges = arrayUnion(reward.metadata?.badgeIcon || reward.title);
    } else if (reward.category === 'theme') {
      // Theme would be applied in the UI layer
    }
    
    batch.update(userStatsRef, updateData);
    
    // Update reward claimed count
    const rewardRef = doc(db, 'rewards', rewardId);
    batch.update(rewardRef, {
      claimed: reward.claimed + 1,
    });
    
    await batch.commit();
    
    let message = `Successfully claimed ${reward.title}! 🎉`;
    if (reward.type === 'physical') {
      message += ' Your item will be shipped soon.';
    }
    
    return { success: true, message, purchaseId: purchaseRef.id };
  } catch (error) {
    console.error('Error claiming reward:', error);
    return { success: false, message: 'Failed to claim reward' };
  }
}

// Get user's purchase history
export async function getUserPurchases(userUid: string): Promise<PurchaseRecord[]> {
  try {
    const q = query(
      collection(db, 'users', userUid, 'purchases'),
      orderBy('claimedAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PurchaseRecord[];
  } catch (error) {
    console.error('Error getting user purchases:', error);
    return [];
  }
}

// Get featured/recommended rewards
export async function getFeaturedRewards(): Promise<{
  newArrivals: Reward[];
  popular: Reward[];
  limited: Reward[];
  affordable: Reward[];
}> {
  try {
    const [allRewards] = await Promise.all([
      getAvailableRewards(1), // Start with Phase 1 rewards
    ]);
    
    // Sort and categorize
    const newArrivals = allRewards
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      .slice(0, 4);
    
    const popular = allRewards
      .sort((a, b) => b.claimed - a.claimed)
      .slice(0, 4);
    
    const limited = allRewards
      .filter(r => r.isLimited && r.limitQuantity && r.claimed < r.limitQuantity)
      .sort((a, b) => (a.limitQuantity! - a.claimed) - (b.limitQuantity! - b.claimed))
      .slice(0, 4);
    
    const affordable = allRewards
      .filter(r => r.cost <= 500)
      .sort((a, b) => a.cost - b.cost)
      .slice(0, 4);
    
    return {
      newArrivals,
      popular,
      limited,
      affordable,
    };
  } catch (error) {
    console.error('Error getting featured rewards:', error);
    return {
      newArrivals: [],
      popular: [],
      limited: [],
      affordable: [],
    };
  }
}

// Initialize rewards store with default rewards
export async function initializeRewardsStore(): Promise<void> {
  try {
    const allRewards = [...DIGITAL_REWARDS, ...PARTNER_REWARDS];
    
    for (const rewardData of allRewards) {
      const reward = {
        ...rewardData,
        claimed: 0,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'rewards'), reward);
    }
    
    console.log('Rewards store initialized with default rewards');
  } catch (error) {
    console.error('Error initializing rewards store:', error);
  }
}

// Partner integration helper (for Phase 2)
export async function processPartnerReward(
  purchaseId: string,
  partnerApiResponse: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  try {
    // This would integrate with partner APIs
    // For example, calling telecom API to credit airtime
    // Or generating discount codes for restaurants
    
    // For now, just mark as delivered
    const userUid = 'extracted_from_purchase'; // Would extract from purchase record
    const purchaseRef = doc(db, 'users', userUid, 'purchases', purchaseId);
    
    await updateDoc(purchaseRef, {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
      metadata: {
        ...partnerApiResponse,
        deliveryConfirmation: true,
      },
    });
    
    return { success: true, message: 'Partner reward delivered successfully' };
  } catch (error) {
    console.error('Error processing partner reward:', error);
    return { success: false, message: 'Failed to process partner reward' };
  }
}

// Analytics for reward performance
export async function getRewardAnalytics(): Promise<{
  totalRewardsClaimed: number;
  totalPointsSpent: number;
  popularCategories: Array<{ category: string; count: number }>;
  revenueByType: Array<{ type: string; points: number }>;
}> {
  try {
    // This would typically be done with aggregation queries or Cloud Functions
    // For now, we'll provide a basic implementation
    
    const rewardsSnapshot = await getDocs(collection(db, 'rewards'));
    const rewards = rewardsSnapshot.docs.map(doc => doc.data() as Reward);
    
    const totalRewardsClaimed = rewards.reduce((sum, r) => sum + r.claimed, 0);
    const totalPointsSpent = rewards.reduce((sum, r) => sum + (r.claimed * r.cost), 0);
    
    // Category popularity
    const categoryMap = new Map<string, number>();
    rewards.forEach(r => {
      categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + r.claimed);
    });
    
    const popularCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Revenue by type
    const typeMap = new Map<string, number>();
    rewards.forEach(r => {
      typeMap.set(r.type, (typeMap.get(r.type) || 0) + (r.claimed * r.cost));
    });
    
    const revenueByType = Array.from(typeMap.entries())
      .map(([type, points]) => ({ type, points }))
      .sort((a, b) => b.points - a.points);
    
    return {
      totalRewardsClaimed,
      totalPointsSpent,
      popularCategories,
      revenueByType,
    };
  } catch (error) {
    console.error('Error getting reward analytics:', error);
    return {
      totalRewardsClaimed: 0,
      totalPointsSpent: 0,
      popularCategories: [],
      revenueByType: [],
    };
  }
}