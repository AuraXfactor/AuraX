'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';
import SpecializedJournalHistory from '@/components/journal/SpecializedJournalHistory';
import AuraAIChat from '@/components/aura-ai/AuraAIChat';

const EMOTIONS = [
  { label: 'Angry', value: 'angry', color: 'bg-red-500' },
  { label: 'Sad', value: 'sad', color: 'bg-blue-500' },
  { label: 'Anxious', value: 'anxious', color: 'bg-yellow-500' },
  { label: 'Happy', value: 'happy', color: 'bg-green-500' },
  { label: 'Frustrated', value: 'frustrated', color: 'bg-orange-500' },
  { label: 'Overwhelmed', value: 'overwhelmed', color: 'bg-purple-500' },
  { label: 'Disappointed', value: 'disappointed', color: 'bg-gray-500' },
  { label: 'Excited', value: 'excited', color: 'bg-pink-500' },
];

export default function CBTTherapyJournal() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [situation, setSituation] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [automaticThoughts, setAutomaticThoughts] = useState('');
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [reRatedIntensity, setReRatedIntensity] = useState(5);
  const [actionStep, setActionStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!situation.trim()) {
      alert('Please describe the situation that triggered these thoughts');
      return;
    }
    
    if (!selectedEmotion) {
      alert('Please select the main emotion you experienced');
      return;
    }

    setSaving(true);
    try {
      const entryData = {
        journalType: 'cbt-therapy',
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        
        // Core CBT data
        situation: situation.trim(),
        emotion: {
          type: selectedEmotion,
          initialIntensity: emotionIntensity,
          finalIntensity: reRatedIntensity,
          improvement: emotionIntensity - reRatedIntensity
        },
        automaticThoughts: automaticThoughts.trim() || null,
        evidenceFor: evidenceFor.trim() || null,
        evidenceAgainst: evidenceAgainst.trim() || null,
        balancedThought: balancedThought.trim() || null,
        actionStep: actionStep.trim() || null,
        
        // Analytics
        wordCount: [situation, automaticThoughts, evidenceFor, evidenceAgainst, balancedThought, actionStep]
          .join(' ').split(' ').filter(w => w.length > 0).length,
        completionScore: calculateCompletionScore(),
        cognitiveProgress: emotionIntensity - reRatedIntensity, // How much did CBT help?
      };

      // Save to Firestore
      await addDoc(collection(db, 'specialized-journals', user.uid, 'cbt-therapy'), entryData);

      // Award points based on progress and completion
      try {
        const progressBonus = Math.max(0, entryData.cognitiveProgress * 2); // Bonus for emotional improvement
        
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: entryData.wordCount,
            metadata: {
              journalType: 'cbt-therapy',
              completionScore: entryData.completionScore,
              emotionalImprovement: entryData.cognitiveProgress,
              progressBonus
            }
          },
          description: `🧠 CBT Thought Reframe completed (+${progressBonus} progress bonus)`,
          uniqueId: `cbt-journal-${user.uid}-${new Date().toISOString().split('T')[0]}`
        });
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      alert('CBT Thought Reframe saved successfully! 🧠✨');
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving CBT entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionScore = () => {
    let completed = 0;
    const total = 7;
    
    if (situation.trim()) completed++;
    if (selectedEmotion) completed++;
    if (automaticThoughts.trim()) completed++;
    if (evidenceFor.trim()) completed++;
    if (evidenceAgainst.trim()) completed++;
    if (balancedThought.trim()) completed++;
    if (actionStep.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const resetForm = () => {
    setSituation('');
    setSelectedEmotion('');
    setEmotionIntensity(5);
    setAutomaticThoughts('');
    setEvidenceFor('');
    setEvidenceAgainst('');
    setBalancedThought('');
    setReRatedIntensity(5);
    setActionStep('');
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return 'bg-green-500';
    if (intensity <= 4) return 'bg-yellow-500';
    if (intensity <= 6) return 'bg-orange-500';
    if (intensity <= 8) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 2) return 'Mild';
    if (intensity <= 4) return 'Low';
    if (intensity <= 6) return 'Moderate';
    if (intensity <= 8) return 'High';
    return 'Very High';
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/journals"
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold">🧠 Thought Reframe</h1>
              <p className="text-gray-600 dark:text-gray-400">CBT-based thought restructuring</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowAIChat(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition font-semibold"
            >
              ✨ Chat with Aura AI
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !situation.trim() || !selectedEmotion}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>

        {/* Auto Date/Time Display */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            📅 {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-blue-600 dark:text-blue-300 text-sm">
            🕐 {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Situation Description */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">📋 Situation Description</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Briefly describe the triggering situation</p>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="What happened? Be specific but concise. Focus on facts, not interpretations..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Emotion Rating */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">😢 Emotion Rating</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What emotion did you experience and how intense was it?</p>
            
            {/* Emotion Selection */}
            <div className="mb-6">
              <p className="font-medium mb-3">Select the main emotion:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EMOTIONS.map(emotion => (
                  <button
                    key={emotion.value}
                    onClick={() => setSelectedEmotion(emotion.value)}
                    className={`p-3 rounded-xl border-2 transition ${
                      selectedEmotion === emotion.value
                        ? `border-blue-500 ${emotion.color} text-white`
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span className="font-medium">{emotion.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Scale */}
            <div>
              <p className="font-medium mb-3">Intensity Level (1-10):</p>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-gray-500">1 (Mild)</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={emotionIntensity}
                  onChange={(e) => setEmotionIntensity(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">10 (Extreme)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${getIntensityColor(emotionIntensity)}`}></div>
                <span className="font-bold text-lg">{emotionIntensity}</span>
                <span className="text-gray-600">({getIntensityLabel(emotionIntensity)})</span>
              </div>
            </div>
          </section>

          {/* Automatic Thoughts */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💭 Automatic Thoughts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What thoughts went through your mind?</p>
            <textarea
              value={automaticThoughts}
              onChange={(e) => setAutomaticThoughts(e.target.value)}
              placeholder="Write down the immediate thoughts that came to mind. Don't filter them - just capture what your mind was saying..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Evidence For */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">✅ Evidence Supporting These Thoughts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What evidence supports these thoughts being true?</p>
            <textarea
              value={evidenceFor}
              onChange={(e) => setEvidenceFor(e.target.value)}
              placeholder="List concrete facts and evidence that support your thoughts. Be objective and specific..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Evidence Against */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">❌ Evidence Challenging These Thoughts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What evidence suggests these thoughts might not be completely accurate?</p>
            <textarea
              value={evidenceAgainst}
              onChange={(e) => setEvidenceAgainst(e.target.value)}
              placeholder="Look for evidence that contradicts or challenges your thoughts. Consider alternative explanations..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Balanced Thought */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">⚖️ Balanced Perspective</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">A more balanced perspective would be...</p>
            <textarea
              value={balancedThought}
              onChange={(e) => setBalancedThought(e.target.value)}
              placeholder="Considering all the evidence, write a more balanced, realistic thought. This should be fair, accurate, and helpful..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Re-rate Emotion */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">📊 Re-rate Your Emotion</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">How intense is the emotion now after this exercise?</p>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-500">1 (Mild)</span>
              <input
                type="range"
                min="1"
                max="10"
                value={reRatedIntensity}
                onChange={(e) => setReRatedIntensity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">10 (Extreme)</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${getIntensityColor(reRatedIntensity)}`}></div>
                <span className="font-bold text-lg">{reRatedIntensity}</span>
                <span className="text-gray-600">({getIntensityLabel(reRatedIntensity)})</span>
              </div>
              
              {emotionIntensity !== reRatedIntensity && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  reRatedIntensity < emotionIntensity 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {reRatedIntensity < emotionIntensity 
                    ? `↓ ${emotionIntensity - reRatedIntensity} point improvement!` 
                    : `↑ ${reRatedIntensity - emotionIntensity} point increase`
                  }
                </div>
              )}
            </div>
          </section>

          {/* Action Step */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Action Step</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What helpful action can I take?</p>
            <input
              type="text"
              value={actionStep}
              onChange={(e) => setActionStep(e.target.value)}
              placeholder="What specific, concrete action will you take based on your new perspective?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </section>

          {/* Progress Summary */}
          <section className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">📈 CBT Progress Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{emotionIntensity}</div>
                <div className="text-sm opacity-80">Initial Intensity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">→</div>
                <div className="text-sm opacity-80">After CBT</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{reRatedIntensity}</div>
                <div className="text-sm opacity-80">Final Intensity</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="w-full bg-white/20 rounded-full h-4">
                  <div 
                    className="bg-white h-4 rounded-full transition-all duration-500"
                    style={{ width: `${calculateCompletionScore()}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-xl font-bold">{calculateCompletionScore()}% Complete</span>
            </div>
            
            {emotionIntensity > reRatedIntensity && (
              <div className="bg-white/10 rounded-xl p-3">
                <p className="font-medium">🎉 Great work! You reduced your emotional intensity by {emotionIntensity - reRatedIntensity} points through CBT!</p>
              </div>
            )}
          </section>

          {/* Save Button */}
          <div className="text-center">
            <button
              onClick={handleSave}
              disabled={saving || !situation.trim() || !selectedEmotion}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
            >
              {saving ? 'Saving Thought Reframe...' : 'Complete CBT Session 🧠'}
            </button>
            
            {(!situation.trim() || !selectedEmotion) && (
              <p className="text-sm text-gray-500 mt-2">Please describe the situation and select an emotion to save</p>
            )}
          </div>
        </div>

        {/* Journal History */}
        <SpecializedJournalHistory
          journalType="cbt-therapy"
          title="Thought Reframe"
          icon="🧠"
          renderEntry={(entry) => (
            <div className="space-y-3">
              {entry.situation && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">🎯 Situation</div>
                  <div className="text-blue-700 dark:text-blue-300">{entry.situation}</div>
                </div>
              )}
              
              {entry.emotion && (
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${EMOTIONS.find(e => e.value === entry.emotion.type)?.color || 'bg-gray-500'}`}></div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {EMOTIONS.find(e => e.value === entry.emotion.type)?.label || 'Unknown Emotion'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      (Intensity: {entry.emotion.intensity}/10)
                    </span>
                  </div>
                </div>
              )}
              
              {entry.negativeThoughts && entry.negativeThoughts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">🤔 Thoughts</div>
                  {entry.negativeThoughts.map((thought: string, index: number) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-300">
                      {thought}
                    </div>
                  ))}
                </div>
              )}
              
              {entry.reframedThoughts && entry.reframedThoughts.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">💡 Reframed Thoughts</div>
                  {entry.reframedThoughts.map((thought: string, index: number) => (
                    <div key={index} className="text-green-700 dark:text-green-300 text-sm mb-1">
                      • {thought}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <AuraAIChat
              onClose={() => setShowAIChat(false)}
              context="journal"
              initialMessage="I'm working on my CBT therapy journal. Can you help me process my thoughts and emotions?"
            />
          </div>
        </div>
      )}
    </div>
  );
}