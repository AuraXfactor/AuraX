import OpenAI from 'openai';

// Initialize OpenAI client with conditional API key
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

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
    userHistory?: unknown[]
  ): Promise<AuraAIResponse> {
    // Fallback response if OpenAI is not available
    if (!openai) {
      return this.getFallbackResponse(userMessage, context);
    }

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
      return this.getFallbackResponse(userMessage, context);
    }
  }

  async analyzeJournalEntry(entryText: string, mood: string, activities: string[]): Promise<JournalAnalysis> {
    // Fallback analysis if OpenAI is not available
    if (!openai) {
      return this.getFallbackJournalAnalysis(entryText, mood, activities);
    }

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
      return this.getFallbackJournalAnalysis(entryText, mood, activities);
    }
  }

  async generateSmartPrompts(
    currentMood: string,
    recentActivities: string[],
    userHistory?: unknown[]
  ): Promise<SmartPrompt[]> {
    // Fallback prompts if OpenAI is not available
    if (!openai) {
      return this.getFallbackPrompts(currentMood);
    }

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

  async predictMood(userHistory: unknown[]): Promise<MoodPrediction> {
    // Fallback prediction if OpenAI is not available
    if (!openai) {
      return this.getFallbackMoodPrediction(userHistory);
    }

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
      return this.getFallbackMoodPrediction(userHistory);
    }
  }

  async generateMotivationalContent(mood: string, context: string): Promise<string[]> {
    // Fallback content if OpenAI is not available
    if (!openai) {
      return this.getFallbackMotivationalContent(mood);
    }

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
      return this.getFallbackMotivationalContent(mood);
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

  private getFallbackResponse(userMessage: string, context: string): AuraAIResponse {
    const messageLower = userMessage.toLowerCase();
    const isCrisis = ['sad', 'depressed', 'anxious', 'scared', 'hopeless', 'suicidal', 'hurt', 'pain'].some(word => 
      messageLower.includes(word)
    );
    const isCelebration = ['happy', 'excited', 'proud', 'accomplished', 'grateful', 'amazing', 'wonderful'].some(word => 
      messageLower.includes(word)
    );

    let response = '';
    let type: AuraAIResponse['type'] = 'empathy';

    if (isCrisis) {
      response = "I can hear that you're going through a really tough time right now. Your feelings are completely valid, and I want you to know that you're not alone in this. Remember, it's okay to not be okay sometimes.";
      type = 'crisis_support';
    } else if (isCelebration) {
      response = "That's absolutely wonderful! I'm so proud of you! Your positive energy is contagious and inspiring. I love hearing about your wins!";
      type = 'celebration';
    } else {
      response = "I'm really glad you're sharing this with me. Your openness and honesty are such beautiful qualities. I'm here to listen and support you in whatever way feels right.";
      type = 'empathy';
    }

    return {
      response,
      mood: this.extractMood(response),
      sentiment: this.analyzeSentiment(response),
      suggestions: this.extractSuggestions(response),
      activities: this.extractActivities(response),
      priority: this.determinePriority(userMessage),
      type
    };
  }

  private getFallbackJournalAnalysis(entryText: string, mood: string, activities: string[]): JournalAnalysis {
    // Simple fallback analysis based on keywords
    const text = entryText.toLowerCase();
    const positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'grateful', 'blessed'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'depressed', 'anxious', 'worried'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    const sentiment = positiveCount > negativeCount ? 0.5 : negativeCount > positiveCount ? -0.5 : 0;
    
    return {
      mood: mood || 'neutral',
      sentiment,
      themes: this.extractThemes(entryText),
      insights: [
        'Keep journaling regularly to build self-awareness',
        'Notice patterns in your mood and activities'
      ],
      recommendations: [
        'Try to maintain a consistent journaling routine',
        'Focus on gratitude and positive experiences'
      ],
      riskFactors: negativeCount > 3 ? ['Consider reaching out for support'] : [],
      positivePatterns: positiveCount > 2 ? ['You show resilience and positivity'] : []
    };
  }

  private extractThemes(text: string): string[] {
    const themes: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('work') || lowerText.includes('job')) themes.push('work');
    if (lowerText.includes('family') || lowerText.includes('parent')) themes.push('family');
    if (lowerText.includes('friend') || lowerText.includes('social')) themes.push('relationships');
    if (lowerText.includes('health') || lowerText.includes('exercise')) themes.push('health');
    if (lowerText.includes('future') || lowerText.includes('goal')) themes.push('goals');
    
    return themes;
  }

  private getFallbackMoodPrediction(userHistory: unknown[]): MoodPrediction {
    // Simple fallback prediction based on recent entries
    const recentMoods = userHistory.slice(-5).map((entry: any) => entry.moodTag || 'neutral');
    const moodCounts = recentMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
    );
    
    return {
      predictedMood: dominantMood,
      confidence: 0.6,
      riskLevel: dominantMood === 'sad' || dominantMood === 'anxious' ? 'medium' : 'low',
      factors: ['Recent mood patterns', 'Journaling consistency'],
      recommendations: [
        'Continue your journaling practice',
        'Focus on self-care activities'
      ],
      proactiveActions: [
        'Try a 5-minute meditation',
        'Take a walk outside'
      ]
    };
  }

  private getFallbackMotivationalContent(mood: string): string[] {
    const contentByMood: Record<string, string[]> = {
      'sad': [
        "You're stronger than you know 💪",
        "This feeling is temporary - you've got this! ✨",
        "Every storm passes, and so will this 🌈"
      ],
      'happy': [
        "Your joy is contagious! Keep shining! 🌟",
        "You're absolutely crushing it! 🔥",
        "This positive energy is everything! 💫"
      ],
      'anxious': [
        "Breathe. You're safe. You're okay. 🧘‍♀️",
        "One step at a time - you've got this! 👣",
        "You're braver than you believe 💪"
      ],
      'neutral': [
        "You're exactly where you need to be 🌟",
        "Every day is a new opportunity ✨",
        "You're doing great, keep going! 💪"
      ]
    };
    
    return contentByMood[mood] || [
      "You're doing better than you think you are 💪",
      "Every small step counts - you've got this! ✨",
      "Your journey is unique and valuable 🌟"
    ];
  }
}

export const auraAI = AuraAIService.getInstance();