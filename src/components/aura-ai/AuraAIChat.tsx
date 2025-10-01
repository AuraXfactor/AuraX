'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'encouragement' | 'crisis_support' | 'celebration' | 'resource' | 'exercise';
  metadata?: {
    mood?: string;
    context?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    topics?: string[];
  };
}

interface AuraAIChatProps {
  onClose?: () => void;
  initialMessage?: string;
  context?: 'journal' | 'crisis' | 'general' | 'celebration' | 'mood' | 'therapy' | 'goals';
}

export default function AuraAIChat({ 
  onClose, 
  initialMessage, 
  context = 'general' 
}: AuraAIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMemory, setConversationMemory] = useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Aura AI personality and responses
  const auraPersonality = {
    name: 'Aura',
    avatar: '✨',
    greeting: 'Hey there! I\'m Aura, your mental wellness companion. I\'m here to support you through your journey. What\'s on your mind today?',
    crisisSupport: 'I\'m here with you. It sounds like you\'re going through a tough time. Remember, you\'re not alone, and it\'s okay to feel this way.',
    encouragement: 'You\'re doing amazing! Every step forward, no matter how small, is progress worth celebrating.',
    celebration: 'Wow! That\'s fantastic! I\'m so proud of you. Your growth and achievements are truly inspiring.'
  };

  useEffect(() => {
    // Initialize with greeting
    if (messages.length === 0) {
      const greeting = getContextualGreeting();
      setMessages([{
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  }, [context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualGreeting = () => {
    switch (context) {
      case 'journal':
        return 'Hi! I see you\'re journaling. How are you feeling today? I\'d love to help you reflect and grow.';
      case 'crisis':
        return 'I\'m here for you. It sounds like you might be going through a difficult time. I want you to know that your feelings are valid and you\'re not alone.';
      case 'celebration':
        return 'Congratulations! I can sense the positive energy! Tell me more about what you\'re celebrating - I love hearing about your wins!';
      case 'mood':
        return 'Hello! I\'m here to help you explore your emotions and mood patterns. What\'s on your mind today?';
      case 'therapy':
        return 'Hi there! I\'m here to support your therapeutic journey. How are you feeling about your progress?';
      case 'goals':
        return 'Hello! I\'m excited to help you work toward your goals. What are you hoping to achieve?';
      default:
        return auraPersonality.greeting;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAuraResponse = async (userMessage: string): Promise<ChatMessage> => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Enhanced context analysis
    const messageLower = userMessage.toLowerCase();
    const messageLength = userMessage.length;
    const wordCount = userMessage.split(' ').length;
    
    // Crisis detection with more comprehensive keywords
    const crisisKeywords = [
      'sad', 'depressed', 'anxious', 'scared', 'hopeless', 'suicidal', 'hurt', 'pain',
      'overwhelmed', 'stressed', 'lonely', 'empty', 'worthless', 'guilty', 'ashamed',
      'trapped', 'stuck', 'can\'t', 'won\'t', 'never', 'always', 'hate', 'despise'
    ];
    const isCrisis = crisisKeywords.some(word => messageLower.includes(word)) || 
                     messageLower.includes('kill myself') || 
                     messageLower.includes('end it all');

    // Celebration detection
    const celebrationKeywords = [
      'happy', 'excited', 'proud', 'accomplished', 'grateful', 'amazing', 'wonderful',
      'fantastic', 'brilliant', 'awesome', 'great', 'love', 'enjoy', 'celebrate',
      'success', 'achievement', 'progress', 'breakthrough', 'milestone'
    ];
    const isCelebration = celebrationKeywords.some(word => messageLower.includes(word));

    // Question detection
    const isQuestion = messageLower.includes('?') || 
                      messageLower.startsWith('how') || 
                      messageLower.startsWith('what') || 
                      messageLower.startsWith('why') ||
                      messageLower.startsWith('when') ||
                      messageLower.startsWith('where') ||
                      messageLower.startsWith('who');

    // Mood analysis
    const moodKeywords = {
      positive: ['good', 'great', 'fine', 'okay', 'well', 'better', 'improved'],
      negative: ['bad', 'terrible', 'awful', 'horrible', 'worst', 'struggling'],
      neutral: ['okay', 'fine', 'normal', 'average', 'same', 'usual']
    };
    const detectedMood = Object.entries(moodKeywords).find(([mood, keywords]) => 
      keywords.some(keyword => messageLower.includes(keyword))
    )?.[0] || 'neutral';

    // Context-specific responses
    let response = '';
    let type: ChatMessage['type'] = 'text';

    if (isCrisis) {
      response = generateCrisisResponse(userMessage, messageLength, wordCount);
      type = 'crisis_support';
    } else if (isCelebration) {
      response = generateCelebrationResponse(userMessage, messageLength, wordCount);
      type = 'celebration';
    } else if (isQuestion) {
      response = generateQuestionResponse(userMessage, context);
      type = 'suggestion';
    } else {
      response = generateContextualResponse(userMessage, context, detectedMood, messageLength);
      type = 'encouragement';
    }

    // Add resource suggestions for certain contexts
    const shouldAddResources = isCrisis || context === 'mood' || context === 'therapy' || context === 'goals';
    if (shouldAddResources) {
      const resources = generateResourceSuggestions(context, detectedMood);
      if (resources.length > 0) {
        response += "\n\n💡 Here are some resources that might help:\n" + resources.map(r => `• ${r}`).join('\n');
        type = 'resource';
      }
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type,
      metadata: {
        mood: detectedMood,
        context,
        sentiment: isCrisis ? 'negative' : isCelebration ? 'positive' : 'neutral',
        topics: extractTopics(userMessage)
      }
    };
  };

  const generateCrisisResponse = (message: string, messageLength: number, wordCount: number): string => {
    const responses = [
      "I can hear that you're going through a really tough time right now. Your feelings are completely valid, and I want you to know that you're not alone in this.",
      "It sounds like you're carrying a heavy burden. Remember, it's okay to not be okay sometimes. You're being so brave by reaching out.",
      "I'm here with you through this difficult moment. Sometimes just acknowledging our pain is the first step toward healing.",
      "Your feelings matter, and so do you. Even in the darkest moments, there's a part of you that's still fighting, and that's incredibly powerful.",
      "It's okay to feel overwhelmed. You don't have to have all the answers right now. Sometimes just being present with our feelings is enough."
    ];

    // Add crisis-specific resources and support
    const crisisResources = [
      "\n\nIf you're in immediate danger, please call emergency services or a crisis hotline. You matter, and there are people who want to help you through this.",
      "\n\nRemember: This feeling is temporary, even if it doesn't feel that way right now. You've survived 100% of your worst days so far.",
      "\n\nConsider reaching out to a trusted friend, family member, or mental health professional. You don't have to face this alone."
    ];

    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    const resource = crisisResources[Math.floor(Math.random() * crisisResources.length)];
    
    return baseResponse + resource;
  };

  const generateCelebrationResponse = (message: string, messageLength: number, wordCount: number): string => {
    const responses = [
      "That's absolutely wonderful! I'm so proud of you! Your positive energy is contagious and inspiring.",
      "Wow! That's fantastic news! I love hearing about your wins - they remind me of how resilient and amazing you are.",
      "You're doing incredible things! Your growth and achievements are truly something to celebrate.",
      "This is so exciting! I can feel your joy through your words, and it's absolutely beautiful.",
      "You should be so proud of yourself! Every victory, big or small, is worth celebrating."
    ];

    // Add celebration-specific encouragement and follow-up
    const celebrationFollowUps = [
      "\n\nWhat do you think contributed most to this success? Understanding our wins helps us create more of them!",
      "\n\nHow can you build on this momentum? Sometimes our biggest breakthroughs come from recognizing our own strength.",
      "\n\nTake a moment to really savor this feeling. You've earned this celebration!",
      "\n\nThis is such a beautiful reminder of your capabilities. You're capable of amazing things!"
    ];

    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    const followUp = celebrationFollowUps[Math.floor(Math.random() * celebrationFollowUps.length)];
    
    return baseResponse + followUp;
  };

  const generateQuestionResponse = (message: string, context: string): string => {
    const baseResponses = [
      "That's a great question! Let me help you think through this. What feels most important to you right now?",
      "I love that you're asking thoughtful questions! This shows you're actively engaging with your growth.",
      "That's such a meaningful question. Sometimes the answers come from within - what does your intuition tell you?",
      "I appreciate you sharing this with me. Let's explore this together - what feels true for you in this moment?",
      "Your curiosity is beautiful! Questions like this show you're committed to understanding yourself better."
    ];

    // Context-specific question responses
    const contextResponses = {
      journal: [
        "Journaling is such a powerful tool for self-discovery. What patterns are you noticing in your thoughts?",
        "Your journal entries are windows into your inner world. What themes keep coming up for you?",
        "I love how reflective you're being. What insights are emerging as you write?"
      ],
      mood: [
        "Mood tracking helps us understand our emotional patterns. What factors do you think influence your mood most?",
        "Your emotional awareness is really impressive. What do you notice about your mood fluctuations?",
        "Understanding our moods is key to emotional wellness. What strategies have worked for you before?"
      ],
      therapy: [
        "Therapy is such a brave step toward healing. What are you hoping to work through?",
        "Your commitment to growth through therapy is inspiring. What insights are you gaining?",
        "Therapeutic work can be challenging but so rewarding. What's been most helpful for you?"
      ],
      goals: [
        "Goal-setting shows such forward thinking! What's driving you toward this goal?",
        "Your goal-oriented mindset is admirable. What steps feel most important right now?",
        "Achieving goals requires both planning and flexibility. What's your approach?"
      ]
    };

    const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    const contextResponse = contextResponses[context as keyof typeof contextResponses];
    const specificResponse = contextResponse ? contextResponse[Math.floor(Math.random() * contextResponse.length)] : "";
    
    return baseResponse + (specificResponse ? `\n\n${specificResponse}` : "");
  };

  const generateContextualResponse = (message: string, context: string, detectedMood: string, messageLength: number): string => {
    const baseResponses = [
      "I'm really glad you're sharing this with me. Your openness and honesty are such beautiful qualities.",
      "Thank you for trusting me with your thoughts. I'm here to listen and support you in whatever way feels right.",
      "I can sense the depth in what you're sharing. You're doing such important work by being so reflective.",
      "Your words show such wisdom and self-awareness. I'm honored to be part of your journey.",
      "I'm here with you in this moment. Sometimes just having someone to listen makes all the difference."
    ];

    // Context-specific responses
    const contextResponses = {
      journal: [
        "Your journaling practice is such a gift to yourself. What insights are you discovering?",
        "I love how you're using writing to process your thoughts. What patterns are you noticing?",
        "Journaling is such a powerful tool for self-discovery. What's coming up for you today?"
      ],
      mood: [
        "Your emotional awareness is really impressive. What's influencing your mood today?",
        "Mood tracking helps us understand ourselves better. What factors are affecting you most?",
        "I appreciate you sharing your emotional state. What strategies help you feel better?"
      ],
      therapy: [
        "Your commitment to therapy and growth is inspiring. What are you learning about yourself?",
        "Therapeutic work takes courage. What insights are you gaining from your sessions?",
        "I'm proud of you for prioritizing your mental health. What's been most helpful?"
      ],
      goals: [
        "Your goal-oriented mindset is admirable. What's driving you forward today?",
        "Setting and working toward goals shows such determination. What's your focus right now?",
        "I love your forward-thinking approach. What steps are you taking toward your goals?"
      ],
      crisis: [
        "I'm here with you through this difficult time. You're not alone in this.",
        "Your feelings are valid, and I want you to know that you matter.",
        "It's okay to not be okay. Sometimes just acknowledging our pain is the first step."
      ],
      celebration: [
        "I can feel your positive energy! What's bringing you joy today?",
        "Your happiness is contagious! Tell me more about what's going well.",
        "I love hearing about your wins! What are you celebrating?"
      ]
    };

    // Mood-specific responses
    const moodResponses = {
      positive: [
        "I can sense the positive energy in your words. What's contributing to this good feeling?",
        "Your optimism is beautiful to witness. What's going well for you right now?",
        "I love hearing about your positive experiences. What's making you feel good?"
      ],
      negative: [
        "I can hear that you're going through a tough time. Your feelings are completely valid.",
        "It sounds like you're carrying some heavy emotions. I'm here to listen and support you.",
        "I want you to know that it's okay to feel this way. You're not alone in this."
      ],
      neutral: [
        "I appreciate you sharing your current state with me. What's on your mind today?",
        "Sometimes neutral moments are just as important to acknowledge. How are you feeling?",
        "I'm here to listen to whatever you'd like to share. What's happening in your world?"
      ]
    };

    const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    const contextResponse = contextResponses[context as keyof typeof contextResponses];
    const moodResponse = moodResponses[detectedMood as keyof typeof moodResponses];
    
    let response = baseResponse;
    
    if (contextResponse) {
      response += `\n\n${contextResponse[Math.floor(Math.random() * contextResponse.length)]}`;
    }
    
    if (moodResponse && context !== 'crisis' && context !== 'celebration') {
      response += `\n\n${moodResponse[Math.floor(Math.random() * moodResponse.length)]}`;
    }

    // Add length-based follow-up for longer messages
    if (messageLength > 100) {
      response += "\n\nI can tell you've put a lot of thought into this. Thank you for sharing so openly with me.";
    }

    return response;
  };

  const generateResourceSuggestions = (context: string, detectedMood: string): string[] => {
    const resources = {
      crisis: [
        "🆘 National Suicide Prevention Lifeline: 988",
        "💙 Crisis Text Line: Text HOME to 741741",
        "🏥 Emergency Services: 911",
        "🧠 National Alliance on Mental Illness (NAMI): 1-800-950-NAMI"
      ],
      mood: [
        "📱 Try the 5-4-3-2-1 grounding technique",
        "🧘 Practice deep breathing exercises",
        "📝 Write down three things you're grateful for",
        "🚶 Take a 10-minute walk outside"
      ],
      therapy: [
        "📚 Consider journaling about your therapy insights",
        "🎯 Practice the techniques your therapist suggested",
        "📞 Reach out to your support network",
        "🧘 Try mindfulness or meditation"
      ],
      goals: [
        "📝 Break your goal into smaller, manageable steps",
        "⏰ Set specific timeframes for each step",
        "🎯 Create daily or weekly action items",
        "📊 Track your progress and celebrate small wins"
      ],
      journal: [
        "✍️ Try stream-of-consciousness writing",
        "🤔 Ask yourself 'What am I feeling right now?'",
        "📅 Reflect on your day's highlights and challenges",
        "💭 Write about what you learned about yourself"
      ]
    };

    const contextResources = resources[context as keyof typeof resources] || [];
    const moodResources = resources.mood;
    
    return [...contextResources, ...moodResources].slice(0, 3);
  };

  const extractTopics = (message: string): string[] => {
    const topics: string[] = [];
    const messageLower = message.toLowerCase();
    
    const topicKeywords = {
      'relationships': ['relationship', 'partner', 'friend', 'family', 'love', 'dating'],
      'work': ['work', 'job', 'career', 'boss', 'colleague', 'office'],
      'health': ['health', 'sick', 'doctor', 'medical', 'pain', 'illness'],
      'anxiety': ['anxious', 'worry', 'nervous', 'panic', 'stress', 'fear'],
      'depression': ['sad', 'depressed', 'down', 'hopeless', 'empty', 'worthless'],
      'goals': ['goal', 'dream', 'aspiration', 'plan', 'future', 'achieve'],
      'self-care': ['self-care', 'exercise', 'sleep', 'meditation', 'mindfulness'],
      'social': ['social', 'lonely', 'isolated', 'friends', 'party', 'gathering']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const aiResponse = await generateAuraResponse(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing that right now. Could you try again?',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStyle = (message: ChatMessage) => {
    const baseStyle = "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm";
    
    if (message.role === 'user') {
      return `${baseStyle} bg-blue-500 text-white ml-auto`;
    }
    
    // Assistant message styles based on type
    switch (message.type) {
      case 'crisis_support':
        return `${baseStyle} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800`;
      case 'celebration':
        return `${baseStyle} bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800`;
      case 'suggestion':
        return `${baseStyle} bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800`;
      case 'encouragement':
        return `${baseStyle} bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800`;
      case 'resource':
        return `${baseStyle} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800`;
      case 'exercise':
        return `${baseStyle} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800`;
      default:
        return `${baseStyle} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
            {auraPersonality.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Aura AI</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your mental wellness companion</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={getMessageStyle(message)}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => {
                setInputMessage("I'm feeling overwhelmed and need some support");
                setShowQuickActions(false);
              }}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              🆘 I need support
            </button>
            <button
              onClick={() => {
                setInputMessage("I'm feeling grateful and want to share my joy");
                setShowQuickActions(false);
              }}
              className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
            >
              🎉 I'm celebrating
            </button>
            <button
              onClick={() => {
                setInputMessage("I want to work on my goals and motivation");
                setShowQuickActions(false);
              }}
              className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition"
            >
              🎯 Goal setting
            </button>
            <button
              onClick={() => {
                setInputMessage("I need help with my mood and emotions");
                setShowQuickActions(false);
              }}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              😊 Mood help
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share what's on your mind..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={isLoading}
          />
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Quick actions"
          >
            ⚡
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '⏳' : '✨'}
          </button>
        </div>
      </div>
    </div>
  );
}