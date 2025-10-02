"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';

export default function AffirmationsPage() {
  const { user } = useAuth();
  const { isOfflineMode, saveOffline, getOfflineData } = useOffline();
  const prefersReducedMotion = useReducedMotion();
  const [cards, setCards] = useState<string[]>([
    'I am grounded and safe.',
    'I can handle this moment.',
    'I choose to breathe and soften.',
  ]);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  // Load offline affirmations
  useEffect(() => {
    if (user) {
      const offlineData = getOfflineData('affirmations', user.uid);
      const offlineAffirmations = offlineData.map(item => item.data.text).filter(Boolean);
      if (offlineAffirmations.length > 0) {
        setCards(prev => [...prev, ...offlineAffirmations]);
      }
    }
  }, [user, getOfflineData]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-purple-500 to-violet-500 text-white animate-pop">✨</div>
          <h1 className="text-2xl font-bold">Affirmations require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const next = () => setIndex((i) => (i + 1) % cards.length);
  const prev = () => setIndex((i) => (i - 1 + cards.length) % cards.length);
  
  const add = async () => {
    if (!text.trim() || !user) return;
    
    setSaving(true);
    try {
      const affirmationData = {
        text: text.trim(),
        timestamp: Date.now(),
        category: 'user-created'
      };
      
      // Save offline
      await saveOffline('affirmations', affirmationData, user.uid);
      
      setCards((c) => [...c, text.trim()]);
      setText('');
      
      if (isOfflineMode) {
        alert('Affirmation saved offline! It will sync when you\'re back online. ✨');
      }
    } catch (error) {
      console.error('Error saving affirmation:', error);
      alert('Failed to save affirmation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="min-h-screen p-6 md:p-10 text-center" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-violet-500">Affirmations</h1>
      
      {isOfflineMode && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg max-w-md mx-auto">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            📱 Working offline - your affirmations will sync when you're back online
          </p>
        </div>
      )}
      
      <div className="mt-8 max-w-md mx-auto p-6 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5">
        <div className="text-xl min-h-[3rem]">{cards[index]}</div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={prev} className="px-3 py-1.5 rounded-full border border-white/30 pressable">←</button>
          <button onClick={next} className="px-3 py-1.5 rounded-full border border-white/30 pressable">→</button>
        </div>
      </div>
      <div className="mt-6 max-w-md mx-auto flex items-center gap-2">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Add your own" 
          className="flex-1 px-3 py-2 rounded-md bg-white/80 dark:bg-white/10 border border-white/20" 
        />
        <button 
          onClick={add} 
          disabled={saving || !text.trim()}
          className="px-3 py-2 rounded-md bg-gradient-to-r from-purple-500 to-violet-500 text-white pressable disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
      </div>
      <div className="mt-6">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

