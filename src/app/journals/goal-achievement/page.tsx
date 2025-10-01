'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';
import SpecializedJournalHistory from '@/components/journal/SpecializedJournalHistory';
import AutoAIInsights from '@/components/journal/AutoAIInsights';

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
  const [showAutoAI, setShowAutoAI] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<any>(null);
  const [loadingGoal, setLoadingGoal] = useState(true);

  useEffect(() => {
    if (user) {
      loadCurrentGoal();
    }
  }, [user]);

  const loadCurrentGoal = async () => {
    if (!user) return;
    
    try {
      setLoadingGoal(true);
      const goalRef = doc(db, 'users', user.uid, 'goals', 'current');
      const goalDoc = await getDoc(goalRef);
      
      if (goalDoc.exists()) {
        const goalData = goalDoc.data() as Goal;
        setCurrentGoal({
          ...goalData,
          id: goalDoc.id
        });
      }
    } catch (error) {
      console.error('Error loading current goal:', error);
    } finally {
      setLoadingGoal(false);
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

      // Save to Firestore
      await addDoc(collection(db, 'specialized-journals', user.uid, 'goal-achievement'), entryData);

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
      
      // Trigger auto AI insights
      setLastSavedEntry(entryData);
      setShowAutoAI(true);
      
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
    if (motivationLevel > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const calculateProductivityScore = () => {
    const completedTasks = dailyProgress.filter(task => task.completed).length;
    const totalTasks = dailyProgress.filter(task => task.task.trim()).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return Math.round((taskCompletionRate + motivationLevel * 10) / 2);
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

  const addDailyTask = () => {
    setDailyProgress([...dailyProgress, { task: '', completed: false }]);
  };

  const removeDailyTask = (index: number) => {
    setDailyProgress(dailyProgress.filter((_, i) => i !== index));
  };

  const updateDailyTask = (index: number, field: 'task' | 'completed', value: string | boolean) => {
    const updated = [...dailyProgress];
    updated[index] = { ...updated[index], [field]: value };
    setDailyProgress(updated);
  };

  const addTomorrowAction = () => {
    setTomorrowActions([...tomorrowActions, '']);
  };

  const removeTomorrowAction = (index: number) => {
    setTomorrowActions(tomorrowActions.filter((_, i) => i !== index));
  };

  const updateTomorrowAction = (index: number, value: string) => {
    const updated = [...tomorrowActions];
    updated[index] = value;
    setTomorrowActions(updated);
  };

  const createNewGoal = async () => {
    if (!user || !newGoalTitle.trim()) return;
    
    try {
      const goalData = {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate,
        progress: 0,
        createdAt: serverTimestamp()
      };
      
      const goalRef = doc(db, 'users', user.uid, 'goals', 'current');
      await setDoc(goalRef, goalData);
      
      setCurrentGoal({
        id: 'current',
        ...goalData
      });
      
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

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loadingGoal) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading goal...</p>
        </div>
      </div>
    );
  }

  if (!currentGoal) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            🎯 Goal Achievement Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your daily progress toward your goals and celebrate your achievements
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Set Your Goal</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">Goal Title *</label>
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g., Learn Spanish, Run a Marathon, Start a Business"
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2">Description</label>
              <textarea
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                placeholder="Describe your goal in detail..."
                rows={4}
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2">Target Date</label>
              <input
                type="date"
                value={newGoalTargetDate}
                onChange={(e) => setNewGoalTargetDate(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={createNewGoal}
              disabled={!newGoalTitle.trim()}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
            >
              Create Goal 🎯
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          🎯 Goal Achievement Journal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your daily progress toward: <strong>{currentGoal.title}</strong>
        </p>
      </div>

      {/* Current Goal Overview */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Current Goal</h2>
          <button
            onClick={() => setIsSettingNewGoal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            Change Goal
          </button>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentGoal.title}
          </h3>
          {currentGoal.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {currentGoal.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Target: {currentGoal.targetDate}</span>
            <span>Progress: {currentGoal.progress}%</span>
          </div>
        </div>
      </div>

      {/* Daily Progress Form */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Today's Progress</h2>
        
        <div className="space-y-8">
          {/* Daily Tasks */}
          <div>
            <label className="block text-lg font-semibold mb-4">Daily Tasks</label>
            <div className="space-y-3">
              {dailyProgress.map((task, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => updateDailyTask(index, 'completed', e.target.checked)}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <input
                    type="text"
                    value={task.task}
                    onChange={(e) => updateDailyTask(index, 'task', e.target.value)}
                    placeholder={`Task ${index + 1}`}
                    className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  {dailyProgress.length > 1 && (
                    <button
                      onClick={() => removeDailyTask(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addDailyTask}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition text-gray-600 dark:text-gray-400"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Obstacles Faced */}
          <div>
            <label className="block text-lg font-semibold mb-2">Obstacles Faced Today</label>
            <textarea
              value={obstaclesFaced}
              onChange={(e) => setObstaclesFaced(e.target.value)}
              placeholder="What challenges did you encounter? How did you handle them?"
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-lg font-semibold mb-2">Lessons Learned</label>
            <textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What did you learn today that will help you tomorrow?"
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Milestone Recognition */}
          <div>
            <label className="block text-lg font-semibold mb-2">Milestone Recognition</label>
            <textarea
              value={milestoneRecognition}
              onChange={(e) => setMilestoneRecognition(e.target.value)}
              placeholder="Any milestones or achievements to celebrate today?"
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Tomorrow's Actions */}
          <div>
            <label className="block text-lg font-semibold mb-4">Tomorrow's Action Plan</label>
            <div className="space-y-3">
              {tomorrowActions.map((action, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={action}
                    onChange={(e) => updateTomorrowAction(index, e.target.value)}
                    placeholder={`Action ${index + 1}`}
                    className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  {tomorrowActions.length > 1 && (
                    <button
                      onClick={() => removeTomorrowAction(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTomorrowAction}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-gray-600 dark:text-gray-400"
              >
                + Add Action
              </button>
            </div>
          </div>

          {/* Motivation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2">
                Motivation Level: {motivationLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={motivationLevel}
                onChange={(e) => setMotivationLevel(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2">Motivation Source</label>
              <input
                type="text"
                value={motivationSource}
                onChange={(e) => setMotivationSource(e.target.value)}
                placeholder="What's driving you today?"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Celebration Note */}
          <div>
            <label className="block text-lg font-semibold mb-2">Celebration Note</label>
            <textarea
              value={celebrationNote}
              onChange={(e) => setCelebrationNote(e.target.value)}
              placeholder="What are you proud of today? How will you celebrate your progress?"
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleSave}
            disabled={saving || !dailyProgress.some(task => task.task.trim())}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
          >
            {saving ? 'Saving Progress...' : 'Complete Progress Check 🎯'}
          </button>
        </div>
      </div>

      {/* Journal History */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-xl font-bold mb-4">Progress History</h2>
        <SpecializedJournalHistory
          journalType="goal-achievement"
          title="Goal Achievement History"
          icon="🎯"
          renderEntry={(entry) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {entry.goalTitle}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp?.toDate?.() || entry.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="font-medium text-green-800 dark:text-green-300 mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {entry.dailyCompletionRate?.toFixed(1) || 0}%
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">Motivation</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {entry.motivation?.level || 0}/10
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="font-medium text-purple-800 dark:text-purple-300 mb-1">Productivity</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {entry.productivityScore || 0}
                  </div>
                </div>
              </div>
              
              {entry.dailyProgress && entry.dailyProgress.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Tasks Completed:</div>
                  <div className="space-y-1">
                    {entry.dailyProgress.map((task: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className={task.completed ? 'text-green-500' : 'text-gray-400'}>
                          {task.completed ? '✓' : '○'}
                        </span>
                        <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                          {task.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {entry.obstaclesFaced && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">Obstacles</div>
                  <div className="text-orange-700 dark:text-orange-300">{entry.obstaclesFaced}</div>
                </div>
              )}
              
              {entry.lessonsLearned && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Lessons Learned</div>
                  <div className="text-blue-700 dark:text-blue-300">{entry.lessonsLearned}</div>
                </div>
              )}
              
              {entry.celebrationNote && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Celebration</div>
                  <div className="text-yellow-700 dark:text-yellow-300">{entry.celebrationNote}</div>
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* Auto AI Insights */}
      {showAutoAI && lastSavedEntry && (
        <AutoAIInsights
          journalType="goal-achievement"
          entryData={lastSavedEntry}
          onClose={() => {
            setShowAutoAI(false);
            setLastSavedEntry(null);
          }}
        />
      )}
    </div>
  );
}