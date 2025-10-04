export interface AuraAvatar {
  id: string;
  name: string;
  emoji: string;
  category: 'nature' | 'cosmic' | 'energy' | 'animal' | 'mystical' | 'minimal';
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel?: number;
  isPremium?: boolean;
}

export const auraAvatars: AuraAvatar[] = [
  // Nature Category
  { id: 'leaf-1', name: 'Fresh Leaf', emoji: '🍃', category: 'nature', description: 'Fresh beginnings and growth', rarity: 'common' },
  { id: 'flower-1', name: 'Blossom', emoji: '🌸', category: 'nature', description: 'Gentle beauty and renewal', rarity: 'common' },
  { id: 'tree-1', name: 'Ancient Oak', emoji: '🌳', category: 'nature', description: 'Strength and wisdom', rarity: 'rare' },
  { id: 'sunflower-1', name: 'Sun Seeker', emoji: '🌻', category: 'nature', description: 'Optimism and joy', rarity: 'common' },
  { id: 'mountain-1', name: 'Peak Spirit', emoji: '🏔️', category: 'nature', description: 'Ambition and resilience', rarity: 'rare' },
  { id: 'ocean-1', name: 'Wave Rider', emoji: '🌊', category: 'nature', description: 'Flow and adaptability', rarity: 'common' },
  { id: 'forest-1', name: 'Forest Guardian', emoji: '🌲', category: 'nature', description: 'Protection and grounding', rarity: 'epic' },
  { id: 'desert-1', name: 'Desert Sage', emoji: '🏜️', category: 'nature', description: 'Patience and endurance', rarity: 'rare' },

  // Cosmic Category
  { id: 'star-1', name: 'Starlight', emoji: '⭐', category: 'cosmic', description: 'Hope and guidance', rarity: 'common' },
  { id: 'moon-1', name: 'Lunar Dreamer', emoji: '🌙', category: 'cosmic', description: 'Intuition and mystery', rarity: 'rare' },
  { id: 'sun-1', name: 'Solar Flare', emoji: '☀️', category: 'cosmic', description: 'Energy and vitality', rarity: 'rare' },
  { id: 'galaxy-1', name: 'Galaxy Explorer', emoji: '🌌', category: 'cosmic', description: 'Infinite possibilities', rarity: 'epic' },
  { id: 'comet-1', name: 'Cosmic Wanderer', emoji: '☄️', category: 'cosmic', description: 'Adventure and discovery', rarity: 'rare' },
  { id: 'planet-1', name: 'Planet Keeper', emoji: '🪐', category: 'cosmic', description: 'Balance and harmony', rarity: 'epic' },
  { id: 'nebula-1', name: 'Nebula Weaver', emoji: '🌠', category: 'cosmic', description: 'Creation and transformation', rarity: 'legendary' },
  { id: 'eclipse-1', name: 'Eclipse Mystic', emoji: '🌑', category: 'cosmic', description: 'Hidden depths and power', rarity: 'legendary' },

  // Energy Category
  { id: 'lightning-1', name: 'Electric Soul', emoji: '⚡', category: 'energy', description: 'Power and intensity', rarity: 'rare' },
  { id: 'fire-1', name: 'Flame Spirit', emoji: '🔥', category: 'energy', description: 'Passion and transformation', rarity: 'common' },
  { id: 'wind-1', name: 'Wind Walker', emoji: '💨', category: 'energy', description: 'Freedom and movement', rarity: 'common' },
  { id: 'crystal-1', name: 'Crystal Heart', emoji: '💎', category: 'energy', description: 'Clarity and focus', rarity: 'rare' },
  { id: 'rainbow-1', name: 'Rainbow Bridge', emoji: '🌈', category: 'energy', description: 'Diversity and connection', rarity: 'epic' },
  { id: 'aurora-1', name: 'Aurora Dancer', emoji: '🌅', category: 'energy', description: 'Magic and wonder', rarity: 'legendary' },
  { id: 'sparkle-1', name: 'Sparkle Magic', emoji: '✨', category: 'energy', description: 'Joy and enchantment', rarity: 'common' },
  { id: 'glow-1', name: 'Inner Glow', emoji: '💫', category: 'energy', description: 'Inner light and radiance', rarity: 'rare' },

  // Animal Category
  { id: 'butterfly-1', name: 'Butterfly Soul', emoji: '🦋', category: 'animal', description: 'Transformation and grace', rarity: 'common' },
  { id: 'owl-1', name: 'Wise Owl', emoji: '🦉', category: 'animal', description: 'Wisdom and insight', rarity: 'rare' },
  { id: 'dolphin-1', name: 'Ocean Friend', emoji: '🐬', category: 'animal', description: 'Playfulness and intelligence', rarity: 'rare' },
  { id: 'wolf-1', name: 'Lone Wolf', emoji: '🐺', category: 'animal', description: 'Independence and loyalty', rarity: 'epic' },
  { id: 'phoenix-1', name: 'Phoenix Rising', emoji: '🔥', category: 'animal', description: 'Rebirth and renewal', rarity: 'legendary' },
  { id: 'dragon-1', name: 'Dragon Heart', emoji: '🐉', category: 'animal', description: 'Power and majesty', rarity: 'legendary' },
  { id: 'unicorn-1', name: 'Unicorn Dream', emoji: '🦄', category: 'animal', description: 'Purity and magic', rarity: 'epic' },
  { id: 'eagle-1', name: 'Sky Hunter', emoji: '🦅', category: 'animal', description: 'Vision and freedom', rarity: 'rare' },

  // Mystical Category
  { id: 'crystal-ball-1', name: 'Crystal Seer', emoji: '🔮', category: 'mystical', description: 'Insight and foresight', rarity: 'epic' },
  { id: 'wand-1', name: 'Magic Wand', emoji: '🪄', category: 'mystical', description: 'Power and intention', rarity: 'rare' },
  { id: 'potion-1', name: 'Elixir Maker', emoji: '🧪', category: 'mystical', description: 'Healing and transformation', rarity: 'rare' },
  { id: 'tarot-1', name: 'Tarot Reader', emoji: '🃏', category: 'mystical', description: 'Guidance and wisdom', rarity: 'epic' },
  { id: 'yin-yang-1', name: 'Balance Keeper', emoji: '☯️', category: 'mystical', description: 'Harmony and balance', rarity: 'rare' },
  { id: 'infinity-1', name: 'Infinity Soul', emoji: '♾️', category: 'mystical', description: 'Eternal connection', rarity: 'legendary' },
  { id: 'mandala-1', name: 'Sacred Circle', emoji: '🕉️', category: 'mystical', description: 'Unity and spirituality', rarity: 'epic' },
  { id: 'lotus-1', name: 'Lotus Bloom', emoji: '🪷', category: 'mystical', description: 'Enlightenment and purity', rarity: 'legendary' },

  // Minimal Category
  { id: 'circle-1', name: 'Pure Circle', emoji: '⭕', category: 'minimal', description: 'Simplicity and wholeness', rarity: 'common' },
  { id: 'dot-1', name: 'Focus Point', emoji: '🔴', category: 'minimal', description: 'Concentration and clarity', rarity: 'common' },
  { id: 'line-1', name: 'Straight Path', emoji: '➖', category: 'minimal', description: 'Direction and purpose', rarity: 'common' },
  { id: 'triangle-1', name: 'Sacred Triangle', emoji: '🔺', category: 'minimal', description: 'Stability and growth', rarity: 'rare' },
  { id: 'square-1', name: 'Foundation Stone', emoji: '⬜', category: 'minimal', description: 'Grounding and structure', rarity: 'common' },
  { id: 'heart-1', name: 'Pure Heart', emoji: '❤️', category: 'minimal', description: 'Love and compassion', rarity: 'rare' },
  { id: 'peace-1', name: 'Peace Sign', emoji: '☮️', category: 'minimal', description: 'Harmony and tranquility', rarity: 'rare' },
  { id: 'zen-1', name: 'Zen Circle', emoji: '⭕', category: 'minimal', description: 'Meditation and mindfulness', rarity: 'epic' },
];

export const getAvatarById = (id: string): AuraAvatar | undefined => {
  return auraAvatars.find(avatar => avatar.id === id);
};

export const getAvatarsByCategory = (category: AuraAvatar['category']): AuraAvatar[] => {
  return auraAvatars.filter(avatar => avatar.category === category);
};

export const getAvatarsByRarity = (rarity: AuraAvatar['rarity']): AuraAvatar[] => {
  return auraAvatars.filter(avatar => avatar.rarity === rarity);
};

export const getRandomAvatar = (): AuraAvatar => {
  const commonAvatars = getAvatarsByRarity('common');
  return commonAvatars[Math.floor(Math.random() * commonAvatars.length)];
};

export const getUnlockedAvatars = (userLevel: number = 1): AuraAvatar[] => {
  return auraAvatars.filter(avatar => 
    !avatar.unlockLevel || avatar.unlockLevel <= userLevel
  );
};

export const getPremiumAvatars = (): AuraAvatar[] => {
  return auraAvatars.filter(avatar => avatar.isPremium);
};

export const getFreeAvatars = (): AuraAvatar[] => {
  return auraAvatars.filter(avatar => !avatar.isPremium);
};