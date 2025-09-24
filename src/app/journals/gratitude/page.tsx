'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';

const ABUNDANCE_CATEGORIES = ['Physical', 'Emotional', 'Relational'];

const GRATITUDE_AFFIRMATIONS = [
  "I am grateful for all the abundance flowing into my life",
  "Every day brings new reasons to be thankful",
  "I attract positivity by focusing on gratitude",
  "My heart is full of appreciation for life's blessings",
  "Gratitude transforms my perspective and opens my heart",
  "I choose to see the good in every situation",
  "Thankfulness is my pathway to joy and peace",
  "I am blessed beyond measure in countless ways"
];

export default function GratitudeJournal() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [dailyHighlight, setDailyHighlight] = useState('');
  const [gratitudeEntries, setGratitudeEntries] = useState([
    { item: '', why: '' },
    { item: '', why: '' },
    { item: '', why: '' }
  ]);
  const [personAppreciation, setPersonAppreciation] = useState('');
  const [smallJoy, setSmallJoy] = useState('');
  const [abundanceReflections, setAbundanceReflections] = useState({
    Physical: '',
    Emotional: '',
    Relational: ''
  });
  const [lookingForward, setLookingForward] = useState('');
  const [selectedAffirmation, setSelectedAffirmation] = useState('');
  const [customAffirmation, setCustomAffirmation] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const updateGratitudeEntry = (index: number, field: 'item' | 'why', value: string) => {
    setGratitudeEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const updateAbundanceReflection = (category: string, value: string) => {
    setAbundanceReflections(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    const hasGratitudeItems = gratitudeEntries.some(entry => entry.item.trim());
    if (!dailyHighlight.trim() && !hasGratitudeItems) {
      alert('Please share at least your daily highlight or one gratitude item');
      return;
    }

    setSaving(true);
    try {
      const entryData = {
        journalType: 'gratitude',
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        
        // Core gratitude data
        dailyHighlight: dailyHighlight.trim() || null,
        gratitudeItems: gratitudeEntries
          .filter(entry => entry.item.trim())
          .map(entry => ({
            item: entry.item.trim(),
            why: entry.why.trim() || null
          })),
        personAppreciation: personAppreciation.trim() || null,
        smallJoy: smallJoy.trim() || null,
        abundanceReflections: Object.entries(abundanceReflections)
          .filter(([, value]) => value.trim())
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value.trim() }), {} as Record<string, string>),
        lookingForward: lookingForward.trim() || null,
        affirmation: {
          selected: selectedAffirmation || null,
          custom: customAffirmation.trim() || null
        },
        
        // Analytics
        wordCount: [
          dailyHighlight,
          ...gratitudeEntries.map(e => `${e.item} ${e.why}`),
          personAppreciation,
          smallJoy,
          ...Object.values(abundanceReflections),
          lookingForward,
          customAffirmation
        ].join(' ').split(' ').filter(w => w.length > 0).length,
        completionScore: calculateCompletionScore(),
        gratitudeCount: gratitudeEntries.filter(entry => entry.item.trim()).length,
        abundanceAreasCount: Object.values(abundanceReflections).filter(v => v.trim()).length,
      };

      // Save to Firestore
      await addDoc(collection(db, 'specialized-journals', user.uid, 'gratitude'), entryData);

      // Award points with gratitude bonus
      try {
        const gratitudeBonus = entryData.gratitudeCount * 3; // Bonus for each gratitude item
        
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: entryData.wordCount,
            metadata: {
              journalType: 'gratitude',
              completionScore: entryData.completionScore,
              gratitudeCount: entryData.gratitudeCount,
              abundanceAreasCount: entryData.abundanceAreasCount,
              gratitudeBonus
            }
          },
          description: `🙏 Gratitude practice completed (+${gratitudeBonus} gratitude bonus)`,
        });
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      alert('Gratitude journal saved successfully! 🙏✨');
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving gratitude entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionScore = () => {
    let completed = 0;
    const total = 8;
    
    if (dailyHighlight.trim()) completed++;
    if (gratitudeEntries.some(entry => entry.item.trim())) completed++;
    if (gratitudeEntries.filter(entry => entry.item.trim()).length >= 3) completed++; // Bonus for completing all 3
    if (personAppreciation.trim()) completed++;
    if (smallJoy.trim()) completed++;
    if (Object.values(abundanceReflections).some(v => v.trim())) completed++;
    if (lookingForward.trim()) completed++;
    if (selectedAffirmation || customAffirmation.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const resetForm = () => {
    setDailyHighlight('');
    setGratitudeEntries([
      { item: '', why: '' },
      { item: '', why: '' },
      { item: '', why: '' }
    ]);
    setPersonAppreciation('');
    setSmallJoy('');
    setAbundanceReflections({ Physical: '', Emotional: '', Relational: '' });
    setLookingForward('');
    setSelectedAffirmation('');
    setCustomAffirmation('');
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
              <h1 className="text-3xl font-bold">🙏 Thankful Heart</h1>
              <p className="text-gray-600 dark:text-gray-400">Gratitude & abundance cultivation</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition disabled:opacity-50 font-semibold"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Auto Date/Time Display */}
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            📅 {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-yellow-600 dark:text-yellow-300 text-sm">
            🕐 {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Daily Highlight */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">✨ Daily Highlight</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What was the best part of today?</p>
            <textarea
              value={dailyHighlight}
              onChange={(e) => setDailyHighlight(e.target.value)}
              placeholder="Describe the moment, experience, or feeling that stood out as the highlight of your day..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Gratitude Deep Dive */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💝 Gratitude Deep Dive</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">I&apos;m deeply grateful for... (and why)</p>
            
            <div className="space-y-6">
              {gratitudeEntries.map((entry, index) => (
                <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      {index + 1}. I&apos;m grateful for:
                    </label>
                    <input
                      type="text"
                      value={entry.item}
                      onChange={(e) => updateGratitudeEntry(index, 'item', e.target.value)}
                      placeholder={`Gratitude item ${index + 1}...`}
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Why this matters to me:
                    </label>
                    <textarea
                      value={entry.why}
                      onChange={(e) => updateGratitudeEntry(index, 'why', e.target.value)}
                      placeholder="Explain why this is meaningful to you..."
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Person Appreciation */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">👥 Person Appreciation</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Who made a difference today and how?</p>
            <textarea
              value={personAppreciation}
              onChange={(e) => setPersonAppreciation(e.target.value)}
              placeholder="Think about someone who positively impacted your day. What did they do? How did it make you feel?"
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Small Joy Recognition */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">😊 Small Joy Recognition</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What small moment brought me joy?</p>
            <textarea
              value={smallJoy}
              onChange={(e) => setSmallJoy(e.target.value)}
              placeholder="Sometimes the smallest moments create the biggest smiles. What tiny thing made you happy today?"
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
            />
          </section>

          {/* Abundance Reflection */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🌈 Abundance Reflection</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">What abundance did I notice today?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ABUNDANCE_CATEGORIES.map(category => (
                <div key={category} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-3">
                    {category === 'Physical' && '💪'} 
                    {category === 'Emotional' && '❤️'} 
                    {category === 'Relational' && '🤝'} 
                    {category} Abundance
                  </h3>
                  <textarea
                    value={abundanceReflections[category as keyof typeof abundanceReflections]}
                    onChange={(e) => updateAbundanceReflection(category, e.target.value)}
                    placeholder={
                      category === 'Physical' ? 'Health, resources, environment...' :
                      category === 'Emotional' ? 'Peace, joy, love, security...' :
                      'Connections, support, community...'
                    }
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Looking Forward */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🌅 Looking Forward</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What am I excited about tomorrow?</p>
            <textarea
              value={lookingForward}
              onChange={(e) => setLookingForward(e.target.value)}
              placeholder="Share what you're looking forward to, anticipating, or excited about in the near future..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </section>

          {/* Gratitude Affirmation */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">✨ Gratitude Affirmation</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Choose an affirmation that resonates with you today</p>
            
            <div className="space-y-3 mb-6">
              {GRATITUDE_AFFIRMATIONS.map((affirmation, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedAffirmation === affirmation
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="affirmation"
                    checked={selectedAffirmation === affirmation}
                    onChange={() => setSelectedAffirmation(affirmation)}
                    className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium">{affirmation}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Or write your own affirmation:</label>
              <textarea
                value={customAffirmation}
                onChange={(e) => setCustomAffirmation(e.target.value)}
                placeholder="Create your own personal gratitude affirmation..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </section>

          {/* Gratitude Summary */}
          <section className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">🌟 Gratitude Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{gratitudeEntries.filter(e => e.item.trim()).length}</div>
                <div className="text-sm opacity-80">Gratitude Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Object.values(abundanceReflections).filter(v => v.trim()).length}</div>
                <div className="text-sm opacity-80">Abundance Areas</div>
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
            
            <div className="bg-white/10 rounded-xl p-3">
              <p className="font-medium">🙏 &ldquo;Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.&rdquo;</p>
            </div>
          </section>

          {/* Save Button */}
          <div className="text-center pb-20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl hover:from-yellow-600 hover:to-orange-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
            >
              {saving ? 'Saving Gratitude Practice...' : 'Complete Gratitude Practice 🙏'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}