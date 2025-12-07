# Fluence Gamified Quiz App v2 - Complete Rebuild Instructions

## CRITICAL CONTEXT

The previous build was functional but **completely lacked gamification, engagement, and proper submission flow**. This rebuild focuses on creating an engaging, game-like experience with full data persistence.

---

## PROJECT GOALS

1. **Gamified Experience** - Make quiz-taking fun and rewarding
2. **Complete Data Flow** - Submit all results to n8n webhook → Supabase
3. **History Access** - Students can view past quizzes and notes by date
4. **No Data Loss** - Nothing gets overwritten, everything stored permanently

---

## TECH STACK

- React 19
- Supabase (@supabase/supabase-js)
- TailwindCSS
- Lucide React icons
- Howler.js (for sound effects)
- Framer Motion (for animations)

---

## REQUIRED DEPENDENCIES

```bash
npm install @supabase/supabase-js howler framer-motion react-confetti
```

---

## UI/UX REFERENCE

The quiz should feel like a **trivia game show** with:
- Bright, vibrant colors (not just purple)
- Smooth animations and transitions
- Sound effects for every action
- Visual feedback (correct/wrong indicators)
- Progress tracking with rewards
- Celebration effects (confetti, particles)

**Color Palette:**
- Primary: `#8B5CF6` (Purple)
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Orange)
- Accent: `#3B82F6` (Blue)
- Background: Gradient from purple to blue

---

## COMPLETE FEATURE LIST

### 1. GAME MECHANICS
- ✅ Lives system (3 hearts) - lose 1 per wrong answer
- ✅ Timer (configurable, default 60s per question)
- ✅ Streak counter (consecutive correct answers)
- ✅ Score multiplier (increases with streak)
- ✅ Power-ups:
  - 50:50 (remove 2 wrong answers) - 2 uses
  - Blaster (Blasts The correct Answer) - 2 uses
  - Extra Time (+30s) - 2 uses
- ✅ Bonus points for speed (faster = more points)

### 2. VISUAL ELEMENTS
- ✅ Progress bar with current question number
- ✅ Animated transitions between questions
- ✅ Particle effects on correct answers
- ✅ Confetti celebration on quiz completion
- ✅ Pulsing timer when < 10s remaining
- ✅ Shake animation on wrong answers
- ✅ Character/avatar display
- ✅ Achievement badges

### 3. SOUND EFFECTS
- ✅ Background music (toggle on/off)
- ✅ Correct answer sound
- ✅ Wrong answer sound
- ✅ Clock ticking (last 10 seconds)
- ✅ Level up sound (on streak milestones)
- ✅ Power-up activation sound
- ✅ Quiz completion fanfare

### 4. QUESTION TYPES (All 6 working perfectly)
- ✅ MCQ with visual selection feedback
- ✅ True/False with large tap targets
- ✅ Short Answer with character counter
- ✅ Voice Answer with waveform visualization
- ✅ Fill in the Blank inline
- ✅ Match (drag and drop or tap-to-match)

### 5. RESULT SUBMISSION
- ✅ Submit button at quiz end
- ✅ POST to n8n webhook with complete data
- ✅ Loading state during submission
- ✅ Success/Error feedback
- ✅ Retry mechanism if submission fails

### 6. HISTORY SECTION
- ✅ View past quizzes by date
- ✅ View past notes by date
- ✅ Filter by subject
- ✅ Search functionality
- ✅ Retake past quizzes (for practice)
- ✅ Download notes as PDF

---

## DATABASE SCHEMA UPDATES

### New Table: `quiz_history`

```sql
CREATE TABLE quiz_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  session_id UUID,
  subject TEXT,
  total_questions INT,
  score DECIMAL,
  time_taken_seconds INT,
  lives_remaining INT,
  highest_streak INT,
  power_ups_used JSONB,
  questions_json JSONB, -- Store questions for replay
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quiz_history_student_date ON quiz_history(student_id, quiz_date DESC);
```

### Update `quiz_questions` table - Add session tracking:

```sql
ALTER TABLE quiz_questions ADD COLUMN created_date DATE DEFAULT CURRENT_DATE;
CREATE INDEX idx_quiz_questions_student_date ON quiz_questions(student_id, created_date DESC);
```

### New Table: `notes_history`

```sql
CREATE TABLE notes_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID,
  note_date DATE NOT NULL,
  subject TEXT,
  title TEXT,
  content_html TEXT,
  content_markdown TEXT,
  concepts_covered TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_history_student_date ON notes_history(student_id, note_date DESC);
```

---

## DETAILED IMPLEMENTATION

### PROJECT STRUCTURE

```
src/
├── components/
│   ├── Game/
│   │   ├── GameHeader.jsx          // Timer, lives, streak, power-ups
│   │   ├── ProgressBar.jsx         // Question progress
│   │   ├── PowerUpBar.jsx          // Power-up buttons
│   │   └── ScoreDisplay.jsx        // Current score with animations
│   ├── QuestionTypes/
│   │   ├── MCQQuestion.jsx         // Enhanced with animations
│   │   ├── TrueFalseQuestion.jsx   // Large tap targets
│   │   ├── ShortAnswerQuestion.jsx // Character counter
│   │   ├── VoiceAnswerQuestion.jsx // Waveform viz
│   │   ├── FillBlankQuestion.jsx   // Inline input
│   │   └── MatchQuestion.jsx       // Drag-and-drop
│   ├── Results/
│   │   ├── ResultScreen.jsx        // Enhanced with confetti
│   │   ├── SubmitButton.jsx        // Submit to webhook
│   │   └── RetryButton.jsx         // Retry submission
│   ├── History/
│   │   ├── HistoryHome.jsx         // History landing page
│   │   ├── QuizHistory.jsx         // Past quizzes list
│   │   ├── NotesHistory.jsx        // Past notes list
│   │   ├── HistoryFilters.jsx      // Date/subject filters
│   │   └── QuizReplay.jsx          // Replay past quiz
│   ├── Leaderboard.jsx             // Real-time leaderboard
│   ├── LoadingSpinner.jsx          // Loading states
│   └── Confetti.jsx                // Celebration effects
├── services/
│   ├── supabase.js                 // Supabase client
│   ├── quizService.js              // Quiz operations
│   ├── historyService.js           // History operations (NEW)
│   ├── webhookService.js           // n8n webhook submission
│   └── soundService.js             // Sound effects manager (NEW)
├── hooks/
│   ├── useTimer.js                 // Timer hook
│   ├── useSound.js                 // Sound effects hook
│   ├── usePowerUps.js              // Power-ups logic
│   └── useGameState.js             // Game state management
├── utils/
│   ├── answerChecker.js
│   ├── scoreCalculator.js          // Score with speed bonus
│   └── animations.js               // Reusable animations
├── assets/
│   └── sounds/                     // Sound effect files
│       ├── correct.mp3
│       ├── wrong.mp3
│       ├── tick.mp3
│       ├── powerup.mp3
│       ├── levelup.mp3
│       └── complete.mp3
├── App.js
└── index.css
```

---

## FILE-BY-FILE IMPLEMENTATION

### FILE 1: `src/services/soundService.js`

```javascript
import { Howl } from 'howler';

class SoundService {
  constructor() {
    // Sound URLs (use CDN or local files)
    this.sounds = {
      correct: new Howl({ src: ['/sounds/correct.mp3'], volume: 0.5 }),
      wrong: new Howl({ src: ['/sounds/wrong.mp3'], volume: 0.5 }),
      tick: new Howl({ src: ['/sounds/tick.mp3'], volume: 0.3, loop: true }),
      powerup: new Howl({ src: ['/sounds/powerup.mp3'], volume: 0.6 }),
      levelup: new Howl({ src: ['/sounds/levelup.mp3'], volume: 0.7 }),
      complete: new Howl({ src: ['/sounds/complete.mp3'], volume: 0.8 }),
    };
    
    this.bgMusic = new Howl({
      src: ['/sounds/background.mp3'],
      loop: true,
      volume: 0.2,
    });
    
    this.enabled = true;
    this.musicEnabled = true;
  }
  
  play(soundName) {
    if (this.enabled && this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }
  
  stop(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.bgMusic.play();
    } else {
      this.bgMusic.stop();
    }
  }
  
  toggleSFX() {
    this.enabled = !this.enabled;
  }
}

export const soundService = new SoundService();
```

---

### FILE 2: `src/hooks/useTimer.js`

```javascript
import { useState, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService';

export const useTimer = (initialTime = 60, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const tickingSoundStarted = useRef(false);
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Start ticking sound at 10 seconds
          if (newTime === 10 && !tickingSoundStarted.current) {
            soundService.play('tick');
            tickingSoundStarted.current = true;
          }
          
          // Stop ticking at 0
          if (newTime === 0) {
            soundService.stop('tick');
            tickingSoundStarted.current = false;
            if (onTimeUp) onTimeUp();
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      clearInterval(intervalRef.current);
      if (tickingSoundStarted.current) {
        soundService.stop('tick');
        tickingSoundStarted.current = false;
      }
    };
  }, [isRunning, timeLeft, onTimeUp]);
  
  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = (time = initialTime) => {
    setTimeLeft(time);
    setIsRunning(false);
    if (tickingSoundStarted.current) {
      soundService.stop('tick');
      tickingSoundStarted.current = false;
    }
  };
  const addTime = (seconds) => setTimeLeft((prev) => prev + seconds);
  
  return { timeLeft, isRunning, start, pause, reset, addTime };
};
```

---

### FILE 3: `src/hooks/usePowerUps.js`

```javascript
import { useState } from 'react';
import { soundService } from '../services/soundService';

export const usePowerUps = () => {
  const [powerUps, setPowerUps] = useState({
    fiftyFifty: { count: 2, used: false },
    skipQuestion: { count: 2, used: false },
    extraTime: { count: 2, used: false },
  });
  
  const useFiftyFifty = (onUse) => {
    if (powerUps.fiftyFifty.count > 0 && !powerUps.fiftyFifty.used) {
      soundService.play('powerup');
      setPowerUps(prev => ({
        ...prev,
        fiftyFifty: { 
          count: prev.fiftyFifty.count - 1, 
          used: true 
        }
      }));
      if (onUse) onUse();
      return true;
    }
    return false;
  };
  
  const useSkipQuestion = (onUse) => {
    if (powerUps.skipQuestion.count > 0) {
      soundService.play('powerup');
      setPowerUps(prev => ({
        ...prev,
        skipQuestion: { 
          count: prev.skipQuestion.count - 1, 
          used: false 
        }
      }));
      if (onUse) onUse();
      return true;
    }
    return false;
  };
  
  const useExtraTime = (onUse) => {
    if (powerUps.extraTime.count > 0 && !powerUps.extraTime.used) {
      soundService.play('powerup');
      setPowerUps(prev => ({
        ...prev,
        extraTime: { 
          count: prev.extraTime.count - 1, 
          used: true 
        }
      }));
      if (onUse) onUse(30); // Add 30 seconds
      return true;
    }
    return false;
  };
  
  const resetQuestionPowerUps = () => {
    setPowerUps(prev => ({
      ...prev,
      fiftyFifty: { ...prev.fiftyFifty, used: false },
      extraTime: { ...prev.extraTime, used: false },
    }));
  };
  
  return {
    powerUps,
    useFiftyFifty,
    useSkipQuestion,
    useExtraTime,
    resetQuestionPowerUps,
  };
};
```

---

### FILE 4: `src/services/historyService.js`

```javascript
import { supabase } from './supabase';

// Get quiz history for a student
export const getQuizHistory = async (studentId, filters = {}) => {
  let query = supabase
    .from('quiz_history')
    .select('*')
    .eq('student_id', studentId)
    .order('quiz_date', { ascending: false });
  
  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }
  
  if (filters.startDate) {
    query = query.gte('quiz_date', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('quiz_date', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }
  
  return data || [];
};

// Get notes history for a student
export const getNotesHistory = async (studentId, filters = {}) => {
  let query = supabase
    .from('notes_history')
    .select('*')
    .eq('student_id', studentId)
    .order('note_date', { ascending: false });
  
  if (filters.subject) {
    query = query.eq('subject', filters.subject);
  }
  
  if (filters.startDate) {
    query = query.gte('note_date', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('note_date', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notes history:', error);
    return [];
  }
  
  return data || [];
};

// Get questions for a specific date (for replay)
export const getQuestionsByDate = async (studentId, date) => {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('student_id', studentId)
    .eq('created_date', date)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions by date:', error);
    return [];
  }
  
  return data || [];
};

// Save quiz to history after completion
export const saveQuizToHistory = async (historyData) => {
  const { data, error } = await supabase
    .from('quiz_history')
    .insert([historyData])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving quiz to history:', error);
    return null;
  }
  
  return data;
};
```

---

### FILE 5: `src/utils/scoreCalculator.js`

```javascript
// Calculate score with speed bonus and streak multiplier
export const calculateScore = (isCorrect, timeLeft, totalTime, streak) => {
  if (!isCorrect) return 0;
  
  const basePoints = 100;
  
  // Speed bonus (0-50 points based on time remaining)
  const speedBonus = Math.floor((timeLeft / totalTime) * 50);
  
  // Streak multiplier (1x, 1.5x, 2x, 2.5x, 3x...)
  const streakMultiplier = 1 + (Math.min(streak, 10) * 0.1);
  
  const totalPoints = Math.floor((basePoints + speedBonus) * streakMultiplier);
  
  return totalPoints;
};

// Calculate final grade
export const calculateGrade = (score, totalQuestions) => {
  const percentage = (score / (totalQuestions * 100)) * 100;
  
  if (percentage >= 90) return { grade: 'A+', color: '#10B981' };
  if (percentage >= 80) return { grade: 'A', color: '#34D399' };
  if (percentage >= 70) return { grade: 'B', color: '#60A5FA' };
  if (percentage >= 60) return { grade: 'C', color: '#FBBF24' };
  if (percentage >= 50) return { grade: 'D', color: '#F59E0B' };
  return { grade: 'F', color: '#EF4444' };
};
```

---

### FILE 6: `src/components/Game/GameHeader.jsx`

```javascript
import React from 'react';
import { Heart, Flame, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const GameHeader = ({ 
  lives, 
  streak, 
  timeLeft, 
  score,
  totalTime = 60 
}) => {
  const isLowTime = timeLeft <= 10;
  const timePercentage = (timeLeft / totalTime) * 100;
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        {/* Lives */}
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i < lives ? 1 : 0.7,
                opacity: i < lives ? 1 : 0.3,
              }}
              transition={{ duration: 0.2 }}
            >
              <Heart
                className={`w-6 h-6 ${
                  i < lives ? 'fill-red-500 text-red-500' : 'text-white/30'
                }`}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-white font-bold">{streak}x</span>
          </motion.div>
        )}
        
        {/* Score */}
        <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold">{score}</span>
        </div>
      </div>
      
      {/* Timer Bar */}
      <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${
            isLowTime 
              ? 'bg-gradient-to-r from-red-500 to-orange-500' 
              : 'bg-gradient-to-r from-green-400 to-blue-500'
          }`}
          animate={{
            width: `${timePercentage}%`,
            opacity: isLowTime ? [1, 0.5, 1] : 1,
          }}
          transition={{
            width: { duration: 0.5 },
            opacity: isLowTime ? { duration: 0.5, repeat: Infinity } : {},
          }}
        />
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-2">
        <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-400' : 'text-white/60'}`} />
        <span className={`text-sm font-mono ${isLowTime ? 'text-red-400 font-bold' : 'text-white/60'}`}>
          {timeLeft}s
        </span>
      </div>
    </div>
  );
};

export default GameHeader;
```

---

### FILE 7: `src/components/Game/PowerUpBar.jsx`

```javascript
import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, FastForward, Clock } from 'lucide-react';

const PowerUpBar = ({ powerUps, onUseFiftyFifty, onUseSkip, onUseExtraTime }) => {
  const PowerUpButton = ({ icon: Icon, count, used, onClick, label, color }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={count === 0 || used}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
        ${count > 0 && !used
          ? `${color} hover:opacity-80 cursor-pointer`
          : 'bg-white/10 border-white/20 opacity-50 cursor-not-allowed'
        }`}
    >
      <Icon className="w-6 h-6 text-white" />
      <span className="text-xs text-white font-medium">{label}</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </motion.button>
  );
  
  return (
    <div className="flex gap-3 justify-center mb-4">
      <PowerUpButton
        icon={Scissors}
        count={powerUps.fiftyFifty.count}
        used={powerUps.fiftyFifty.used}
        onClick={onUseFiftyFifty}
        label="50:50"
        color="bg-blue-500 border-blue-400"
      />
      <PowerUpButton
        icon={FastForward}
        count={powerUps.skipQuestion.count}
        used={false}
        onClick={onUseSkip}
        label="Skip"
        color="bg-green-500 border-green-400"
      />
      <PowerUpButton
        icon={Clock}
        count={powerUps.extraTime.count}
        used={powerUps.extraTime.used}
        onClick={onUseExtraTime}
        label="+30s"
        color="bg-orange-500 border-orange-400"
      />
    </div>
  );
};

export default PowerUpBar;
```

---

### FILE 8: Enhanced `src/App.js` with Full Game Logic

This is too long to include in full, but KEY ADDITIONS:

```javascript
// Add game state
const [lives, setLives] = useState(3);
const [streak, setStreak] = useState(0);
const [score, setScore] = useState(0);
const [questionStartTime, setQuestionStartTime] = useState(Date.now());

// Import hooks
const { timeLeft, start, pause, reset, addTime } = useTimer(60, handleTimeUp);
const { powerUps, useFiftyFifty, useSkipQuestion, useExtraTime, resetQuestionPowerUps } = usePowerUps();

// Handle answer selection
const handleAnswerSelect = (answer, timeTaken) => {
  const question = questions[currentQuestion];
  const isCorrect = checkAnswer(answer, question.correct_answer, question.question_type);
  
  if (isCorrect) {
    soundService.play('correct');
    setStreak(prev => prev + 1);
    const points = calculateScore(isCorrect, timeLeft, 60, streak);
    setScore(prev => prev + points);
    
    // Milestone check
    if ((streak + 1) % 5 === 0) {
      soundService.play('levelup');
    }
  } else {
    soundService.play('wrong');
    setStreak(0);
    setLives(prev => prev - 1);
    
    if (lives <= 1) {
      // Game over
      handleGameOver();
      return;
    }
  }
  
  // Store answer
  setAnswers(prev => ({
    ...prev,
    [currentQuestion]: {
      answer,
      isCorrect,
      timeTaken,
      points: isCorrect ? calculateScore(isCorrect, timeLeft, 60, streak) : 0
    }
  }));
};

// Submit results to webhook
const handleSubmitResults = async () => {
  setSubmitting(true);
  
  const resultsData = {
    student_id: student.id,
    student_name: student.display_name,
    quiz_date: new Date().toISOString().split('T')[0],
    total_questions: questions.length,
    correct_answers: Object.values(answers).filter(a => a.isCorrect).length,
    score: score,
    time_taken_seconds: totalTimeTaken,
    lives_remaining: lives,
    highest_streak: maxStreak,
    power_ups_used: {
      fiftyFifty: 2 - powerUps.fiftyFifty.count,
      skip: 2 - powerUps.skipQuestion.count,
      extraTime: 2 - powerUps.extraTime.count
    },
    answers_json: {
      questions: questions.map((q, i) => ({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        student_answer: answers[i]?.answer,
        correct_answer: q.correct_answer,
        is_correct: answers[i]?.isCorrect,
        time_spent: answers[i]?.timeTaken,
        points_earned: answers[i]?.points,
        concept_tested: q.concept_tested
      }))
    },
    concepts_tested: [...new Set(questions.map(q => q.concept_tested).filter(Boolean))]
  };
  
  const result = await submitQuizResults(resultsData);
  
  if (result.success) {
    // Also save to history
    await saveQuizToHistory({
      student_id: student.id,
      quiz_date: resultsData.quiz_date,
      subject: questions[0]?.subject || 'Mixed',
      total_questions: resultsData.total_questions,
      score: resultsData.score,
      time_taken_seconds: resultsData.time_taken_seconds,
      lives_remaining: resultsData.lives_remaining,
      highest_streak: resultsData.highest_streak,
      power_ups_used: resultsData.power_ups_used,
      questions_json: questions
    });
    
    setSubmitted(true);
  }
  
  setSubmitting(false);
};
```

---

## TESTING CHECKLIST

After build completes:

- [ ] All 6 question types render correctly
- [ ] Timer counts down and shows urgency at <10s
- [ ] Lives decrease on wrong answers
- [ ] Streak increases on consecutive correct answers
- [ ] Score increases with streak multiplier
- [ ] Sound effects play on actions
- [ ] Power-ups work correctly
- [ ] Confetti shows on quiz completion
- [ ] Submit button sends data to webhook
- [ ] History section shows past quizzes
- [ ] History section shows past notes
- [ ] Can replay past quizzes
- [ ] All animations smooth
- [ ] Mobile responsive


---

## FUTURE ENHANCEMENTS (just cread a .md file for below we will not implement it right now)

- Daily challenges
- Achievements system
- Social sharing
- Custom avatars
- Team battles
- Voice-based quizzes entirely

---

This is a COMPLETE rebuild that will create an engaging, game-like experience. Build time: 10-12 hours for Claude Code.