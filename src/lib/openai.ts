import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AuraAIResponse {
  response: string;
  mood?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  suggestions?: string[];
  activities?: string[];
  priority?: 'high' | 'medium' | 'low';
  type?: 'empathy' | 'celebration' | 'guidance' | 'crisis_support';
}

export interface JournalAnalysis {
  mood: string;
  sentiment: number; // -1 to 1
  themes: string[];
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  positivePatterns: string[];
}

export interface SmartPrompt {
  prompt: string;
  category: 'gratitude' | 'reflection' | 'goals' | 'creative' | 'crisis' | 'celebration';
  context: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MoodPrediction {
  predictedMood: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
  proactiveActions: string[];
}

export class AuraAIService {
  private static instance: AuraAIService;
  
  public static getInstance(): AuraAIService {
    if (!AuraAIService.instance) {
      AuraAIService.instance = new AuraAIService();
    }
    return AuraAIService.instance;
  }

  async generateEmpatheticResponse(
    userMessage: string,
    context: 'journal' | 'crisis' | 'general' | 'celebration' = 'general',
    userHistory?: any[]
  ): Promise<AuraAIResponse> {
    const systemPrompt = this.getSystemPrompt(context);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.8,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      return {
        response,
        mood: this.extractMood(response),
        sentiment: this.analyzeSentiment(response),
        suggestions: this.extractSuggestions(response),
        activities: this.extractActivities(response),
        priority: this.determinePriority(userMessage),
        type: this.determineResponseType(userMessage, response)
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        response: "I'm here for you. Sometimes the best support is just knowing someone is listening. How can I help you feel better right now?",
        mood: 'neutral',
        sentiment: 'neutral',
        type: 'empathy'
      };
    }
  }

  async analyzeJournalEntry(entryText: string, mood: string, activities: string[]): Promise<JournalAnalysis> {
    const prompt = `
Analyze this journal entry and provide insights:

Entry: "${entryText}"
Mood: ${mood}
Activities: ${activities.join(', ')}

Provide analysis in JSON format:
{
  "mood": "detected mood from text",
  "sentiment": -1 to 1 score,
  "themes": ["theme1", "theme2"],
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "riskFactors": ["risk1", "risk2"],
  "positivePatterns": ["pattern1", "pattern2"]
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.error('Journal analysis error:', error);
      return {
        mood: 'neutral',
        sentiment: 0,
        themes: [],
        insights: [],
        recommendations: [],
        riskFactors: [],
        positivePatterns: []
      };
    }
  }

  async generateSmartPrompts(
    currentMood: string,
    recentActivities: string[],
    userHistory?: any[]
  ): Promise<SmartPrompt[]> {
    const prompt = `
Generate 5 personalized journal prompts for someone who is feeling ${currentMood} and has been doing: ${recentActivities.join(', ')}.

Consider their current emotional state and suggest prompts that would be helpful for reflection, growth, or processing.

Return as JSON array:
[
  {
    "prompt": "What are you grateful for today?",
    "category": "gratitude",
    "context": "Focus on positive aspects",
    "priority": "high"
  }
]
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content || '[]';
      return JSON.parse(response);
    } catch (error) {
      console.error('Smart prompts error:', error);
      return this.getFallbackPrompts(currentMood);
    }
  }

  async predictMood(userHistory: any[]): Promise<MoodPrediction> {
    const prompt = `
Based on this user's journal history, predict their likely mood and provide recommendations:

${JSON.stringify(userHistory.slice(-10))}

Return JSON:
{
  "predictedMood": "mood",
  "confidence": 0.0-1.0,
  "riskLevel": "low/medium/high",
  "factors": ["factor1", "factor2"],
  "recommendations": ["rec1", "rec2"],
  "proactiveActions": ["action1", "action2"]
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.error('Mood prediction error:', error);
      return {
        predictedMood: 'neutral',
        confidence: 0.5,
        riskLevel: 'low',
        factors: [],
        recommendations: [],
        proactiveActions: []
      };
    }
  }

  async generateMotivationalContent(mood: string, context: string): Promise<string[]> {
    const prompt = `
Generate 3 motivational quotes or affirmations for someone feeling ${mood} in this context: ${context}.

Make them:
- Youth-friendly and relatable
- Swaggy but supportive
- Not overly clinical or therapy-like
- Encouraging and empowering

Return as JSON array of strings.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || '[]';
      return JSON.parse(response);
    } catch (error) {
      console.error('Motivational content error:', error);
      return [
        "You're doing better than you think you are 💪",
        "Every small step counts - you've got this! ✨",
        "Your journey is unique and valuable 🌟"
      ];
    }
  }

  private getSystemPrompt(context: string): string {
    const basePrompt = `You are Aura, an empathetic AI companion for mental wellness. You're like a supportive best friend who's always there to listen and help. Your personality is:

- Swaggy but caring - you use modern, relatable language
- Empathetic and non-judgmental
- Supportive but not clinical or therapy-like
- Encouraging and empowering
- Youth-friendly and authentic

Respond as Aura would - with empathy, understanding, and a touch of swag. Keep responses conversational and supportive.`;

    switch (context) {
      case 'crisis':
        return basePrompt + `\n\nCRISIS MODE: The user seems to be going through a difficult time. Be extra gentle, supportive, and encouraging. Validate their feelings and offer hope.`;
      case 'celebration':
        return basePrompt + `\n\nCELEBRATION MODE: The user is sharing something positive! Be enthusiastic, proud, and celebratory. Match their energy and amplify their joy.`;
      case 'journal':
        return basePrompt + `\n\nJOURNAL MODE: Help them reflect and process their thoughts. Ask thoughtful questions and provide gentle guidance.`;
      default:
        return basePrompt;
    }
  }

  private extractMood(response: string): string {
    const moodKeywords = {
      'excited': ['excited', 'thrilled', 'amazing', 'fantastic'],
      'happy': ['happy', 'great', 'wonderful', 'awesome'],
      'neutral': ['okay', 'fine', 'alright', 'decent'],
      'sad': ['sad', 'down', 'blue', 'melancholy'],
      'anxious': ['anxious', 'worried', 'nervous', 'stressed']
    };

    const lowerResponse = response.toLowerCase();
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        return mood;
      }
    }
    return 'neutral';
  }

  private analyzeSentiment(response: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'amazing', 'wonderful', 'awesome', 'fantastic', 'love', 'excited'];
    const negativeWords = ['sad', 'difficult', 'hard', 'struggle', 'tough', 'challenging'];
    
    const lowerResponse = response.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerResponse.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerResponse.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractSuggestions(response: string): string[] {
    // Simple extraction - look for action-oriented phrases
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('try') || line.includes('consider') || line.includes('maybe')) {
        suggestions.push(line.trim());
      }
    });
    
    return suggestions.slice(0, 3);
  }

  private extractActivities(response: string): string[] {
    const activityKeywords = [
      'meditation', 'exercise', 'walk', 'music', 'reading', 'journaling',
      'breathing', 'stretching', 'calling', 'talking', 'listening'
    ];
    
    const activities: string[] = [];
    const lowerResponse = response.toLowerCase();
    
    activityKeywords.forEach(activity => {
      if (lowerResponse.includes(activity)) {
        activities.push(activity);
      }
    });
    
    return activities;
  }

  private determinePriority(message: string): 'high' | 'medium' | 'low' {
    const crisisKeywords = ['help', 'crisis', 'emergency', 'suicidal', 'hurt', 'pain'];
    const urgentKeywords = ['urgent', 'important', 'need', 'desperate'];
    
    const lowerMessage = message.toLowerCase();
    
    if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private determineResponseType(message: string, response: string): 'empathy' | 'celebration' | 'guidance' | 'crisis_support' {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    if (lowerMessage.includes('crisis') || lowerMessage.includes('help') || lowerMessage.includes('emergency')) {
      return 'crisis_support';
    }
    if (lowerMessage.includes('celebrate') || lowerMessage.includes('proud') || lowerMessage.includes('achievement')) {
      return 'celebration';
    }
    if (lowerResponse.includes('suggestion') || lowerResponse.includes('try') || lowerResponse.includes('consider')) {
      return 'guidance';
    }
    return 'empathy';
  }

  private getFallbackPrompts(mood: string): SmartPrompt[] {
    const fallbackPrompts: Record<string, SmartPrompt[]> = {
      'sad': [
        {
          prompt: "What's one small thing that brought you comfort today?",
          category: 'gratitude',
          context: 'Focus on small comforts',
          priority: 'high'
        },
        {
          prompt: "If you could tell your future self one thing, what would it be?",
          category: 'reflection',
          context: 'Future perspective',
          priority: 'medium'
        }
      ],
      'happy': [
        {
          prompt: "What made you smile today and why was it special?",
          category: 'celebration',
          context: 'Celebrate the good moments',
          priority: 'high'
        },
        {
          prompt: "How can you carry this positive energy into tomorrow?",
          category: 'goals',
          context: 'Sustain positive momentum',
          priority: 'medium'
        }
      ],
      'anxious': [
        {
          prompt: "What are three things you can see, hear, and feel right now?",
          category: 'reflection',
          context: 'Grounding exercise',
          priority: 'high'
        },
        {
          prompt: "What would you tell a friend who was feeling this way?",
          category: 'reflection',
          context: 'Self-compassion',
          priority: 'medium'
        }
      ]
    };

    return fallbackPrompts[mood] || [
      {
        prompt: "What's on your mind right now?",
        category: 'reflection',
        context: 'General reflection',
        priority: 'medium'
      }
    ];
  }
}

export const auraAI = AuraAIService.getInstance();