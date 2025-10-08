/**
 * WELLNESS TOOL INTEGRATION GUIDE
 * 
 * This file provides the integration patterns for adding session tracking
 * to all wellness tools. Each tool should follow this pattern for
 * consistent research data collection.
 * 
 * INTEGRATION STEPS:
 * 1. Import WellnessSessionTracker component
 * 2. Wrap tool content with session tracker
 * 3. Configure tool-specific settings
 * 4. Test session tracking functionality
 */

import React from 'react';
import WellnessSessionTracker from '@/components/WellnessSessionTracker';

// Tool type constants for research categorization
export const WELLNESS_TOOL_TYPES = {
  BREATHING: 'breathing_exercises',
  GROUNDING: 'grounding_techniques', 
  MEDITATION: 'guided_meditations',
  PANIC_BUTTON: 'panic_button',
  VISUALIZATION: 'visualization_exercises',
  BODY_SCAN: 'body_scan',
  WORKOUTS: 'mini_workouts',
  SLEEP_TOOLS: 'sleep_tools',
  MOOD_PLAYLISTS: 'mood_playlists',
  AFFIRMATIONS: 'affirmations',
} as const;

// Integration template for wellness tools
export const createWellnessToolWithTracking = (
  toolType: string,
  children: React.ReactNode,
  onSessionStart?: () => void,
  onSessionEnd?: () => void
) => {
  return (
    <WellnessSessionTracker 
      toolType={toolType}
      onSessionStart={onSessionStart}
      onSessionEnd={onSessionEnd}
    >
      {children}
    </WellnessSessionTracker>
  );
};

// Example integration for each tool type
export const INTEGRATION_EXAMPLES = {
  // Breathing Exercises
  breathing: {
    toolType: WELLNESS_TOOL_TYPES.BREATHING,
    onSessionStart: () => console.log('Breathing session started'),
    onSessionEnd: () => console.log('Breathing session completed'),
  },
  
  // Grounding Techniques
  grounding: {
    toolType: WELLNESS_TOOL_TYPES.GROUNDING,
    onSessionStart: () => console.log('Grounding session started'),
    onSessionEnd: () => console.log('Grounding session completed'),
  },
  
  // Guided Meditations
  meditation: {
    toolType: WELLNESS_TOOL_TYPES.MEDITATION,
    onSessionStart: () => console.log('Meditation session started'),
    onSessionEnd: () => console.log('Meditation session completed'),
  },
  
  // Panic Button
  panic: {
    toolType: WELLNESS_TOOL_TYPES.PANIC_BUTTON,
    onSessionStart: () => console.log('Panic intervention started'),
    onSessionEnd: () => console.log('Panic intervention completed'),
  },
  
  // Visualization Exercises
  visualization: {
    toolType: WELLNESS_TOOL_TYPES.VISUALIZATION,
    onSessionStart: () => console.log('Visualization session started'),
    onSessionEnd: () => console.log('Visualization session completed'),
  },
  
  // Body Scan
  bodyScan: {
    toolType: WELLNESS_TOOL_TYPES.BODY_SCAN,
    onSessionStart: () => console.log('Body scan session started'),
    onSessionEnd: () => console.log('Body scan session completed'),
  },
  
  // Mini Workouts
  workouts: {
    toolType: WELLNESS_TOOL_TYPES.WORKOUTS,
    onSessionStart: () => console.log('Workout session started'),
    onSessionEnd: () => console.log('Workout session completed'),
  },
  
  // Sleep Tools
  sleep: {
    toolType: WELLNESS_TOOL_TYPES.SLEEP_TOOLS,
    onSessionStart: () => console.log('Sleep tool session started'),
    onSessionEnd: () => console.log('Sleep tool session completed'),
  },
  
  // Mood Playlists
  playlists: {
    toolType: WELLNESS_TOOL_TYPES.MOOD_PLAYLISTS,
    onSessionStart: () => console.log('Mood playlist session started'),
    onSessionEnd: () => console.log('Mood playlist session completed'),
  },
  
  // Affirmations
  affirmations: {
    toolType: WELLNESS_TOOL_TYPES.AFFIRMATIONS,
    onSessionStart: () => console.log('Affirmation session started'),
    onSessionEnd: () => console.log('Affirmation session completed'),
  },
};

/**
 * Quick integration helper for updating existing tools
 * 
 * USAGE:
 * 1. Import this function in your wellness tool
 * 2. Wrap your existing content with the returned component
 * 3. Configure the tool type and callbacks
 */
export const integrateSessionTracking = (
  toolType: string,
  existingContent: React.ReactNode,
  callbacks?: {
    onSessionStart?: () => void;
    onSessionEnd?: () => void;
  }
) => {
  return (
    <WellnessSessionTracker 
      toolType={toolType}
      onSessionStart={callbacks?.onSessionStart}
      onSessionEnd={callbacks?.onSessionEnd}
    >
      {existingContent}
    </WellnessSessionTracker>
  );
};