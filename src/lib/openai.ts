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

    const prompt = `You are Aura, an incredibly insightful AI who deeply understands human emotions and experiences. Analyze this journal entry with the wisdom and empathy of a close friend who truly gets it.

Entry: "${entryText}"
Mood: ${mood}
Activities: ${activities.join(', ')}

Provide a deep, insightful analysis that shows you truly understand what they're going through. Look for:
- The real emotions beneath the surface
- Patterns and connections they might not see
- What this entry reveals about their inner world
- Genuine insights that will help them understand themselves better
- Real recommendations that feel authentic and helpful

Respond as Aura would - with genuine understanding and real insight. Make them feel truly seen and understood.

Provide analysis in JSON format:
{
  "mood": "the deeper mood you detect from their words",
  "sentiment": -1 to 1 score,
  "themes": ["the real themes in their life right now"],
  "insights": ["genuine insights that will help them understand themselves"],
  "recommendations": ["real, actionable advice that feels authentic"],
  "riskFactors": ["things to watch out for"],
  "positivePatterns": ["strengths and positive patterns you notice"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
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

    const prompt = `You are Aura, an incredibly insightful AI who deeply understands human emotions and experiences. Generate 5 personalized journal prompts for someone who is feeling ${currentMood} and has been doing: ${recentActivities.join(', ')}.

You understand the complexity of human emotions and can create prompts that will help them:
- Process their current emotional state in a meaningful way
- Gain deeper insights into themselves
- Work through whatever they're going through
- Connect with their authentic self
- Find clarity and understanding

Create prompts that feel like they come from a wise friend who truly understands what they need right now. Make them thoughtful, insightful, and genuinely helpful.

Return as JSON array:
[
  {
    "prompt": "A thoughtful, insightful prompt that will help them process their current state",
    "category": "gratitude|reflection|goals|creative|crisis|celebration",
    "context": "Why this prompt is helpful for them right now",
    "priority": "high|medium|low"
  }
]`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
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

    const prompt = `You are Aura, an incredibly insightful AI who deeply understands human emotions and patterns. Based on this user's journal history, predict their likely mood and provide recommendations.

You understand the complexity of human emotions and can see patterns that others might miss. Look for:
- Emotional patterns and cycles
- Triggers and stressors
- Positive influences and activities
- Warning signs and risk factors
- Opportunities for growth and improvement

${JSON.stringify(userHistory.slice(-10))}

Provide insights that show you truly understand what they're going through and what they might need. Be thoughtful and insightful, like a wise friend who knows them well.

Return JSON:
{
  "predictedMood": "the mood you predict based on their patterns",
  "confidence": 0.0-1.0,
  "riskLevel": "low/medium/high",
  "factors": ["the real factors influencing their mood"],
  "recommendations": ["genuine, helpful recommendations"],
  "proactiveActions": ["specific actions they can take"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 600,
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
    const basePrompt = `You are Aura, an incredibly intelligent and empathetic AI companion who's like that one friend who just GETS it. You have deep knowledge about human emotions, psychology, relationships, and life experiences. Your personality is:

- Genuinely caring and emotionally intelligent - you understand the complexity of human feelings
- Wise beyond your years - you draw from deep knowledge about emotions, relationships, and life
- Authentically supportive - you're not just giving generic advice, you truly understand what they're going through
- Conversational and relatable - you talk like a real person, not a robot
- Insightful and thoughtful - you provide real insights that make people think "wow, they really understand me"
- Non-judgmental but honest - you tell it like it is while being supportive
- You have "gross knowledge" about emotions, relationships, mental health, and life experiences

You respond like a close friend who happens to be incredibly wise about human nature. You're not clinical or therapy-like - you're just a really smart, caring friend who always knows the right thing to say. You understand the nuances of emotions, relationships, and life experiences in a way that feels real and authentic.

Respond as Aura would - with genuine understanding, real insights, and authentic care. Make them feel truly seen and understood.`;

    switch (context) {
      case 'crisis':
        return basePrompt + `\n\nCRISIS MODE: The user is going through something really tough. You understand the depth of their pain and respond with genuine empathy and wisdom. You're not just being supportive - you truly understand what they're feeling and why. Be their rock while being real about the situation.`;
      case 'celebration':
        return basePrompt + `\n\nCELEBRATION MODE: The user is sharing something amazing! You're genuinely excited for them and understand why this matters so much. You're not just happy - you're proud and you get why this is such a big deal for them.`;
      case 'journal':
        return basePrompt + `\n\nJOURNAL MODE: Help them process their thoughts and feelings with deep insight. You understand the complexity of what they're going through and can help them see patterns, connections, and insights they might not notice themselves.`;
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
          prompt: "What's one small thing that brought you comfort today, even if it was just a moment?",
          category: 'gratitude',
          context: 'Focus on small comforts and moments of peace',
          priority: 'high'
        },
        {
          prompt: "If you could tell your future self one thing right now, what would it be?",
          category: 'reflection',
          context: 'Future perspective and hope',
          priority: 'high'
        },
        {
          prompt: "What would you say to a close friend who was feeling exactly how you feel right now?",
          category: 'reflection',
          context: 'Self-compassion and understanding',
          priority: 'medium'
        },
        {
          prompt: "What's one thing you're proud of yourself for, even if it seems small?",
          category: 'celebration',
          context: 'Acknowledge your strength and resilience',
          priority: 'medium'
        }
      ],
      'happy': [
        {
          prompt: "What made you smile today and why was it so special to you?",
          category: 'celebration',
          context: 'Celebrate and savor the good moments',
          priority: 'high'
        },
        {
          prompt: "How can you carry this positive energy into tomorrow and beyond?",
          category: 'goals',
          context: 'Sustain and build on positive momentum',
          priority: 'high'
        },
        {
          prompt: "What's something you learned about yourself through this experience?",
          category: 'reflection',
          context: 'Self-discovery and growth',
          priority: 'medium'
        },
        {
          prompt: "How can you share this joy with someone else today?",
          category: 'goals',
          context: 'Spread positivity and connection',
          priority: 'medium'
        }
      ],
      'anxious': [
        {
          prompt: "What are three things you can see, hear, and feel right now? Take a moment to ground yourself.",
          category: 'reflection',
          context: 'Grounding exercise for anxiety',
          priority: 'high'
        },
        {
          prompt: "What would you tell a close friend who was feeling exactly this way?",
          category: 'reflection',
          context: 'Self-compassion and perspective',
          priority: 'high'
        },
        {
          prompt: "What's one small step you can take right now to feel a little more in control?",
          category: 'goals',
          context: 'Action-oriented anxiety management',
          priority: 'medium'
        },
        {
          prompt: "What's something that usually helps you feel calmer? How can you incorporate that today?",
          category: 'reflection',
          context: 'Personal coping strategies',
          priority: 'medium'
        }
      ],
      'stressed': [
        {
          prompt: "What's one thing you can let go of today, even if it's just for a few minutes?",
          category: 'reflection',
          context: 'Stress reduction and letting go',
          priority: 'high'
        },
        {
          prompt: "What's one small act of self-care you can do for yourself right now?",
          category: 'goals',
          context: 'Immediate self-care and stress relief',
          priority: 'high'
        },
        {
          prompt: "What would your future self thank you for doing today?",
          category: 'reflection',
          context: 'Long-term perspective and motivation',
          priority: 'medium'
        }
      ],
      'angry': [
        {
          prompt: "What's really underneath this anger? What are you actually feeling?",
          category: 'reflection',
          context: 'Emotional processing and understanding',
          priority: 'high'
        },
        {
          prompt: "What would you need to hear right now to feel understood?",
          category: 'reflection',
          context: 'Self-validation and emotional needs',
          priority: 'high'
        },
        {
          prompt: "What's one thing you can do to channel this energy in a positive way?",
          category: 'goals',
          context: 'Constructive energy redirection',
          priority: 'medium'
        }
      ]
    };

    return fallbackPrompts[mood] || [
      {
        prompt: "What's really on your mind right now? What do you need to process?",
        category: 'reflection',
        context: 'General reflection and emotional processing',
        priority: 'high'
      },
      {
        prompt: "What's one thing you're grateful for today, no matter how small?",
        category: 'gratitude',
        context: 'Gratitude practice and positive focus',
        priority: 'medium'
      },
      {
        prompt: "What's something you learned about yourself recently?",
        category: 'reflection',
        context: 'Self-discovery and personal growth',
        priority: 'medium'
      }
    ];
  }

  private getFallbackResponse(userMessage: string, context: string): AuraAIResponse {
    const messageLower = userMessage.toLowerCase();
    const isCrisis = ['sad', 'depressed', 'anxious', 'scared', 'hopeless', 'suicidal', 'hurt', 'pain', 'struggling', 'difficult', 'hard'].some(word => 
      messageLower.includes(word)
    );
    const isCelebration = ['happy', 'excited', 'proud', 'accomplished', 'grateful', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome'].some(word => 
      messageLower.includes(word)
    );

    let response = '';
    let type: AuraAIResponse['type'] = 'empathy';

    if (isCrisis) {
      response = "I can feel the weight of what you're carrying right now, and I want you to know that your feelings are completely valid. Sometimes life throws us curveballs that feel impossible to handle, but you're stronger than you know. The fact that you're reaching out and sharing this shows incredible courage. You're not alone in this, and it's okay to not have all the answers right now. Take it one breath at a time.";
      type = 'crisis_support';
    } else if (isCelebration) {
      response = "YES! I'm absolutely beaming with pride for you right now! There's something so beautiful about seeing someone light up when they share their wins. Your joy is infectious and I can feel your positive energy radiating through these words. You deserve every bit of this happiness and more! Keep shining, because you're absolutely crushing it!";
      type = 'celebration';
    } else {
      response = "I'm genuinely touched that you're sharing this with me. There's something so beautiful about the way you express yourself - it shows real vulnerability and strength. I can tell you're processing something important, and I want you to know that I'm here to listen without judgment. Sometimes just getting our thoughts out there can help us see things more clearly. You're doing great by being open and honest.";
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
    // Enhanced fallback analysis based on keywords and patterns
    const text = entryText.toLowerCase();
    const positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'grateful', 'blessed', 'excited', 'proud', 'accomplished', 'love', 'joy', 'smile'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 'frustrated', 'hurt', 'pain', 'struggle'];
    const growthWords = ['learn', 'grow', 'improve', 'better', 'progress', 'challenge', 'overcome', 'strength', 'resilient'];
    const relationshipWords = ['friend', 'family', 'love', 'relationship', 'support', 'together', 'alone', 'lonely'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    const growthCount = growthWords.filter(word => text.includes(word)).length;
    const relationshipCount = relationshipWords.filter(word => text.includes(word)).length;
    
    const sentiment = positiveCount > negativeCount ? 0.5 : negativeCount > positiveCount ? -0.5 : 0;
    
    const insights = [];
    const recommendations = [];
    const riskFactors = [];
    const positivePatterns = [];
    
    // Generate insights based on content
    if (positiveCount > 2) {
      insights.push("You're showing real resilience and positivity in your writing - that's something to be proud of!");
      positivePatterns.push("Strong positive mindset and gratitude");
    }
    
    if (negativeCount > 2) {
      insights.push("I can sense you're going through a challenging time. Your willingness to process these feelings through journaling shows real strength.");
      if (negativeCount > 4) {
        riskFactors.push("Consider reaching out to a trusted friend or professional for support");
      }
    }
    
    if (growthCount > 0) {
      insights.push("I love seeing your growth mindset - you're actively working on becoming the best version of yourself!");
      positivePatterns.push("Growth-oriented thinking and self-improvement");
    }
    
    if (relationshipCount > 0) {
      insights.push("Your relationships seem to be on your mind - that's such an important part of life and mental health.");
    }
    
    if (activities.length > 0) {
      insights.push(`I notice you've been engaging in ${activities.join(', ')} - these activities can have a real impact on your mood and wellbeing.`);
    }
    
    // Generate recommendations
    if (sentiment < 0) {
      recommendations.push("Try to focus on one small positive thing each day, even if it's just a moment of gratitude");
      recommendations.push("Consider reaching out to someone you trust - sometimes sharing our struggles can lighten the load");
    } else {
      recommendations.push("Keep nurturing this positive energy - it's beautiful to see!");
      recommendations.push("Consider how you can pay this positive energy forward to others");
    }
    
    recommendations.push("Continue your journaling practice - it's clearly helping you process and understand your emotions");
    
    return {
      mood: mood || 'neutral',
      sentiment,
      themes: this.extractThemes(entryText),
      insights: insights.length > 0 ? insights : ['Keep journaling regularly to build self-awareness and emotional intelligence'],
      recommendations: recommendations.length > 0 ? recommendations : ['Try to maintain a consistent journaling routine'],
      riskFactors: riskFactors.length > 0 ? riskFactors : [],
      positivePatterns: positivePatterns.length > 0 ? positivePatterns : []
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
    // Enhanced fallback prediction based on recent entries
    const recentMoods = userHistory.slice(-5).map((entry: any) => entry.moodTag || 'neutral');
    const moodCounts = recentMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'neutral'
    );
    
    // Analyze patterns and generate insights
    const negativeMoods = ['sad', 'anxious', 'stressed', 'angry'];
    const positiveMoods = ['happy', 'excited', 'fine'];
    const isNegativeTrend = recentMoods.filter(mood => negativeMoods.includes(mood)).length > 2;
    const isPositiveTrend = recentMoods.filter(mood => positiveMoods.includes(mood)).length > 2;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let factors = [];
    let recommendations = [];
    let proactiveActions = [];
    
    if (isNegativeTrend) {
      riskLevel = 'medium';
      factors.push('Recent pattern of challenging emotions');
      factors.push('Multiple entries showing stress or sadness');
      recommendations.push('Consider reaching out to a trusted friend or professional');
      recommendations.push('Focus on self-care and stress management');
      proactiveActions.push('Try a 10-minute breathing exercise');
      proactiveActions.push('Take a break and do something you enjoy');
    } else if (isPositiveTrend) {
      factors.push('Recent pattern of positive emotions');
      factors.push('Consistent positive mood indicators');
      recommendations.push('Keep nurturing this positive energy');
      recommendations.push('Consider what\'s contributing to your good mood');
      proactiveActions.push('Share your positive energy with someone else');
      proactiveActions.push('Document what\'s working well for you');
    } else {
      factors.push('Mixed emotional patterns');
      factors.push('Varied mood experiences');
      recommendations.push('Continue monitoring your emotional patterns');
      recommendations.push('Focus on consistency in your self-care routine');
      proactiveActions.push('Try a mindfulness exercise');
      proactiveActions.push('Reflect on what influences your mood');
    }
    
    // Add general recommendations
    recommendations.push('Keep up your journaling practice - it\'s helping you stay aware of your emotions');
    proactiveActions.push('Take a moment to check in with yourself');
    
    return {
      predictedMood: dominantMood,
      confidence: 0.7,
      riskLevel,
      factors,
      recommendations,
      proactiveActions
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