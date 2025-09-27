'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';

const RELATIONSHIP_TYPES = [
  { label: 'Partner/Spouse', value: 'partner', icon: '💕' },
  { label: 'Family Member', value: 'family', icon: '👨‍👩‍👧‍👦' },
  { label: 'Friend', value: 'friend', icon: '👫' },
  { label: 'Colleague', value: 'colleague', icon: '👔' },
  { label: 'Mentor', value: 'mentor', icon: '🎓' },
  { label: 'Child', value: 'child', icon: '👶' },
  { label: 'Parent', value: 'parent', icon: '👩‍👦' },
  { label: 'Other', value: 'other', icon: '🤝' }
];

const COMMUNICATION_STYLES = [
  { label: 'Active Listening', value: 'active_listening', color: 'bg-green-500' },
  { label: 'Open & Honest', value: 'open_honest', color: 'bg-blue-500' },
  { label: 'Supportive', value: 'supportive', color: 'bg-purple-500' },
  { label: 'Playful', value: 'playful', color: 'bg-yellow-500' },
  { label: 'Tense', value: 'tense', color: 'bg-orange-500' },
  { label: 'Distant', value: 'distant', color: 'bg-gray-500' },
  { label: 'Conflict', value: 'conflict', color: 'bg-red-500' }
];

function formatDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RelationshipJournal() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [personName, setPersonName] = useState('');
  const [interactionQuality, setInteractionQuality] = useState(3);
  const [interactionDescription, setInteractionDescription] = useState('');
  const [communicationStyles, setCommunicationStyles] = useState<string[]>([]);
  const [communicationDetails, setCommunicationDetails] = useState('');
  const [appreciationNote, setAppreciationNote] = useState('');
  const [growthOpportunity, setGrowthOpportunity] = useState('');
  const [conflictResolution, setConflictResolution] = useState('');
  const [futureIntentions, setFutureIntentions] = useState('');
  const [memoryKeeper, setMemoryKeeper] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const toggleCommunicationStyle = (style: string) => {
    setCommunicationStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!selectedRelationType || !personName.trim()) {
      alert('Please select a relationship type and enter the person&apos;s name');
      return;
    }

    setSaving(true);
    try {
      const entryData = {
        journalType: 'relationship',
        userId: user.uid,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        dateKey: formatDateKey(new Date()),
        
        // Core relationship data
        relationship: {
          type: selectedRelationType,
          personName: personName.trim(),
          interactionQuality,
          interactionDescription: interactionDescription.trim() || null
        },
        communication: {
          styles: communicationStyles,
          details: communicationDetails.trim() || null
        },
        appreciationNote: appreciationNote.trim() || null,
        growthOpportunity: growthOpportunity.trim() || null,
        conflictResolution: conflictResolution.trim() || null,
        futureIntentions: futureIntentions.trim() || null,
        memoryKeeper: memoryKeeper.trim() || null,
        
        // Analytics
        wordCount: [
          interactionDescription,
          communicationDetails, 
          appreciationNote,
          growthOpportunity,
          conflictResolution,
          futureIntentions,
          memoryKeeper
        ].join(' ').split(' ').filter(w => w.length > 0).length,
        completionScore: calculateCompletionScore(),
        relationshipHealth: calculateRelationshipHealth(),
      };

      // Save to Firestore
      await addDoc(collection(db, 'specialized-journals', user.uid, 'relationship'), entryData);

      // Award points with relationship bonus
      try {
        const relationshipBonus = Math.max(0, (interactionQuality - 3) * 2); // Bonus for positive interactions
        
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: entryData.wordCount,
            metadata: {
              journalType: 'relationship',
              completionScore: entryData.completionScore,
              relationshipHealth: entryData.relationshipHealth,
              interactionQuality,
              relationshipBonus
            }
          },
          description: `💕 Relationship reflection completed (+${relationshipBonus} connection bonus)`,
        });
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      alert('Relationship journal saved successfully! 💕');
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving relationship entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionScore = () => {
    let completed = 0;
    const total = 9;
    
    if (selectedRelationType && personName.trim()) completed++;
    if (interactionDescription.trim()) completed++;
    if (communicationStyles.length > 0) completed++;
    if (communicationDetails.trim()) completed++;
    if (appreciationNote.trim()) completed++;
    if (growthOpportunity.trim()) completed++;
    if (conflictResolution.trim()) completed++;
    if (futureIntentions.trim()) completed++;
    if (memoryKeeper.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const calculateRelationshipHealth = () => {
    let score = interactionQuality * 20; // Base from interaction quality (20-100)
    
    // Positive communication styles boost
    const positiveCommunication = communicationStyles.filter(style => 
      ['active_listening', 'open_honest', 'supportive', 'playful'].includes(style)
    ).length;
    score += positiveCommunication * 5;
    
    // Negative communication styles reduce
    const negativeCommunication = communicationStyles.filter(style => 
      ['tense', 'distant', 'conflict'].includes(style)
    ).length;
    score -= negativeCommunication * 10;
    
    // Content bonuses
    if (appreciationNote.trim()) score += 5;
    if (futureIntentions.trim()) score += 5;
    if (memoryKeeper.trim()) score += 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const resetForm = () => {
    setSelectedRelationType('');
    setPersonName('');
    setInteractionQuality(3);
    setInteractionDescription('');
    setCommunicationStyles([]);
    setCommunicationDetails('');
    setAppreciationNote('');
    setGrowthOpportunity('');
    setConflictResolution('');
    setFutureIntentions('');
    setMemoryKeeper('');
  };

  const getQualityColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (rating: number) => {
    const labels = ['Poor', 'Difficult', 'Neutral', 'Good', 'Excellent'];
    return labels[rating - 1] || 'Neutral';
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
              <h1 className="text-3xl font-bold">💕 Connection Matters</h1>
              <p className="text-gray-600 dark:text-gray-400">Relationship tracking & improvement</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || !selectedRelationType || !personName.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-semibold"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Auto Date/Time Display */}
        <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
          <p className="text-purple-800 dark:text-purple-200 font-medium">
            📅 {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-purple-600 dark:text-purple-300 text-sm">
            🕐 {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Relationship Selection */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">👥 Relationship Selection</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Who are you reflecting on today?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {RELATIONSHIP_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedRelationType(type.value)}
                  className={`p-3 rounded-xl border-2 transition ${
                    selectedRelationType === type.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
            
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Person's name or initials..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </section>

          {/* Interaction Quality */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">⭐ Interaction Quality</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">How would you rate your interactions today?</p>
            
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-gray-500">1 (Poor)</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interactionQuality}
                  onChange={(e) => setInteractionQuality(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">5 (Excellent)</span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= interactionQuality ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className={`font-bold text-lg ${getQualityColor(interactionQuality)}`}>
                  {getQualityLabel(interactionQuality)}
                </span>
              </div>
            </div>
            
            <textarea
              value={interactionDescription}
              onChange={(e) => setInteractionDescription(e.target.value)}
              placeholder="What interaction stood out today? Describe what happened..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={3}
            />
          </section>

          {/* Communication Check */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💬 Communication Check</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">How was your communication today?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {COMMUNICATION_STYLES.map(style => (
                <label
                  key={style.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    communicationStyles.includes(style.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={communicationStyles.includes(style.value)}
                    onChange={() => toggleCommunicationStyle(style.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className={`w-3 h-3 rounded-full ${style.color}`}></div>
                  <span className="text-sm font-medium">{style.label}</span>
                </label>
              ))}
            </div>
            
            <textarea
              value={communicationDetails}
              onChange={(e) => setCommunicationDetails(e.target.value)}
              placeholder="Describe the quality of your communication. What went well? What could be improved?"
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </section>

          {/* Appreciation Note */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💖 Appreciation Note</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What I appreciated about them today</p>
            <textarea
              value={appreciationNote}
              onChange={(e) => setAppreciationNote(e.target.value)}
              placeholder="Express gratitude for something this person did, said, or simply for who they are..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Growth Opportunity */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🌱 Growth Opportunity</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What could be improved in our connection?</p>
            <textarea
              value={growthOpportunity}
              onChange={(e) => setGrowthOpportunity(e.target.value)}
              placeholder="Reflect on areas where the relationship could grow. Be constructive and focus on actionable insights..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Conflict Resolution */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🤝 Conflict Resolution</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Any tensions? How were they resolved?</p>
            <textarea
              value={conflictResolution}
              onChange={(e) => setConflictResolution(e.target.value)}
              placeholder="If there were any disagreements or tensions, describe how they were handled or how they could be resolved..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Future Intentions */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🎯 Future Intentions</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">How will I nurture this relationship tomorrow?</p>
            <input
              type="text"
              value={futureIntentions}
              onChange={(e) => setFutureIntentions(e.target.value)}
              placeholder="What specific action will you take to strengthen this relationship?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </section>

          {/* Memory Keeper */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">📸 Memory Keeper</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">A special moment to remember</p>
            <textarea
              value={memoryKeeper}
              onChange={(e) => setMemoryKeeper(e.target.value)}
              placeholder="Capture a beautiful, funny, meaningful, or touching moment from your interaction today..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Relationship Health Summary */}
          <section className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">💕 Relationship Health</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{interactionQuality}/5</div>
                <div className="text-sm opacity-80">Interaction Quality</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{calculateRelationshipHealth()}</div>
                <div className="text-sm opacity-80">Health Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{calculateCompletionScore()}%</div>
                <div className="text-sm opacity-80">Complete</div>
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
            </div>
            
            {personName.trim() && (
              <div className="bg-white/10 rounded-xl p-3">
                <p className="font-medium">
                  💝 Thank you for taking time to reflect on your relationship with {personName}. 
                  Conscious connection creates deeper bonds!
                </p>
              </div>
            )}
          </section>

          {/* Save Button */}
          <div className="text-center pb-20">
            <button
              onClick={handleSave}
              disabled={saving || !selectedRelationType || !personName.trim()}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
            >
              {saving ? 'Saving Relationship Reflection...' : 'Complete Connection Check 💕'}
            </button>
            
            {(!selectedRelationType || !personName.trim()) && (
              <p className="text-sm text-gray-500 mt-2">Please select a relationship type and enter a name to save</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}