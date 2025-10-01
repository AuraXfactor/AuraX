'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mood?: string;
  crisisLevel?: 'low' | 'medium' | 'high' | 'urgent';
}

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  triggers: string[];
  notes: string;
  timestamp: Date;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'from-yellow-400 to-orange-400' },
  { emoji: '😌', label: 'Calm', value: 'calm', color: 'from-blue-400 to-cyan-400' },
  { emoji: '😔', label: 'Sad', value: 'sad', color: 'from-gray-400 to-slate-400' },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'from-red-400 to-pink-400' },
  { emoji: '😤', label: 'Angry', value: 'angry', color: 'from-red-500 to-orange-500' },
  { emoji: '😴', label: 'Tired', value: 'tired', color: 'from-purple-400 to-indigo-400' },
  { emoji: '🤗', label: 'Grateful', value: 'grateful', color: 'from-green-400 to-emerald-400' },
  { emoji: '😟', label: 'Worried', value: 'worried', color: 'from-yellow-500 to-amber-500' },
];

const CRISIS_RESOURCES = [
  {
    title: 'National Suicide Prevention Lifeline',
    number: '988',
    description: '24/7 crisis support',
    type: 'phone'
  },
  {
    title: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    description: 'Crisis support via text',
    type: 'text'
  },
  {
    title: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    description: 'Substance abuse and mental health support',
    type: 'phone'
  }
];

export default function ChatAIPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState<'general' | 'mood' | 'crisis'>('general');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'low' | 'medium' | 'high' | 'urgent' | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI wellness companion. I'm here to support you with mental health guidance, mood tracking, and crisis support. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user, router]);

  const detectCrisisLevel = (text: string): 'low' | 'medium' | 'high' | 'urgent' => {
    const urgentWords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'want to die'];
    const highWords = ['hopeless', 'desperate', 'can\'t go on', 'overwhelmed', 'breaking down'];
    const mediumWords = ['struggling', 'difficult', 'hard time', 'stressed', 'anxious'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
    if (highWords.some(word => lowerText.includes(word))) return 'high';
    if (mediumWords.some(word => lowerText.includes(word))) return 'medium';
    return 'low';
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const crisisLevel = detectCrisisLevel(userMessage);
    
    if (crisisLevel === 'urgent') {
      return `I'm very concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to a crisis helpline immediately:

🚨 **CRISIS RESOURCES:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: 911

You are not alone, and there are people who want to help you. Please reach out to someone you trust or a mental health professional right now.`;
    }
    
    if (crisisLevel === 'high') {
      return `I can hear that you're going through a really difficult time right now. It takes courage to share these feelings. 

While I'm here to listen and support you, I want to make sure you have access to professional help:

📞 **Support Resources:**
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• SAMHSA National Helpline: 1-800-662-4357

Would you like me to help you find local mental health resources, or would you prefer to talk about what's been weighing on your mind?`;
    }
    
    if (crisisLevel === 'medium') {
      return `I can sense that you're dealing with some challenging emotions right now. That's completely understandable - life can be overwhelming sometimes.

It's really important to acknowledge these feelings rather than push them away. What's been the most difficult part of your day or week? Sometimes talking through it can help lighten the load.

Remember, it's okay to not be okay sometimes. You're taking a positive step by reaching out.`;
    }
    
    // General supportive responses
    const generalResponses = [
      "Thank you for sharing that with me. It sounds like you're being really thoughtful about your wellbeing.",
      "I appreciate you opening up about this. How has this been affecting your daily life?",
      "That sounds like it's been weighing on you. What do you think might help you feel a bit better?",
      "I'm here to listen and support you. What would feel most helpful right now?",
      "It takes strength to talk about these things. What's one small thing that usually helps you feel more grounded?"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(input);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleMoodSelection = (mood: string) => {
    const moodEntry: MoodEntry = {
      id: Date.now().toString(),
      mood,
      intensity: Math.floor(Math.random() * 5) + 1,
      triggers: [],
      notes: '',
      timestamp: new Date()
    };
    
    setMoodHistory(prev => [...prev, moodEntry]);
    setShowMoodPicker(false);
    
    // Add mood tracking message
    const moodMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `I've recorded your mood as ${mood}. How are you feeling about this? Is there anything specific that's contributing to this feeling?`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, moodMessage]);
  };

  const handleCrisisSupport = () => {
    setCurrentMode('crisis');
    const crisisMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `I'm here to help you through this difficult time. Your safety and wellbeing are my top priority. 

If you're having thoughts of self-harm, please reach out to emergency services (911) or a crisis helpline immediately.

What's going on that's making you feel this way? I'm here to listen without judgment.`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, crisisMessage]);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                🤖
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Wellness Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMode === 'crisis' ? 'Crisis Support Mode' : 
                   currentMode === 'mood' ? 'Mood Tracking Mode' : 'General Support'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMode('general')}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  currentMode === 'general' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setCurrentMode('mood')}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  currentMode === 'mood' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Mood
              </button>
              <button
                onClick={handleCrisisSupport}
                className="px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition"
              >
                Crisis
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        {currentMode === 'mood' && (
          <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-t border-white/20">
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelection(mood.value)}
                  className={`px-3 py-2 rounded-full text-sm transition hover:scale-105 bg-gradient-to-r ${mood.color} text-white shadow-lg`}
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Resources */}
        {currentMode === 'crisis' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">🚨 Crisis Resources</h3>
            <div className="space-y-2">
              {CRISIS_RESOURCES.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">{resource.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</div>
                  </div>
                  <div className="text-lg font-bold text-red-600">{resource.number}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-t border-white/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}