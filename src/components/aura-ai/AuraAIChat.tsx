'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'encouragement' | 'crisis_support' | 'celebration';
}

interface AuraAIChatProps {
  onClose?: () => void;
  initialMessage?: string;
  context?: 'journal' | 'crisis' | 'general' | 'celebration';
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

    // Analyze user message for context
    const messageLower = userMessage.toLowerCase();
    const isCrisis = ['sad', 'depressed', 'anxious', 'scared', 'hopeless', 'suicidal', 'hurt', 'pain'].some(word => 
      messageLower.includes(word)
    );
    const isCelebration = ['happy', 'excited', 'proud', 'accomplished', 'grateful', 'amazing', 'wonderful'].some(word => 
      messageLower.includes(word)
    );
    const isQuestion = messageLower.includes('?') || messageLower.startsWith('how') || messageLower.startsWith('what') || messageLower.startsWith('why');

    let response = '';
    let type: ChatMessage['type'] = 'text';

    if (isCrisis) {
      response = generateCrisisResponse(userMessage);
      type = 'crisis_support';
    } else if (isCelebration) {
      response = generateCelebrationResponse(userMessage);
      type = 'celebration';
    } else if (isQuestion) {
      response = generateQuestionResponse(userMessage);
      type = 'suggestion';
    } else {
      response = generateGeneralResponse(userMessage);
      type = 'encouragement';
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type
    };
  };

  const generateCrisisResponse = (message: string): string => {
    const responses = [
      "I can hear that you're going through a really tough time right now. Your feelings are completely valid, and I want you to know that you're not alone in this.",
      "It sounds like you're carrying a heavy burden. Remember, it's okay to not be okay sometimes. You're being so brave by reaching out.",
      "I'm here with you through this difficult moment. Sometimes just acknowledging our pain is the first step toward healing.",
      "Your feelings matter, and so do you. Even in the darkest moments, there's a part of you that's still fighting, and that's incredibly powerful.",
      "It's okay to feel overwhelmed. You don't have to have all the answers right now. Sometimes just being present with our feelings is enough."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateCelebrationResponse = (message: string): string => {
    const responses = [
      "That's absolutely wonderful! I'm so proud of you! Your positive energy is contagious and inspiring.",
      "Wow! That's fantastic news! I love hearing about your wins - they remind me of how resilient and amazing you are.",
      "You're doing incredible things! Your growth and achievements are truly something to celebrate.",
      "This is so exciting! I can feel your joy through your words, and it's absolutely beautiful.",
      "You should be so proud of yourself! Every victory, big or small, is worth celebrating."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateQuestionResponse = (message: string): string => {
    const responses = [
      "That's a great question! Let me help you think through this. What feels most important to you right now?",
      "I love that you're asking thoughtful questions! This shows you're actively engaging with your growth.",
      "That's such a meaningful question. Sometimes the answers come from within - what does your intuition tell you?",
      "I appreciate you sharing this with me. Let's explore this together - what feels true for you in this moment?",
      "Your curiosity is beautiful! Questions like this show you're committed to understanding yourself better."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateGeneralResponse = (message: string): string => {
    const responses = [
      "I'm really glad you're sharing this with me. Your openness and honesty are such beautiful qualities.",
      "Thank you for trusting me with your thoughts. I'm here to listen and support you in whatever way feels right.",
      "I can sense the depth in what you're sharing. You're doing such important work by being so reflective.",
      "Your words show such wisdom and self-awareness. I'm honored to be part of your journey.",
      "I'm here with you in this moment. Sometimes just having someone to listen makes all the difference."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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