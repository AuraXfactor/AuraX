'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';

interface Goal {
  id?: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  createdAt: unknown;
}

interface DailyTask {
  task: string;
  completed: boolean;
}

export default function GoalAchievementJournal() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [isSettingNewGoal, setIsSettingNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  
  const [dailyProgress, setDailyProgress] = useState<DailyTask[]>([
    { task: '', completed: false },
    { task: '', completed: false },
    { task: '', completed: false }
  ]);
  const [obstaclesFaced, setObstaclesFaced] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [milestoneRecognition, setMilestoneRecognition] = useState('');
  const [tomorrowActions, setTomorrowActions] = useState(['', '', '']);
  const [motivationLevel, setMotivationLevel] = useState(5);
  const [motivationSource, setMotivationSource] = useState('');
  const [celebrationNote, setCelebrationNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(true);

  useEffect(() => {
    if (user) {
      loadCurrentGoal();
    }
  }, [user]);

  if (!user) {
    router.push('/login');
    return null;
  }

  const loadCurrentGoal = async () => {
    try {
      const goalDoc = await getDoc(doc(db, 'users', user.uid));
      if (goalDoc.exists()) {
        const data = goalDoc.data() as { currentGoal?: Goal };
        if (data.currentGoal) setCurrentGoal({ id: user.uid, ...data.currentGoal } as Goal);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    } finally {
      setLoadingGoal(false);
    }
  };

  const createNewGoal = async () => {
    if (!newGoalTitle.trim() || !newGoalDescription.trim() || !newGoalTargetDate) {
      alert('Please fill in all goal details');
      return;
    }

    try {
      const goalData = {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate,
        progress: 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), { currentGoal: goalData }, { merge: true });
      setCurrentGoal({ id: user.uid, ...goalData });
      setIsSettingNewGoal(false);
      setNewGoalTitle('');
      setNewGoalDescription('');
      setNewGoalTargetDate('');
      
      alert('New goal created successfully! 🎯');
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const updateDailyTask = (index: number, field: 'task' | 'completed', value: string | boolean) => {
    setDailyProgress(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const updateTomorrowAction = (index: number, value: string) => {
    setTomorrowActions(prev => prev.map((action, i) => i === index ? value : action));
  };

  const updateGoalProgress = async (newProgress: number) => {
    if (!currentGoal) return;

    try {
    await setDoc(doc(db, 'users', user.uid), { currentGoal: { ...currentGoal, progress: newProgress } }, { merge: true });
      
      setCurrentGoal(prev => prev ? { ...prev, progress: newProgress } : null);
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !currentGoal) return;
    
    // Validation
    const hasProgress = dailyProgress.some(task => task.task.trim());
    if (!hasProgress) {
      alert('Please add at least one daily progress item');
      return;
    }

    setSaving(true);
    try {
      const completedTasks = dailyProgress.filter(task => task.completed).length;
      const totalTasks = dailyProgress.filter(task => task.task.trim()).length;
      const dailyCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const entryData = {
        journalType: 'goal-achievement',
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        
        // Goal reference
        goalId: currentGoal.id,
        goalTitle: currentGoal.title,
        goalProgress: currentGoal.progress,
        
        // Daily progress data
        dailyProgress: dailyProgress.filter(task => task.task.trim()),
        dailyCompletionRate,
        obstaclesFaced: obstaclesFaced.trim() || null,
        lessonsLearned: lessonsLearned.trim() || null,
        milestoneRecognition: milestoneRecognition.trim() || null,
        tomorrowActions: tomorrowActions.filter(action => action.trim()),
        motivation: {
          level: motivationLevel,
          source: motivationSource.trim() || null
        },
        celebrationNote: celebrationNote.trim() || null,
        
        // Analytics
        wordCount: [
          obstaclesFaced,
          lessonsLearned,
          milestoneRecognition,
          motivationSource,
          celebrationNote,
          ...dailyProgress.map(t => t.task),
          ...tomorrowActions
        ].join(' ').split(' ').filter(w => w.length > 0).length,
        completionScore: calculateCompletionScore(),
        productivityScore: calculateProductivityScore(),
      };

      // Save to Firestore unified journals path
      await addDoc(collection(db, 'journals', user.uid, 'entries'), entryData);

      // Award points with goal progress bonus
      try {
        const progressBonus = Math.round(dailyCompletionRate / 10); // Up to 10 bonus points
        const motivationBonus = motivationLevel >= 8 ? 5 : 0; // Bonus for high motivation
        
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: entryData.wordCount,
            metadata: {
              journalType: 'goal-achievement',
              completionScore: entryData.completionScore,
              dailyCompletionRate,
              motivationLevel,
              progressBonus,
              motivationBonus
            }
          },
          description: `🎯 Goal progress tracked (+${progressBonus + motivationBonus} achievement bonus)`,
        });
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      alert('Goal progress saved successfully! 🎯');
      
      // Reset form but keep goal
      resetForm();
      
    } catch (error) {
      console.error('Error saving goal entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionScore = () => {
    let completed = 0;
    const total = 8;
    
    if (dailyProgress.some(task => task.task.trim())) completed++;
    if (obstaclesFaced.trim()) completed++;
    if (lessonsLearned.trim()) completed++;
    if (milestoneRecognition.trim()) completed++;
    if (tomorrowActions.some(action => action.trim())) completed++;
    if (motivationSource.trim()) completed++;
    if (celebrationNote.trim()) completed++;
    if (motivationLevel >= 5) completed++; // Bonus for maintaining motivation
    
    return Math.round((completed / total) * 100);
  };

  const calculateProductivityScore = () => {
    const completedTasks = dailyProgress.filter(task => task.completed).length;
    const totalTasks = dailyProgress.filter(task => task.task.trim()).length;
    
    if (totalTasks === 0) return 0;
    
    let score = (completedTasks / totalTasks) * 60; // Base score from task completion
    
    // Motivation boost
    score += (motivationLevel - 5) * 5; // Up to +25 for high motivation
    
    // Planning boost
    if (tomorrowActions.filter(action => action.trim()).length >= 2) score += 10;
    
    // Learning boost
    if (lessonsLearned.trim()) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const resetForm = () => {
    setDailyProgress([
      { task: '', completed: false },
      { task: '', completed: false },
      { task: '', completed: false }
    ]);
    setObstaclesFaced('');
    setLessonsLearned('');
    setMilestoneRecognition('');
    setTomorrowActions(['', '', '']);
    setMotivationLevel(5);
    setMotivationSource('');
    setCelebrationNote('');
  };

  const getMotivationColor = (level: number) => {
    if (level >= 8) return 'bg-green-500';
    if (level >= 6) return 'bg-yellow-500';
    if (level >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMotivationLabel = (level: number) => {
    if (level >= 9) return 'Unstoppable';
    if (level >= 7) return 'Highly Motivated';
    if (level >= 5) return 'Motivated';
    if (level >= 3) return 'Low Energy';
    return 'Struggling';
  };

  if (loadingGoal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold">🎯 Progress Tracker</h1>
              <p className="text-gray-600 dark:text-gray-400">Goal achievement & milestone celebration</p>
            </div>
          </div>
          
          {currentGoal && (
            <button
              onClick={handleSave}
              disabled={saving || !dailyProgress.some(task => task.task.trim())}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          )}
        </div>

        {/* Auto Date/Time Display */}
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
          <p className="text-green-800 dark:text-green-200 font-medium">
            📅 {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-green-600 dark:text-green-300 text-sm">
            🕐 {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        {/* Current Goal Display or Goal Setup */}
        {!currentGoal && !isSettingNewGoal ? (
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8 text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">🎯 Set Your Goal</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by setting a goal to track your progress and celebrate achievements!
            </p>
            <button
              onClick={() => setIsSettingNewGoal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-semibold"
            >
              Create New Goal 🚀
            </button>
          </section>
        ) : !currentGoal && isSettingNewGoal ? (
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">🚀 Create New Goal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Goal Description</label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="Describe your goal in detail. What does success look like?"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Date</label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsSettingNewGoal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={createNewGoal}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-semibold"
              >
                Create Goal 🎯
              </button>
            </div>
          </section>
        ) : currentGoal ? (
          <>
            {/* Current Goal Display */}
            <section className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">🎯 {currentGoal.title}</h2>
                  <p className="text-white/90 mb-4">{currentGoal.description}</p>
                  <p className="text-white/80 text-sm">
                    Target Date: {new Date(currentGoal.targetDate).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={() => setIsSettingNewGoal(true)}
                  className="px-3 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition text-sm"
                >
                  New Goal
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="text-xl font-bold">{currentGoal.progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-6">
                  <div 
                    className="bg-white h-6 rounded-full transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${currentGoal.progress}%` }}
                  >
                    {currentGoal.progress > 15 && (
                      <span className="text-green-600 font-bold text-sm">
                        {currentGoal.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => updateGoalProgress(Math.max(0, currentGoal.progress - 5))}
                  className="px-3 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition text-sm"
                >
                  -5%
                </button>
                <button
                  onClick={() => updateGoalProgress(Math.min(100, currentGoal.progress + 5))}
                  className="px-3 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition text-sm"
                >
                  +5%
                </button>
                <button
                  onClick={() => updateGoalProgress(Math.min(100, currentGoal.progress + 10))}
                  className="px-3 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition text-sm"
                >
                  +10%
                </button>
              </div>
            </section>

            <div className="space-y-8">
              {/* Daily Progress */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">📈 Daily Progress</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">What steps did I take toward my goal today?</p>
                
                <div className="space-y-3">
                  {dailyProgress.map((task, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => updateDailyTask(index, 'completed', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={task.task}
                        onChange={(e) => updateDailyTask(index, 'task', e.target.value)}
                        placeholder={`Task ${index + 1}...`}
                        className={`flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    ✅ Completed: {dailyProgress.filter(task => task.completed).length} / {dailyProgress.filter(task => task.task.trim()).length} tasks
                  </p>
                </div>
              </section>

              {/* Obstacles Faced */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">🚧 Obstacles Faced</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">What challenges came up?</p>
                <textarea
                  value={obstaclesFaced}
                  onChange={(e) => setObstaclesFaced(e.target.value)}
                  placeholder="Describe any challenges, setbacks, or obstacles you encountered today..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </section>

              {/* Lessons Learned */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">🎓 Lessons Learned</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">What did I discover today?</p>
                <textarea
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="Share insights, learnings, or discoveries from your goal pursuit today..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </section>

              {/* Milestone Recognition */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">🏆 Milestone Recognition</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">What progress am I proud of?</p>
                <textarea
                  value={milestoneRecognition}
                  onChange={(e) => setMilestoneRecognition(e.target.value)}
                  placeholder="Celebrate any progress, no matter how small. What achievements are you proud of today?"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </section>

              {/* Tomorrow's Action Plan */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">📋 Tomorrow&apos;s Action Plan</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Specific steps for tomorrow</p>
                
                <div className="space-y-3">
                  {tomorrowActions.map((action, index) => (
                    <input
                      key={index}
                      type="text"
                      value={action}
                      onChange={(e) => updateTomorrowAction(index, e.target.value)}
                      placeholder={`Action ${index + 1}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </section>

              {/* Motivation Level */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">🔥 Motivation Level</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">How motivated are you feeling?</p>
                
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">1 (Low)</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={motivationLevel}
                      onChange={(e) => setMotivationLevel(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">10 (High)</span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-6 h-6 rounded-full ${getMotivationColor(motivationLevel)}`}></div>
                    <span className="font-bold text-lg">{motivationLevel}</span>
                    <span className="text-gray-600">({getMotivationLabel(motivationLevel)})</span>
                  </div>
                </div>
                
                <input
                  type="text"
                  value={motivationSource}
                  onChange={(e) => setMotivationSource(e.target.value)}
                  placeholder="What's driving me? What keeps me motivated?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </section>

              {/* Celebration Note */}
              <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
                <h2 className="text-xl font-bold mb-4">🎉 Celebration Note</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">How will I acknowledge my effort?</p>
                <input
                  type="text"
                  value={celebrationNote}
                  onChange={(e) => setCelebrationNote(e.target.value)}
                  placeholder="How will you reward yourself for today's progress?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </section>

              {/* Progress Summary */}
              <section className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4">📊 Today&apos;s Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {dailyProgress.filter(task => task.completed).length}
                    </div>
                    <div className="text-sm opacity-80">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{motivationLevel}/10</div>
                    <div className="text-sm opacity-80">Motivation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{calculateProductivityScore()}</div>
                    <div className="text-sm opacity-80">Productivity Score</div>
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
                  <p className="font-medium">
                    🎯 Great work today! Every step forward brings you closer to achieving {currentGoal.title}!
                  </p>
                </div>
              </section>

              {/* Save Button */}
              <div className="text-center pb-20">
                <button
                  onClick={handleSave}
                  disabled={saving || !dailyProgress.some(task => task.task.trim())}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
                >
                  {saving ? 'Saving Progress...' : 'Complete Progress Check 🎯'}
                </button>
                
                {!dailyProgress.some(task => task.task.trim()) && (
                  <p className="text-sm text-gray-500 mt-2">Please add at least one daily progress item to save</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}