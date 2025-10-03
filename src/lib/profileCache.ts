// Profile Cache System for Performance Optimization
// Reduces redundant API calls and improves chat loading speed

import { PublicProfile } from './socialSystem';

interface CacheEntry {
  profile: PublicProfile | null;
  timestamp: number;
  loading: boolean;
}

class ProfileCache {
  private cache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<PublicProfile | null>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getProfile(userId: string, fetchFn: (id: string) => Promise<PublicProfile | null>): Promise<PublicProfile | null> {
    const now = Date.now();
    const cached = this.cache.get(userId);

    // Return cached data if still fresh
    if (cached && !cached.loading && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.profile;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(userId)) {
      return this.loadingPromises.get(userId)!;
    }

    // Start loading
    const loadingPromise = this.loadProfile(userId, fetchFn);
    this.loadingPromises.set(userId, loadingPromise);

    try {
      const profile = await loadingPromise;
      this.cache.set(userId, {
        profile,
        timestamp: now,
        loading: false,
      });
      return profile;
    } finally {
      this.loadingPromises.delete(userId);
    }
  }

  private async loadProfile(userId: string, fetchFn: (id: string) => Promise<PublicProfile | null>): Promise<PublicProfile | null> {
    try {
      return await fetchFn(userId);
    } catch (error) {
      console.warn(`Failed to load profile for ${userId}:`, error);
      return null;
    }
  }

  // Batch load multiple profiles efficiently
  async getProfiles(userIds: string[], fetchFn: (id: string) => Promise<PublicProfile | null>): Promise<{ [userId: string]: PublicProfile | null }> {
    const results: { [userId: string]: PublicProfile | null } = {};
    const toLoad: string[] = [];
    const now = Date.now();

    // Check cache first
    for (const userId of userIds) {
      const cached = this.cache.get(userId);
      if (cached && !cached.loading && (now - cached.timestamp) < this.CACHE_DURATION) {
        results[userId] = cached.profile;
      } else {
        toLoad.push(userId);
      }
    }

    // Load missing profiles in parallel
    if (toLoad.length > 0) {
      const loadPromises = toLoad.map(async (userId) => {
        const profile = await this.getProfile(userId, fetchFn);
        return { userId, profile };
      });

      const loadedProfiles = await Promise.all(loadPromises);
      loadedProfiles.forEach(({ userId, profile }) => {
        results[userId] = profile;
      });
    }

    return results;
  }

  // Invalidate cache for a specific user
  invalidate(userId: string): void {
    this.cache.delete(userId);
    this.loadingPromises.delete(userId);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      loading: this.loadingPromises.size,
    };
  }
}

// Global cache instance
export const profileCache = new ProfileCache();

// Helper function for batch profile loading
export async function loadProfilesBatch(
  userIds: string[], 
  fetchFn: (id: string) => Promise<PublicProfile | null>
): Promise<{ [userId: string]: PublicProfile | null }> {
  return profileCache.getProfiles(userIds, fetchFn);
}