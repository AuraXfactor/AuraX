'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface AssessmentQuestion {
  id: string;
  text: string;
  category: 'anxiety' | 'depression' | 'personality';
  options: { value: number; text: string }[];
}

interface AssessmentResult {
  category: string;
  score: number;
  level: 'low' | 'mild' | 'moderate' | 'severe' | 'high';
  description: string;
  recommendations: string[];
}

const ANXIETY_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'anxiety_1',
    text: 'Feeling nervous, anxious, or on edge',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_2',
    text: 'Not being able to stop or control worrying',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_3',
    text: 'Worrying too much about different things',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_4',
    text: 'Trouble relaxing',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_5',
    text: 'Being so restless that it is hard to sit still',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_6',
    text: 'Becoming easily annoyed or irritable',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'anxiety_7',
    text: 'Feeling afraid as if something awful might happen',
    category: 'anxiety',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  }
];

const DEPRESSION_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'depression_1',
    text: 'Little interest or pleasure in doing things',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_2',
    text: 'Feeling down, depressed, or hopeless',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_3',
    text: 'Trouble falling or staying asleep, or sleeping too much',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_4',
    text: 'Feeling tired or having little energy',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_5',
    text: 'Poor appetite or overeating',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_6',
    text: 'Feeling bad about yourself or that you are a failure',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_7',
    text: 'Trouble concentrating on things',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_8',
    text: 'Moving or speaking so slowly that other people could have noticed',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'depression_9',
    text: 'Thoughts that you would be better off dead or of hurting yourself',
    category: 'depression',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  }
];

const PERSONALITY_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'personality_1',
    text: 'I see myself as someone who is talkative',
    category: 'personality',
    options: [
      { value: 1, text: 'Disagree strongly' },
      { value: 2, text: 'Disagree moderately' },
      { value: 3, text: 'Disagree a little' },
      { value: 4, text: 'Neither agree nor disagree' },
      { value: 5, text: 'Agree a little' },
      { value: 6, text: 'Agree moderately' },
      { value: 7, text: 'Agree strongly' }
    ]
  },
  {
    id: 'personality_2',
    text: 'I see myself as someone who is full of energy',
    category: 'personality',
    options: [
      { value: 1, text: 'Disagree strongly' },
      { value: 2, text: 'Disagree moderately' },
      { value: 3, text: 'Disagree a little' },
      { value: 4, text: 'Neither agree nor disagree' },
      { value: 5, text: 'Agree a little' },
      { value: 6, text: 'Agree moderately' },
      { value: 7, text: 'Agree strongly' }
    ]
  },
  {
    id: 'personality_3',
    text: 'I see myself as someone who generates a lot of enthusiasm',
    category: 'personality',
    options: [
      { value: 1, text: 'Disagree strongly' },
      { value: 2, text: 'Disagree moderately' },
      { value: 3, text: 'Disagree a little' },
      { value: 4, text: 'Neither agree nor disagree' },
      { value: 5, text: 'Agree a little' },
      { value: 6, text: 'Agree moderately' },
      { value: 7, text: 'Agree strongly' }
    ]
  },
  {
    id: 'personality_4',
    text: 'I see myself as someone who tends to find fault with others',
    category: 'personality',
    options: [
      { value: 1, text: 'Disagree strongly' },
      { value: 2, text: 'Disagree moderately' },
      { value: 3, text: 'Disagree a little' },
      { value: 4, text: 'Neither agree nor disagree' },
      { value: 5, text: 'Agree a little' },
      { value: 6, text: 'Agree moderately' },
      { value: 7, text: 'Agree strongly' }
    ]
  },
  {
    id: 'personality_5',
    text: 'I see myself as someone who does a thorough job',
    category: 'personality',
    options: [
      { value: 1, text: 'Disagree strongly' },
      { value: 2, text: 'Disagree moderately' },
      { value: 3, text: 'Disagree a little' },
      { value: 4, text: 'Neither agree nor disagree' },
      { value: 5, text: 'Agree a little' },
      { value: 6, text: 'Agree moderately' },
      { value: 7, text: 'Agree strongly' }
    ]
  }
];

export default function AssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentAssessment, setCurrentAssessment] = useState<'anxiety' | 'depression' | 'personality' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const getCurrentQuestions = () => {
    switch (currentAssessment) {
      case 'anxiety': return ANXIETY_QUESTIONS;
      case 'depression': return DEPRESSION_QUESTIONS;
      case 'personality': return PERSONALITY_QUESTIONS;
      default: return [];
    }
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    const questions = getCurrentQuestions();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Assessment complete, calculate results
      calculateResults();
    }
  };

  const calculateResults = () => {
    const questions = getCurrentQuestions();
    const categoryAnswers = questions.map(q => answers[q.id] || 0);
    const totalScore = categoryAnswers.reduce((sum, score) => sum + score, 0);
    
    let level: 'low' | 'mild' | 'moderate' | 'severe' | 'high';
    let description: string;
    let recommendations: string[];

    if (currentAssessment === 'anxiety') {
      if (totalScore <= 4) {
        level = 'low';
        description = 'Minimal anxiety symptoms (GAD-7 Score: 0-4)';
        recommendations = [
          'Continue your current wellness routine',
          'Practice mindfulness and stress management',
          'Maintain regular sleep and exercise'
        ];
      } else if (totalScore <= 9) {
        level = 'mild';
        description = 'Mild anxiety symptoms (GAD-7 Score: 5-9)';
        recommendations = [
          'Practice breathing exercises daily',
          'Consider journaling to process thoughts',
          'Maintain regular sleep schedule',
          'Try relaxation techniques',
          'Consider speaking with a mental health professional if symptoms persist'
        ];
      } else if (totalScore <= 14) {
        level = 'moderate';
        description = 'Moderate anxiety symptoms (GAD-7 Score: 10-14)';
        recommendations = [
          'Consider speaking with a mental health professional',
          'Practice daily mindfulness meditation',
          'Limit caffeine and alcohol intake',
          'Establish a consistent daily routine',
          'Try progressive muscle relaxation',
          'Consider therapy or counseling'
        ];
      } else {
        level = 'severe';
        description = 'Severe anxiety symptoms (GAD-7 Score: 15-21)';
        recommendations = [
          'Seek professional mental health support immediately',
          'Consider therapy or counseling',
          'Practice daily breathing exercises',
          'Limit stress triggers when possible',
          'Consider medication consultation with a doctor',
          'Contact crisis resources if needed: 988 or Text HOME to 741741'
        ];
      }
    } else if (currentAssessment === 'depression') {
      if (totalScore <= 4) {
        level = 'low';
        description = 'Minimal depression symptoms (PHQ-9 Score: 0-4)';
        recommendations = [
          'Continue your current wellness routine',
          'Maintain social connections',
          'Engage in activities you enjoy'
        ];
      } else if (totalScore <= 9) {
        level = 'mild';
        description = 'Mild depression symptoms (PHQ-9 Score: 5-9)';
        recommendations = [
          'Increase physical activity',
          'Maintain regular sleep schedule',
          'Connect with friends and family',
          'Try journaling or creative activities',
          'Consider speaking with a mental health professional if symptoms persist'
        ];
      } else if (totalScore <= 14) {
        level = 'moderate';
        description = 'Moderate depression symptoms (PHQ-9 Score: 10-14)';
        recommendations = [
          'Consider speaking with a mental health professional',
          'Establish a daily routine',
          'Practice self-compassion',
          'Engage in regular exercise',
          'Consider therapy or counseling'
        ];
      } else if (totalScore <= 19) {
        level = 'moderate';
        description = 'Moderately severe depression symptoms (PHQ-9 Score: 15-19)';
        recommendations = [
          'Seek professional mental health support immediately',
          'Consider therapy or counseling',
          'Reach out to trusted friends or family',
          'Consider medication consultation with a doctor',
          'Practice daily self-care activities',
          'Contact crisis resources if needed: 988 or Text HOME to 741741'
        ];
      } else {
        level = 'severe';
        description = 'Severe depression symptoms (PHQ-9 Score: 20-27)';
        recommendations = [
          'Seek professional mental health support immediately',
          'Contact emergency services if having thoughts of self-harm',
          'Consider therapy or counseling',
          'Reach out to trusted friends or family',
          'Consider medication consultation with a doctor',
          'Contact crisis resources immediately: 988 or Text HOME to 741741'
        ];
      }
    } else {
      // Personality assessment
      const avgScore = totalScore / questions.length;
      if (avgScore <= 3) {
        level = 'low';
        description = 'Lower scores on this personality dimension';
      } else if (avgScore <= 5) {
        level = 'moderate';
        description = 'Moderate scores on this personality dimension';
      } else {
        level = 'high';
        description = 'Higher scores on this personality dimension';
      }
      recommendations = [
        'This is a personality assessment, not a clinical tool',
        'Consider how these traits affect your daily life',
        'Reflect on your strengths and areas for growth'
      ];
    }

    const result: AssessmentResult = {
      category: currentAssessment!,
      score: totalScore,
      level,
      description,
      recommendations
    };

    setResults(prev => [...prev, result]);
    setShowResults(true);
  };

  const startAssessment = (type: 'anxiety' | 'depression' | 'personality') => {
    setCurrentAssessment(type);
    setCurrentQuestion(0);
    setAnswers({});
    setResults([]);
    setShowResults(false);
  };

  const resetAssessment = () => {
    setCurrentAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setResults([]);
    setShowResults(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Assessment Results 📊</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your personalized mental health insights
            </p>
          </div>

          <div className="space-y-6">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold capitalize">{result.category} Assessment</h2>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    result.level === 'low' ? 'bg-green-100 text-green-800' :
                    result.level === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                    result.level === 'moderate' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.level.toUpperCase()}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">Score: {result.score}</div>
                  <p className="text-gray-600 dark:text-gray-300">{result.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Recommendations:</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 space-y-4">
            <button
              onClick={resetAssessment}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition"
            >
              Take Another Assessment
            </button>
            <div className="flex justify-center gap-4">
              <Link href="/chat" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                🤖 AI Support
              </Link>
              <Link href="/mood-tracker" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                📊 Mood Tracker
              </Link>
              <Link href="/therapy-support" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                🫂 Professional Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentAssessment) {
    const questions = getCurrentQuestions();
    const question = questions[currentQuestion];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 capitalize">{currentAssessment} Assessment</h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-6">{question.text}</h2>
            
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    <span className="text-sm text-gray-500">({option.value})</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Mental Health Assessment 🧠</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Take our comprehensive assessments to better understand your mental health and get personalized recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition"
          >
            <div className="text-4xl mb-4">😰</div>
            <h2 className="text-2xl font-bold mb-3">Anxiety Assessment</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Evaluate your anxiety levels and get personalized coping strategies.
            </p>
            <button
              onClick={() => startAssessment('anxiety')}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full hover:from-red-600 hover:to-pink-600 transition"
            >
              Start Assessment
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition"
          >
            <div className="text-4xl mb-4">😔</div>
            <h2 className="text-2xl font-bold mb-3">Depression Assessment</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Assess your mood and emotional wellbeing with evidence-based questions.
            </p>
            <button
              onClick={() => startAssessment('depression')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition"
            >
              Start Assessment
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition"
          >
            <div className="text-4xl mb-4">🧩</div>
            <h2 className="text-2xl font-bold mb-3">Personality Traits</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Discover your personality patterns and how they affect your wellbeing.
            </p>
            <button
              onClick={() => startAssessment('personality')}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition"
            >
              Start Assessment
            </button>
          </motion.div>
        </div>

        <div className="mt-12 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              📚 Assessment Sources & References
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p><strong>Anxiety Assessment:</strong> Based on GAD-7 (Generalized Anxiety Disorder 7-item scale) - Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of internal medicine, 166(10), 1092-1097.</p>
              <p><strong>Depression Assessment:</strong> Based on PHQ-9 (Patient Health Questionnaire-9) - Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of general internal medicine, 16(9), 606-613.</p>
              <p><strong>Personality Assessment:</strong> Based on Big Five personality traits (OCEAN model) - Costa, P. T., & McCrae, R. R. (1992). NEO PI-R professional manual. Psychological Assessment Resources.</p>
              <p><strong>Clinical Framework:</strong> All assessments align with DSM-5 diagnostic criteria for mental health disorders.</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
              ⚠️ Important Clinical Disclaimers
            </h3>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-3">
              <p><strong>NOT A DIAGNOSIS:</strong> These assessments are screening tools only and cannot diagnose any mental health condition. Only qualified mental health professionals can provide formal diagnoses.</p>
              <p><strong>SEEK PROFESSIONAL HELP:</strong> If you're experiencing thoughts of self-harm, suicide, or severe mental health symptoms, please contact emergency services (911) or a mental health professional immediately.</p>
              <p><strong>CRISIS RESOURCES:</strong> National Suicide Prevention Lifeline: 988, Crisis Text Line: Text HOME to 741741</p>
              <p><strong>PROFESSIONAL EVALUATION:</strong> Consider these results as a starting point for discussion with a qualified mental health professional, not as a substitute for professional evaluation.</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              💡 How to Use These Results
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <p>• Share your results with a mental health professional for proper evaluation</p>
              <p>• Use results to start conversations about your mental health</p>
              <p>• Track changes over time by retaking assessments periodically</p>
              <p>• Remember that mental health is complex and these tools are just one piece of the puzzle</p>
              <p>• Consider the recommendations as starting points, not definitive treatment plans</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}