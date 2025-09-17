'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserProfile } from '@/lib/userProfile';

interface OnboardingData {
  name: string;
  username: string;
  avatar: string;
  moodBaseline: string[];
  focusAreas: string[];
  preferredTherapy: string;
  reminderTime: string;
}

const defaultAvatars = [
  '🌸', '🌺', '🦋', '🌙', '⭐', '🌊', '🍃', '🌈', '🔮', '💫'
];

const focusAreaOptions = [
  { id: 'stress-relief', label: 'Stress Relief', icon: '🧘‍♀️' },
  { id: 'addiction-recovery', label: 'Addiction Recovery', icon: '💪' },
  { id: 'better-sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'productivity-focus', label: 'Productivity & Focus', icon: '🎯' },
  { id: 'relationships-connection', label: 'Relationships & Connection', icon: '💝' },
  { id: 'self-love-confidence', label: 'Self-Love & Confidence', icon: '✨' }
];

const therapyOptions = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'phone', label: 'Phone Call', icon: '📞' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { id: 'video', label: 'Video Call', icon: '📹' }
];

const reminderOptions = [
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌙' }
];

const moodEmojis = ['😊', '😐', '😴', '😔', '😤', '🥰', '😌', '🤔', '😅', '🥺'];

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    username: '',
    avatar: defaultAvatars[0],
    moodBaseline: [],
    focusAreas: [],
    preferredTherapy: '',
    reminderTime: ''
  });
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/signup');
    }
  }, [user, router]);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await saveUserProfile(user.uid, {
        name: data.name,
        username: data.username,
        email: user.email || '',
        avatar: data.avatar,
        focusAreas: data.focusAreas,
        preferredTherapy: data.preferredTherapy,
        reminderTime: data.reminderTime,
        moodBaseline: data.moodBaseline,
        auraPoints: 0,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      router.push('/profile-summary');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return data.name.trim() !== '' && data.username.trim() !== '';
      case 2: return data.moodBaseline.length === 3;
      case 3: return data.focusAreas.length >= 2 && data.focusAreas.length <= 3;
      case 4: return true; // Optional step
      case 5: return data.reminderTime !== '';
      case 6: return true; // Optional step
      default: return true;
    }
  };

  const toggleMoodEmoji = (emoji: string) => {
    if (data.moodBaseline.includes(emoji)) {
      setData({ ...data, moodBaseline: data.moodBaseline.filter(e => e !== emoji) });
    } else if (data.moodBaseline.length < 3) {
      setData({ ...data, moodBaseline: [...data.moodBaseline, emoji] });
    }
  };

  const toggleFocusArea = (areaId: string) => {
    if (data.focusAreas.includes(areaId)) {
      setData({ ...data, focusAreas: data.focusAreas.filter(a => a !== areaId) });
    } else if (data.focusAreas.length < 3) {
      setData({ ...data, focusAreas: [...data.focusAreas, areaId] });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {currentStep} of 6</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 animate-pop">
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Aura X!</h2>
              <p className="text-gray-600 mb-6">Let&apos;s get to know you better</p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />

                <div>
                  <p className="text-sm text-gray-600 mb-3">Pick your avatar</p>
                  <div className="grid grid-cols-5 gap-3">
                    {defaultAvatars.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setData({ ...data, avatar })}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                          data.avatar === avatar 
                            ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' 
                            : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-400 to-orange-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">😊</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">How are you feeling?</h2>
              <p className="text-gray-600 mb-6">Select 3 emojis that represent your current vibe</p>
              
              <div className="grid grid-cols-5 gap-3 mb-4">
                {moodEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleMoodEmoji(emoji)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      data.moodBaseline.includes(emoji)
                        ? 'bg-rose-100 ring-2 ring-rose-500 scale-110' 
                        : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <p className="text-sm text-gray-500">
                Selected: {data.moodBaseline.length}/3
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Wellness Focus</h2>
              <p className="text-gray-600 mb-6">Choose 2-3 areas you&apos;d like to focus on</p>
              
              <div className="space-y-3">
                {focusAreaOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleFocusArea(option.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                      data.focusAreas.includes(option.id)
                        ? 'border-emerald-500 bg-emerald-50 scale-105' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Selected: {data.focusAreas.length}/3
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Preferred Therapy Style</h2>
              <p className="text-gray-600 mb-6">How would you like to connect? (Optional)</p>
              
              <div className="grid grid-cols-2 gap-3">
                {therapyOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, preferredTherapy: option.id })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      data.preferredTherapy === option.id
                        ? 'border-purple-500 bg-purple-50 scale-105' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">⏰</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Journal Reminders</h2>
              <p className="text-gray-600 mb-6">When would you like to be reminded to journal?</p>
              
              <div className="space-y-3">
                {reminderOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, reminderTime: option.id })}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      data.reminderTime === option.id
                        ? 'border-amber-500 bg-amber-50 scale-105' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl flex items-center justify-center animate-pop">
                <span className="text-3xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Profile Picture</h2>
              <p className="text-gray-600 mb-6">Add a photo or keep your avatar (Optional)</p>
              
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center text-4xl">
                  {data.avatar}
                </div>
                
                <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all">
                  Upload Photo (Coming Soon)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className={`flex-1 py-3 px-6 rounded-2xl text-white font-medium transition-all ${
              isStepValid() && !loading
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 active:scale-95' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Saving...' : currentStep === 6 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}