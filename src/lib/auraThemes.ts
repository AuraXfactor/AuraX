export interface AuraTheme {
  id: string;
  name: string;
  description: string;
  category: 'light' | 'dark' | 'pastel' | 'neon' | 'minimal' | 'nature' | 'cosmic' | 'gradient';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients?: {
    primary: string;
    secondary: string;
    background: string;
  };
  isPremium?: boolean;
  unlockLevel?: number;
}

export const auraThemes: AuraTheme[] = [
  // Light Themes
  {
    id: 'light-pastel',
    name: 'Light Pastel',
    description: 'Soft, gentle colors for a calming experience',
    category: 'pastel',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#FEFEFE',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-purple-500 to-blue-500',
      secondary: 'from-cyan-400 to-blue-500',
      background: 'from-white to-gray-50',
    }
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Clean, minimal design with subtle colors',
    category: 'minimal',
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#D1D5DB',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
    gradients: {
      primary: 'from-indigo-500 to-purple-600',
      secondary: 'from-purple-500 to-pink-500',
      background: 'from-white to-gray-50',
    }
  },

  // Dark Themes
  {
    id: 'dark-mystic',
    name: 'Dark Mystic',
    description: 'Deep, mysterious colors for night owls',
    category: 'dark',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-purple-600 to-blue-600',
      secondary: 'from-cyan-500 to-blue-600',
      background: 'from-slate-900 to-slate-800',
    }
  },
  {
    id: 'dark-neon',
    name: 'Dark Neon',
    description: 'Bold neon colors on dark background',
    category: 'neon',
    colors: {
      primary: '#00F5FF',
      secondary: '#FF00FF',
      accent: '#00FF00',
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      border: '#333333',
      success: '#00FF88',
      warning: '#FFAA00',
      error: '#FF4444',
      info: '#0088FF',
    },
    gradients: {
      primary: 'from-cyan-400 to-blue-500',
      secondary: 'from-pink-500 to-purple-500',
      background: 'from-black to-gray-900',
    },
    isPremium: true
  },

  // Pastel Themes
  {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    description: 'Soft lavender and purple tones',
    category: 'pastel',
    colors: {
      primary: '#A78BFA',
      secondary: '#C084FC',
      accent: '#F0ABFC',
      background: '#FDFBFF',
      surface: '#F8F5FF',
      text: '#4C1D95',
      textSecondary: '#7C3AED',
      border: '#E9D5FF',
      success: '#86EFAC',
      warning: '#FDE047',
      error: '#FCA5A5',
      info: '#93C5FD',
    },
    gradients: {
      primary: 'from-purple-400 to-purple-600',
      secondary: 'from-purple-300 to-pink-300',
      background: 'from-purple-50 to-pink-50',
    }
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    description: 'Cool mint and teal colors',
    category: 'pastel',
    colors: {
      primary: '#34D399',
      secondary: '#22D3EE',
      accent: '#A7F3D0',
      background: '#F0FDFA',
      surface: '#ECFDF5',
      text: '#064E3B',
      textSecondary: '#059669',
      border: '#A7F3D0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA',
    },
    gradients: {
      primary: 'from-emerald-400 to-teal-500',
      secondary: 'from-teal-400 to-cyan-400',
      background: 'from-emerald-50 to-teal-50',
    }
  },

  // Neon Themes
  {
    id: 'electric-vibes',
    name: 'Electric Vibes',
    description: 'High-energy neon colors',
    category: 'neon',
    colors: {
      primary: '#FF0080',
      secondary: '#00FF80',
      accent: '#8000FF',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      border: '#404040',
      success: '#00FF88',
      warning: '#FFFF00',
      error: '#FF4040',
      info: '#0080FF',
    },
    gradients: {
      primary: 'from-pink-500 to-purple-600',
      secondary: 'from-green-400 to-blue-500',
      background: 'from-gray-900 to-black',
    },
    isPremium: true
  },
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    description: 'Futuristic cyberpunk aesthetic',
    category: 'neon',
    colors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#FFFF00',
      background: '#000000',
      surface: '#0D1117',
      text: '#00FF00',
      textSecondary: '#CCCCCC',
      border: '#333333',
      success: '#00FF88',
      warning: '#FFAA00',
      error: '#FF4444',
      info: '#0088FF',
    },
    gradients: {
      primary: 'from-cyan-400 to-blue-500',
      secondary: 'from-pink-500 to-purple-500',
      background: 'from-black to-gray-900',
    },
    isPremium: true
  },

  // Nature Themes
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural forest and earth tones',
    category: 'nature',
    colors: {
      primary: '#059669',
      secondary: '#0891B2',
      accent: '#CA8A04',
      background: '#F0FDF4',
      surface: '#ECFDF5',
      text: '#14532D',
      textSecondary: '#166534',
      border: '#BBF7D0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-green-600 to-emerald-600',
      secondary: 'from-emerald-500 to-teal-500',
      background: 'from-green-50 to-emerald-50',
    }
  },
  {
    id: 'sunset-warmth',
    name: 'Sunset Warmth',
    description: 'Warm sunset colors',
    category: 'nature',
    colors: {
      primary: '#EA580C',
      secondary: '#DC2626',
      accent: '#F59E0B',
      background: '#FFF7ED',
      surface: '#FFEDD5',
      text: '#9A3412',
      textSecondary: '#C2410C',
      border: '#FED7AA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-orange-600 to-red-600',
      secondary: 'from-red-500 to-pink-500',
      background: 'from-orange-50 to-red-50',
    }
  },

  // Cosmic Themes
  {
    id: 'cosmic-purple',
    name: 'Cosmic Purple',
    description: 'Deep space and cosmic colors',
    category: 'cosmic',
    colors: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#06B6D4',
      background: '#1E1B4B',
      surface: '#312E81',
      text: '#E0E7FF',
      textSecondary: '#A5B4FC',
      border: '#4F46E5',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-purple-600 to-pink-600',
      secondary: 'from-pink-500 to-cyan-500',
      background: 'from-indigo-900 to-purple-900',
    }
  },
  {
    id: 'galaxy-blue',
    name: 'Galaxy Blue',
    description: 'Deep galaxy and nebula colors',
    category: 'cosmic',
    colors: {
      primary: '#1D4ED8',
      secondary: '#7C2D12',
      accent: '#059669',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#E0F2FE',
      textSecondary: '#7DD3FC',
      border: '#0369A1',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-blue-600 to-indigo-600',
      secondary: 'from-indigo-500 to-purple-500',
      background: 'from-slate-900 to-blue-900',
    }
  },

  // Gradient Themes
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired gradients',
    category: 'gradient',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#10B981',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-purple-500 via-pink-500 to-red-500',
      secondary: 'from-cyan-400 via-blue-500 to-purple-600',
      background: 'from-slate-900 via-purple-900 to-slate-900',
    },
    isPremium: true
  },
  {
    id: 'rainbow-pride',
    name: 'Rainbow Pride',
    description: 'Celebratory rainbow gradients',
    category: 'gradient',
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FEFEFE',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      primary: 'from-red-500 via-yellow-500 to-green-500',
      secondary: 'from-blue-500 via-purple-500 to-pink-500',
      background: 'from-red-50 via-yellow-50 to-green-50',
    }
  }
];

export const getThemeById = (id: string): AuraTheme | undefined => {
  return auraThemes.find(theme => theme.id === id);
};

export const getThemesByCategory = (category: AuraTheme['category']): AuraTheme[] => {
  return auraThemes.filter(theme => theme.category === category);
};

export const getFreeThemes = (): AuraTheme[] => {
  return auraThemes.filter(theme => !theme.isPremium);
};

export const getPremiumThemes = (): AuraTheme[] => {
  return auraThemes.filter(theme => theme.isPremium);
};

export const getUnlockedThemes = (userLevel: number = 1): AuraTheme[] => {
  return auraThemes.filter(theme => 
    !theme.unlockLevel || theme.unlockLevel <= userLevel
  );
};