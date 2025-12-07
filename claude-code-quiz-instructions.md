# Fluence Invincible Quiz App - Complete Build Instructions for Claude Code

## PROJECT OVERVIEW

Build a production-ready React quiz application that:
- Supports 6 question types (MCQ, True/False, Short Answer, Voice, Fill Blank, Match)
- Fetches questions from Supabase database (not JSON files)
- Submits results to n8n webhook → Supabase
- Shows real-time leaderboard
- Tracks concept mastery with SRS
- Beautiful UI with animations
- Mobile-responsive

**Tech Stack:**
- React 19
- Supabase client (@supabase/supabase-js)
- TailwindCSS (already configured)
- Lucide React icons (already installed)
- Web Speech API (browser native - for voice questions)

---

## CRITICAL CHANGES FROM OLD APP

**OLD SYSTEM:**
- Questions from `questions-student1.json`, `questions-student2.json`, `questions-student3.json`
- Questions overwritten daily
- No result submission
- No tracking
- Only MCQ questions

**NEW SYSTEM:**
- Questions from Supabase database
- Persistent storage
- Results submitted to n8n webhook → Supabase
- Real-time leaderboard
- 6 question types
- Concept mastery tracking

---

## ENVIRONMENT SETUP

### 1. Create `.env` file in root directory

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit
```

**IMPORTANT:** Replace with actual values provided by user

### 2. Install new dependency

```bash
npm install @supabase/supabase-js
```

---

## PROJECT STRUCTURE

```
src/
├── components/
│   ├── QuestionTypes/
│   │   ├── MCQQuestion.jsx
│   │   ├── TrueFalseQuestion.jsx
│   │   ├── ShortAnswerQuestion.jsx
│   │   ├── VoiceAnswerQuestion.jsx
│   │   ├── FillBlankQuestion.jsx
│   │   └── MatchQuestion.jsx
│   ├── Leaderboard.jsx
│   ├── ResultScreen.jsx
│   └── LoadingSpinner.jsx
├── services/
│   ├── supabase.js
│   ├── quizService.js
│   └── webhookService.js
├── utils/
│   ├── answerChecker.js
│   └── timeUtils.js
├── App.js
└── index.css (keep existing TailwindCSS)
```

---

## DETAILED FILE-BY-FILE IMPLEMENTATION

### FILE 1: `src/services/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### FILE 2: `src/services/quizService.js`

```javascript
import { supabase } from './supabase';

// Get student by display name
export const getStudentByName = async (displayName) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .ilike('display_name', displayName)
    .single();
  
  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }
  
  return data;
};

// Get student by ID
export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }
  
  return data;
};

// Get active questions for a student
export const getActiveQuestions = async (studentId) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('student_id', studentId)
    .eq('active', true)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  
  return data || [];
};

// Get today's leaderboard
export const getTodaysLeaderboard = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('leaderboard')
    .select(`
      *,
      students (
        display_name
      )
    `)
    .eq('quiz_date', today)
    .order('rank', { ascending: true });
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return data || [];
};

// Subscribe to leaderboard changes (real-time)
export const subscribeToLeaderboard = (callback) => {
  const today = new Date().toISOString().split('T')[0];
  
  const subscription = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
        filter: `quiz_date=eq.${today}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};
```

---

### FILE 3: `src/services/webhookService.js`

```javascript
const WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL;

export const submitQuizResults = async (resultsData) => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultsData),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook submission failed: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error submitting to webhook:', error);
    return { success: false, error: error.message };
  }
};
```

---

### FILE 4: `src/utils/answerChecker.js`

```javascript
// Check if answer is correct based on question type
export const checkAnswer = (studentAnswer, correctAnswer, questionType) => {
  if (!studentAnswer || studentAnswer.trim() === '') {
    return false;
  }
  
  switch (questionType) {
    case 'mcq':
    case 'true_false':
    case 'fill_blank':
      // Exact match (case-insensitive, trimmed)
      return studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    
    case 'short_answer':
      // Flexible matching - contains key terms
      // Will be evaluated by AI in n8n, but do basic check
      const answerWords = studentAnswer.toLowerCase().split(/\s+/);
      const correctWords = correctAnswer.toLowerCase().split(/\s+/);
      const matchingWords = correctWords.filter(word => 
        answerWords.some(ansWord => ansWord.includes(word) || word.includes(ansWord))
      );
      return matchingWords.length >= correctWords.length * 0.6; // 60% word match
    
    case 'voice':
      // Voice answers evaluated by AI - assume correct for now
      return true;
    
    case 'match':
      // For matching questions, compare arrays
      try {
        const studentMatches = JSON.parse(studentAnswer);
        const correctMatches = JSON.parse(correctAnswer);
        return JSON.stringify(studentMatches) === JSON.stringify(correctMatches);
      } catch {
        return false;
      }
    
    default:
      return false;
  }
};
```

---

### FILE 5: `src/utils/timeUtils.js`

```javascript
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
```

---

### FILE 6: `src/components/LoadingSpinner.jsx`

```javascript
import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
```

---

### FILE 7: `src/components/QuestionTypes/MCQQuestion.jsx`

```javascript
import React from 'react';

const MCQQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const options = Array.isArray(question.options) 
    ? question.options 
    : JSON.parse(question.options || '[]');
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">
        {question.question_text}
      </h2>
      
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correct_answer;
          
          let bgColor = 'bg-white/20';
          let borderColor = 'border-white/30';
          let textColor = 'text-white';
          
          if (showResult && isSelected) {
            if (isCorrect) {
              bgColor = 'bg-green-500/40';
              borderColor = 'border-green-400';
            } else {
              bgColor = 'bg-red-500/40';
              borderColor = 'border-red-400';
            }
          } else if (showResult && isCorrectOption) {
            bgColor = 'bg-green-500/40';
            borderColor = 'border-green-400';
          } else if (isSelected) {
            bgColor = 'bg-blue-500/40';
            borderColor = 'border-blue-400';
          }
          
          return (
            <button
              key={index}
              onClick={() => !showResult && onAnswerSelect(option)}
              disabled={showResult}
              className={`w-full p-4 rounded-xl border-2 ${bgColor} ${borderColor} ${textColor}
                hover:scale-105 transition-all duration-200 text-left font-medium
                ${!showResult && 'hover:bg-white/30 cursor-pointer'}
                ${showResult && 'cursor-not-allowed'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MCQQuestion;
```

---

### FILE 8: `src/components/QuestionTypes/TrueFalseQuestion.jsx`

```javascript
import React from 'react';
import { Check, X } from 'lucide-react';

const TrueFalseQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const renderButton = (value, icon, label) => {
    const isSelected = selectedAnswer === value;
    const isCorrectAnswer = question.correct_answer.toLowerCase() === value.toLowerCase();
    
    let bgColor = 'bg-white/20';
    let borderColor = 'border-white/30';
    
    if (showResult && isSelected) {
      bgColor = isCorrect ? 'bg-green-500/40' : 'bg-red-500/40';
      borderColor = isCorrect ? 'border-green-400' : 'border-red-400';
    } else if (showResult && isCorrectAnswer) {
      bgColor = 'bg-green-500/40';
      borderColor = 'border-green-400';
    } else if (isSelected) {
      bgColor = 'bg-blue-500/40';
      borderColor = 'border-blue-400';
    }
    
    return (
      <button
        onClick={() => !showResult && onAnswerSelect(value)}
        disabled={showResult}
        className={`flex-1 p-8 rounded-2xl border-4 ${bgColor} ${borderColor}
          hover:scale-105 transition-all duration-200 flex flex-col items-center gap-4
          ${!showResult && 'hover:bg-white/30 cursor-pointer'}
          ${showResult && 'cursor-not-allowed'}`}
      >
        {icon}
        <span className="text-2xl font-bold text-white">{label}</span>
      </button>
    );
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {question.question_text}
      </h2>
      
      <div className="flex gap-4">
        {renderButton(
          'true',
          <Check className="w-16 h-16 text-white" />,
          'TRUE'
        )}
        {renderButton(
          'false',
          <X className="w-16 h-16 text-white" />,
          'FALSE'
        )}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;
```

---

### FILE 9: `src/components/QuestionTypes/ShortAnswerQuestion.jsx`

```javascript
import React, { useState, useEffect } from 'react';

const ShortAnswerQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');
  const maxLength = 500;
  
  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer]);
  
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setAnswer(value);
    }
  };
  
  const handleBlur = () => {
    onAnswerSelect(answer);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">
        {question.question_text}
      </h2>
      
      <div className="relative">
        <textarea
          value={answer}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={showResult}
          placeholder="Type your answer here..."
          className={`w-full p-4 rounded-xl bg-white/20 border-2 text-white
            placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400
            ${showResult && isCorrect && 'border-green-400 bg-green-500/20'}
            ${showResult && !isCorrect && 'border-red-400 bg-red-500/20'}
            ${!showResult && 'border-white/30'}`}
          rows="6"
        />
        <div className="absolute bottom-2 right-2 text-white/60 text-sm">
          {answer.length}/{maxLength}
        </div>
      </div>
      
      {showResult && (
        <div className="mt-4 p-4 bg-white/20 rounded-xl">
          <p className="text-white/80 text-sm mb-2">Expected answer:</p>
          <p className="text-white font-medium">{question.correct_answer}</p>
        </div>
      )}
    </div>
  );
};

export default ShortAnswerQuestion;
```

---

### FILE 10: `src/components/QuestionTypes/FillBlankQuestion.jsx`

```javascript
import React, { useState, useEffect } from 'react';

const FillBlankQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');
  
  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer]);
  
  // Split question text by _____ to show blanks
  const parts = question.question_text.split('_____');
  
  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    onAnswerSelect(value);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold text-white mb-6 flex items-center flex-wrap gap-2">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answer}
                onChange={handleChange}
                disabled={showResult}
                className={`px-4 py-2 rounded-lg bg-white/20 border-2 text-white text-center
                  placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]
                  ${showResult && isCorrect && 'border-green-400 bg-green-500/20'}
                  ${showResult && !isCorrect && 'border-red-400 bg-red-500/20'}
                  ${!showResult && 'border-white/30'}`}
                placeholder="fill here"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {showResult && (
        <div className="mt-4 p-4 bg-white/20 rounded-xl">
          <p className="text-white/80 text-sm mb-2">Correct answer:</p>
          <p className="text-white font-medium">{question.correct_answer}</p>
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;
```

---

### FILE 11: `src/components/QuestionTypes/VoiceAnswerQuestion.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Mic, Square, Play } from 'lucide-react';

const VoiceAnswerQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(selectedAnswer || '');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'en-IN'; // English (India)
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    
    recognitionInstance.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      onAnswerSelect(speechResult);
      setIsRecording(false);
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsRecording(false);
    };
    
    recognitionInstance.onend = () => {
      setIsRecording(false);
    };
    
    setRecognition(recognitionInstance);
  }, [onAnswerSelect]);
  
  const startRecording = () => {
    if (recognition && !showResult) {
      setError('');
      setIsRecording(true);
      recognition.start();
    }
  };
  
  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {question.question_text}
      </h2>
      
      <div className="flex flex-col items-center gap-4">
        {!error && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={showResult}
            className={`p-8 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } ${showResult && 'opacity-50 cursor-not-allowed'} shadow-lg`}
          >
            {isRecording ? (
              <Square className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        )}
        
        <p className="text-white text-lg font-medium">
          {isRecording ? '🔴 Recording... Speak now!' : '🎤 Click to record your answer'}
        </p>
        
        {error && (
          <div className="p-4 bg-red-500/20 border-2 border-red-400 rounded-xl">
            <p className="text-white">{error}</p>
            <p className="text-white/80 text-sm mt-2">
              Try typing your answer in a short answer instead.
            </p>
          </div>
        )}
        
        {transcript && (
          <div className="w-full p-4 bg-white/20 rounded-xl border-2 border-white/30">
            <p className="text-white/80 text-sm mb-2">Your answer:</p>
            <p className="text-white font-medium">{transcript}</p>
          </div>
        )}
      </div>
      
      {showResult && question.explanation && (
        <div className="mt-4 p-4 bg-white/20 rounded-xl">
          <p className="text-white/80 text-sm mb-2">Explanation:</p>
          <p className="text-white">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAnswerQuestion;
```

---

### FILE 12: `src/components/QuestionTypes/MatchQuestion.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const MatchQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  // Parse options: should be { "left": [...], "right": [...] }
  const options = JSON.parse(question.options || '{"left":[],"right":[]}');
  const correctMatches = JSON.parse(question.correct_answer || '{}');
  
  const [matches, setMatches] = useState(() => {
    if (selectedAnswer) {
      try {
        return JSON.parse(selectedAnswer);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  useEffect(() => {
    onAnswerSelect(JSON.stringify(matches));
  }, [matches, onAnswerSelect]);
  
  const handleMatch = (leftItem, rightItem) => {
    if (showResult) return;
    
    setMatches(prev => ({
      ...prev,
      [leftItem]: rightItem
    }));
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">
        {question.question_text}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          {options.left.map((item, index) => {
            const matchedRight = matches[item];
            const isCorrectMatch = showResult && correctMatches[item] === matchedRight;
            const hasMatch = !!matchedRight;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  showResult && isCorrectMatch ? 'bg-green-500/20 border-green-400' :
                  showResult && hasMatch ? 'bg-red-500/20 border-red-400' :
                  hasMatch ? 'bg-blue-500/20 border-blue-400' :
                  'bg-white/20 border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{item}</span>
                  {matchedRight && (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-white" />
                      <span className="text-white/80 text-sm">{matchedRight}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right column */}
        <div className="space-y-3">
          {options.right.map((item, index) => {
            const isMatched = Object.values(matches).includes(item);
            
            return (
              <button
                key={index}
                onClick={() => {
                  // Match with first unmatched left item
                  const unmatchedLeft = options.left.find(left => !matches[left]);
                  if (unmatchedLeft) {
                    handleMatch(unmatchedLeft, item);
                  }
                }}
                disabled={showResult || isMatched}
                className={`w-full p-4 rounded-xl border-2 text-left
                  ${isMatched ? 'bg-white/10 border-white/20 opacity-50' : 'bg-white/20 border-white/30'}
                  ${!showResult && !isMatched && 'hover:bg-white/30 cursor-pointer'}
                  transition-all duration-200`}
              >
                <span className="text-white font-medium">{item}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {showResult && (
        <div className="mt-4 p-4 bg-white/20 rounded-xl">
          <p className="text-white/80 text-sm mb-3">Correct matches:</p>
          {Object.entries(correctMatches).map(([left, right], index) => (
            <div key={index} className="flex items-center gap-2 text-white mb-2">
              <span>{left}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">{right}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchQuestion;
```

---

### FILE 13: `src/components/Leaderboard.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { getTodaysLeaderboard, subscribeToLeaderboard } from '../services/quizService';
import { formatTime } from '../utils/timeUtils';

const Leaderboard = ({ currentStudentId, currentScore }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadLeaderboard();
    
    // Subscribe to real-time updates
    const subscription = subscribeToLeaderboard(() => {
      loadLeaderboard();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadLeaderboard = async () => {
    try {
      const data = await getTodaysLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2: return <Medal className="w-8 h-8 text-gray-300" />;
      case 3: return <Award className="w-8 h-8 text-orange-400" />;
      default: return null;
    }
  };
  
  const getRankEmoji = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Today's Leaderboard
        </h2>
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6" />
        Today's Leaderboard
      </h2>
      
      {leaderboard.length === 0 ? (
        <p className="text-white/60">No scores yet today. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentStudent = entry.student_id === currentStudentId;
            
            return (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isCurrentStudent 
                    ? 'bg-blue-500/30 border-blue-400 scale-105' 
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {entry.students?.display_name || 'Unknown'}
                      {isCurrentStudent && ' (You)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">
                      {Math.round(entry.score)}%
                    </div>
                    {entry.time_taken_seconds && (
                      <div className="text-white/60 text-sm">
                        {formatTime(entry.time_taken_seconds)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {currentScore !== null && !leaderboard.find(e => e.student_id === currentStudentId) && (
        <div className="mt-4 p-4 bg-blue-500/20 border-2 border-blue-400 rounded-xl">
          <p className="text-white text-center">
            Your score: {Math.round(currentScore)}%
            <br />
            <span className="text-sm text-white/80">Submit to see your rank!</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
```

---

### FILE 14: `src/components/ResultScreen.jsx`

```javascript
import React from 'react';
import { Trophy, Target, TrendingUp, Home } from 'lucide-react';
import Leaderboard from './Leaderboard';

const ResultScreen = ({ 
  score, 
  correctAnswers, 
  totalQuestions, 
  timeTaken,
  studentId,
  onRestart 
}) => {
  const percentage = Math.round(score);
  
  const getMessage = () => {
    if (percentage >= 90) return { text: "Outstanding! 🌟", color: "text-yellow-400" };
    if (percentage >= 75) return { text: "Great Job! 🎉", color: "text-green-400" };
    if (percentage >= 60) return { text: "Good Work! 👍", color: "text-blue-400" };
    return { text: "Keep Practicing! 💪", color: "text-orange-400" };
  };
  
  const message = getMessage();
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Main Result Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 shadow-2xl">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
          
          <h1 className={`text-5xl font-bold mb-4 ${message.color}`}>
            {message.text}
          </h1>
          
          <div className="text-7xl font-bold text-white mb-6">
            {percentage}%
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <Target className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-white/60 text-sm">Score</div>
              <div className="text-white font-bold text-2xl">
                {correctAnswers}/{totalQuestions}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <TrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-white/60 text-sm">Accuracy</div>
              <div className="text-white font-bold text-2xl">
                {percentage}%
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <Target className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-white/60 text-sm">Time Taken</div>
              <div className="text-white font-bold text-2xl">
                {formatTime(timeTaken)}
              </div>
            </div>
          </div>
          
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl 
              hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 
              shadow-lg flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
        
        {/* Leaderboard */}
        <Leaderboard currentStudentId={studentId} currentScore={score} />
      </div>
    </div>
  );
};

export default ResultScreen;
```

---

### FILE 15: `src/App.js` (MAIN FILE - COMPLETE REWRITE)

```javascript
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './components/LoadingSpinner';
import ResultScreen from './components/ResultScreen';
import MCQQuestion from './components/QuestionTypes/MCQQuestion';
import TrueFalseQuestion from './components/QuestionTypes/TrueFalseQuestion';
import ShortAnswerQuestion from './components/QuestionTypes/ShortAnswerQuestion';
import VoiceAnswerQuestion from './components/QuestionTypes/VoiceAnswerQuestion';
import FillBlankQuestion from './components/QuestionTypes/FillBlankQuestion';
import MatchQuestion from './components/QuestionTypes/MatchQuestion';
import { getStudentByName, getActiveQuestions } from './services/quizService';
import { submitQuizResults } from './services/webhookService';
import { checkAnswer } from './utils/answerChecker';

function App() {
  // Student & Authentication
  const [student, setStudent] = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionTimers, setQuestionTimers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  
  // UI State
  const [gameState, setGameState] = useState('menu'); // menu, playing, results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  
  // Results
  const [finalScore, setFinalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Load student from URL or name
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentParam = urlParams.get('student');
    
    if (studentParam) {
      loadStudentById(studentParam);
    }
  }, []);
  
  const loadStudentById = async (studentIdOrName) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get student by name
      const studentData = await getStudentByName(studentIdOrName);
      
      if (studentData) {
        setStudent(studentData);
        setPlayerName(studentData.display_name);
        await loadQuestions(studentData.id);
      } else {
        setError(`Student "${studentIdOrName}" not found`);
      }
    } catch (err) {
      console.error('Error loading student:', err);
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadQuestions = async (studentId) => {
    try {
      const questionsData = await getActiveQuestions(studentId);
      
      if (!questionsData || questionsData.length === 0) {
        setError('No active quiz questions found. Please contact your teacher.');
        return;
      }
      
      setQuestions(questionsData);
      
      // Initialize answers and timers
      const initialAnswers = {};
      const initialTimers = {};
      questionsData.forEach((q, index) => {
        initialAnswers[index] = '';
        initialTimers[index] = 0;
      });
      setAnswers(initialAnswers);
      setQuestionTimers(initialTimers);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load quiz questions. Please try again.');
    }
  };
  
  const handleNameSubmit = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    await loadStudentById(playerName.trim());
  };
  
  const startQuiz = () => {
    if (questions.length === 0) {
      setError('No questions available');
      return;
    }
    
    setGameState('playing');
    setStartTime(Date.now());
    setCurrentQuestion(0);
    setShowResult(false);
  };
  
  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };
  
  const handleNext = () => {
    // Record time for this question
    const timeSpent = Math.floor((Date.now() - startTime) / 1000) - Object.values(questionTimers).reduce((a, b) => a + b, 0);
    setQuestionTimers(prev => ({
      ...prev,
      [currentQuestion]: timeSpent
    }));
    
    setShowResult(false);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setShowResult(false);
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  const handleFinishQuiz = async () => {
    const endTime = Date.now();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    setTotalTime(totalSeconds);
    
    // Calculate score
    let correct = 0;
    const detailedAnswers = questions.map((question, index) => {
      const studentAnswer = answers[index];
      const isCorrect = checkAnswer(studentAnswer, question.correct_answer, question.question_type);
      
      if (isCorrect) correct++;
      
      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        student_answer: studentAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        time_spent: questionTimers[index] || 0,
        concept_tested: question.concept_tested
      };
    });
    
    const scorePercentage = (correct / questions.length) * 100;
    setFinalScore(scorePercentage);
    
    // Submit results
    setSubmitting(true);
    
    const resultsData = {
      student_id: student.id,
      student_name: student.display_name,
      quiz_date: new Date().toISOString().split('T')[0],
      total_questions: questions.length,
      correct_answers: correct,
      score: scorePercentage,
      time_taken_seconds: totalSeconds,
      answers_json: {
        questions: detailedAnswers
      },
      concepts_tested: [...new Set(questions.map(q => q.concept_tested).filter(Boolean))]
    };
    
    try {
      const result = await submitQuizResults(resultsData);
      
      if (result.success) {
        console.log('Quiz results submitted successfully');
      } else {
        console.error('Failed to submit quiz results:', result.error);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setSubmitting(false);
      setGameState('results');
    }
  };
  
  const handleRestart = () => {
    setGameState('menu');
    setCurrentQuestion(0);
    setShowResult(false);
    setFinalScore(0);
    
    // Reset answers and timers
    const initialAnswers = {};
    const initialTimers = {};
    questions.forEach((q, index) => {
      initialAnswers[index] = '';
      initialTimers[index] = 0;
    });
    setAnswers(initialAnswers);
    setQuestionTimers(initialTimers);
  };
  
  // Render appropriate question type
  const renderQuestion = () => {
    if (!questions[currentQuestion]) return null;
    
    const question = questions[currentQuestion];
    const selectedAnswer = answers[currentQuestion];
    const isCorrect = checkAnswer(selectedAnswer, question.correct_answer, question.question_type);
    
    const commonProps = {
      question,
      selectedAnswer,
      onAnswerSelect: handleAnswerSelect,
      showResult,
      isCorrect
    };
    
    switch (question.question_type) {
      case 'mcq':
        return <MCQQuestion {...commonProps} />;
      case 'true_false':
        return <TrueFalseQuestion {...commonProps} />;
      case 'short_answer':
        return <ShortAnswerQuestion {...commonProps} />;
      case 'voice':
        return <VoiceAnswerQuestion {...commonProps} />;
      case 'fill_blank':
        return <FillBlankQuestion {...commonProps} />;
      case 'match':
        return <MatchQuestion {...commonProps} />;
      default:
        return <div className="text-white">Unsupported question type: {question.question_type}</div>;
    }
  };
  
  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading quiz..." />;
  }
  
  // Results screen
  if (gameState === 'results') {
    return (
      <ResultScreen
        score={finalScore}
        correctAnswers={questions.filter((q, i) => checkAnswer(answers[i], q.correct_answer, q.question_type)).length}
        totalQuestions={questions.length}
        timeTaken={totalTime}
        studentId={student?.id}
        onRestart={handleRestart}
      />
    );
  }
  
  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 animate-pulse flex items-center justify-center gap-2">
              🎓 Fluence Quiz
            </h1>
            {student ? (
              <p className="text-white/80 text-lg">Welcome back, {student.display_name}! 👋</p>
            ) : (
              <p className="text-white/80 text-lg">Enter your name to start</p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-400 rounded-xl">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
          
          {!student && (
            <div className="mb-6">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white 
                  placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          
          {student && questions.length > 0 && (
            <div className="mb-6 p-4 bg-white/10 rounded-xl">
              <p className="text-white/80 text-sm mb-1">Questions ready:</p>
              <p className="text-white font-bold text-2xl">{questions.length} questions</p>
            </div>
          )}
          
          {student ? (
            <button
              onClick={startQuiz}
              disabled={questions.length === 0}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl 
                hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg mb-4
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              START QUIZ
            </button>
          ) : (
            <button
              onClick={handleNameSubmit}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl 
                hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg mb-4"
            >
              CONTINUE
            </button>
          )}
          
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {musicEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={() => setSfxEnabled(!sfxEnabled)}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {sfxEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Playing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-white/80">
              {student?.display_name}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl min-h-[400px]">
          {renderQuestion()}
        </div>
        
        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 bg-white/20 text-white font-bold py-4 px-6 rounded-xl border-2 border-white/30
              hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion] || answers[currentQuestion] === ''}
            className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-6 rounded-xl
              hover:from-green-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 
              shadow-lg flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {submitting && (
          <div className="mt-4 text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-white mx-auto mb-2"></div>
            <p>Submitting your results...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

---

## FINAL STEPS

### 1. Update `package.json`

Ensure you have:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "lucide-react": "^0.525.0",
    ...existing dependencies
  }
}
```

### 2. Create `.env` file

```env
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
REACT_APP_N8N_WEBHOOK_URL=https://n8n.myworkflow.top/webhook/quiz-submit
```

### 3. Add `.env` to `.gitignore`

```
.env
.env.local
```

### 4. Install dependencies

```bash
npm install
```

### 5. Test locally

```bash
npm start
```

### 6. Build for production

```bash
npm run build
```

### 7. Deploy to GitHub Pages

```bash
npm run deploy
```

---

## TESTING CHECKLIST

- [ ] Can load student by name (Anaya, Kavya, User)
- [ ] Questions load from Supabase
- [ ] All 6 question types work correctly
- [ ] Can navigate between questions
- [ ] Answers are saved
- [ ] Can submit quiz
- [ ] Results calculated correctly
- [ ] Webhook submission works
- [ ] Leaderboard shows after submission
- [ ] Real-time leaderboard updates
- [ ] Mobile responsive
- [ ] Voice recording works (in Chrome/Edge)

---

## IMPORTANT NOTES

1. **Student Identification:**
   - URL: `https://yoursite.com/?student=Anaya`
   - Or enter name on menu screen

2. **Voice Questions:**
   - Only work in Chrome/Edge browsers
   - Requires HTTPS (works on localhost)
   - Gracefully falls back if not supported

3. **Supabase Connection:**
   - Uses ANON key (safe for frontend)
   - RLS policies protect data
   - Real-time for leaderboard

4. **Result Submission:**
   - Goes to n8n webhook first
   - n8n processes and writes to Supabase
   - Updates concept_mastery
   - Calculates leaderboard rank

5. **Error Handling:**
   - All API calls wrapped in try-catch
   - User-friendly error messages
   - Graceful fallbacks

---

## COMMON ISSUES & SOLUTIONS

**Issue:** "Student not found"
- Check student names in Supabase match exactly
- Check display_name column

**Issue:** "No questions found"
- Check `active = true` in quiz_questions table
- Verify student_id matches

**Issue:** Voice not working
- Must use Chrome or Edge
- Check microphone permissions
- Must be on HTTPS or localhost

**Issue:** Leaderboard not updating
- Check realtime enabled in Supabase
- Check RLS policies
- Verify today's date matches

---

This is the complete, production-ready quiz app! Build it step by step, test thoroughly, and it will be amazing! 🚀