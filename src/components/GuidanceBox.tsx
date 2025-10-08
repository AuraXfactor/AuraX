"use client";
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GuidanceBoxProps {
  title: string;
  emoji: string;
  when: string;
  why: string;
  how: string;
  importance: string;
  preparation?: string;
  onProceed: () => void;
  onSkip?: () => void;
  colors: string;
}

export default function GuidanceBox({
  title,
  emoji,
  when,
  why,
  how,
  importance,
  preparation,
  onProceed,
  onSkip,
  colors
}: GuidanceBoxProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
      className="max-w-2xl w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20"
    >
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl bg-gradient-to-r ${colors} text-white mb-4`}>
          {emoji}
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Let's prepare you for the best experience with this wellness tool
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <span className="text-lg">⏰</span> When to Use
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">{when}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span> Why It Helps
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">{why}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
            <span className="text-lg">🎯</span> How to Use
          </h3>
          <p className="text-purple-700 dark:text-purple-300 text-sm">{how}</p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
            <span className="text-lg">⭐</span> Importance
          </h3>
          <p className="text-orange-700 dark:text-orange-300 text-sm">{importance}</p>
        </div>

        {preparation && (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2 flex items-center gap-2">
              <span className="text-lg">🔧</span> Preparation
            </h3>
            <p className="text-cyan-700 dark:text-cyan-300 text-sm">{preparation}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onProceed}
          className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors} text-white rounded-full hover:opacity-90 transition font-medium`}
        >
          Let's Begin ✨
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Skip Guide
          </button>
        )}
      </div>
    </motion.div>
  );
}