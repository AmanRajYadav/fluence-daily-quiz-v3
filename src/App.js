import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './components/LoadingSpinner';
import ResultScreen from './components/ResultScreen';
import MCQQuestion from './components/QuestionTypes/MCQQuestion';
import TrueFalseQuestion from './components/QuestionTypes/TrueFalseQuestion';
import ShortAnswerQuestion from './components/QuestionTypes/ShortAnswerQuestion';
import VoiceAnswerQuestion from './components/QuestionTypes/VoiceAnswerQuestion';
import FillBlankQuestion from './components/QuestionTypes/FillBlankQuestion';
import MatchQuestion from './components/QuestionTypes/MatchQuestion';
import GameHeader from './components/Game/GameHeader';
import ProgressBar from './components/Game/ProgressBar';
import History from './components/History/History';
import LeaderboardScreen from './components/LeaderboardScreen';
import Settings from './components/Settings';
import { getStudentByName, getActiveQuestions, updateLeaderboard, getTotalPoints } from './services/quizService';
import { submitQuizResults } from './services/webhookService';
import { saveQuizToHistory } from './services/historyService';
import { checkAnswer } from './utils/answerChecker';
import { calculateScore } from './utils/scoreCalculator';
import { usePowerUps } from './hooks/usePowerUps';
import { soundService } from './services/soundService';

function App() {
  // Student & Authentication
  const [student, setStudent] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [totalPoints, setTotalPoints] = useState(0); // Cumulative points across all quizzes

  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionTimers, setQuestionTimers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);

  // Game Mechanics
  // const [lives, setLives] = useState(3); // Commented for arcade mode - students answer all 30 questions
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // UI State
  const [gameState, setGameState] = useState('menu'); // menu, playing, results, history, leaderboard, settings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false); // Default OFF
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [blasterActive, setBlasterActive] = useState(false);
  const [isReplayMode, setIsReplayMode] = useState(false); // Track replay mode

  // Results
  const [finalScore, setFinalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [resultsData, setResultsData] = useState(null);

  // Power-ups hook
  const {
    powerUps,
    useFiftyFifty: activateFiftyFifty,
    useBlaster: activateBlaster,
    useExtraTime: activateExtraTime,
    resetQuestionPowerUps,
    resetAllPowerUps
  } = usePowerUps();

  // Load student from URL or name
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentParam = urlParams.get('student');

    if (studentParam) {
      loadStudentById(studentParam);
    }
  }, []);

  // Reload points when returning to menu (fixes refresh bug)
  useEffect(() => {
    const reloadPoints = async () => {
      if (student && gameState === 'menu') {
        try {
          const points = await getTotalPoints(student.id);
          setTotalPoints(points);
        } catch (err) {
          console.error('Error reloading points:', err);
        }
      }
    };

    reloadPoints();
  }, [student, gameState]);

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

        // Load total points accumulated
        const points = await getTotalPoints(studentData.id);
        setTotalPoints(points);
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
    setIsReplayMode(false); // Regular quiz mode

    // Reset game mechanics
    // setLives(3); // Commented for arcade mode
    setCorrectCount(0);
    setIncorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setQuestionStartTime(Date.now());
    setHiddenOptions([]);
    setShowCorrectAnswer(false);
    resetAllPowerUps();

    // Start background music only if enabled (user interaction triggers it)
    if (musicEnabled) {
      soundService.startBackgroundMusic();
    }
  };

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));

    // Check answer immediately and update game state
    const question = questions[currentQuestion];
    const isCorrect = checkAnswer(answer, question.correct_answer, question.question_type);

    // Show result
    setShowResult(true);

    if (isCorrect) {
      // Play correct sound
      if (sfxEnabled) {
        soundService.play('correct');
      }

      // Track correct answer
      setCorrectCount(prev => prev + 1);

      // Calculate points with streak bonus
      const points = calculateScore(true, streak);
      setScore(prev => prev + points);

      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      // Play level-up sound every 5 streak milestone
      if (newStreak % 5 === 0 && sfxEnabled) {
        soundService.play('levelup');
      }
    } else {
      // Play wrong sound
      if (sfxEnabled) {
        soundService.play('wrong');
      }

      // Track incorrect answer
      setIncorrectCount(prev => prev + 1);

      // Reset streak
      setStreak(0);

      // No lives system - continue to next question
    }
  };

  const handleNext = () => {
    // Record time for this question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setQuestionTimers(prev => ({
      ...prev,
      [currentQuestion]: timeSpent
    }));

    setShowResult(false);
    setHiddenOptions([]);
    setShowCorrectAnswer(false);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setQuestionStartTime(Date.now());

      // Reset question-specific power-ups
      resetQuestionPowerUps();
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
    // Stop background music
    soundService.stopBackgroundMusic();

    const endTime = Date.now();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    setTotalTime(totalSeconds);

    // Calculate score
    let correct = 0;
    const detailedAnswers = questions.map((question, index) => {
      const studentAnswer = answers[index];
      const isCorrect = checkAnswer(studentAnswer, question.correct_answer, question.question_type);

      if (isCorrect) correct++;

      // Calculate points for this question
      const timeTaken = questionTimers[index] || 0;
      const timeRemaining = Math.max(0, 60 - timeTaken);
      const streakAtTime = 0; // We don't track per-question streak in history
      const points = isCorrect ? calculateScore(true, timeRemaining, 60, streakAtTime) : 0;

      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options, // IMPORTANT: Store options for replay
        student_answer: studentAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        time_spent: timeTaken,
        points_earned: points,
        concept_tested: question.concept_tested,
        difficulty_level: question.difficulty_level,
        explanation: question.explanation
      };
    });

    const scorePercentage = (correct / questions.length) * 100;
    setFinalScore(scorePercentage);

    // Power-ups disabled in regular quiz (saved for Rapid Fire mode)
    const powerUpsUsed = {
      fifty_fifty: 0,
      blaster: 0,
      extra_time: 0
    };

    const data = {
      student_id: student.id,
      student_name: student.display_name,
      quiz_date: new Date().toISOString().split('T')[0],
      total_questions: questions.length,
      correct_answers: correct,
      incorrect_answers: questions.length - correct, // Total incorrect
      score: scorePercentage,
      time_taken_seconds: totalSeconds,
      highest_streak: maxStreak,
      total_score: score,
      power_ups_used: powerUpsUsed,
      answers_json: {
        questions: detailedAnswers,
        metadata: {
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          questions_attempted: questions.length,
          completion_rate: 100 // All 30 questions completed in arcade mode
        }
      },
      concepts_tested: [...new Set(questions.map(q => q.concept_tested).filter(Boolean))]
    };

    // Save results data for manual submission
    setResultsData(data);
    setGameState('results');
  };

  const handleSubmitResults = async () => {
    if (!resultsData) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Submit to webhook
      const webhookResult = await submitQuizResults(resultsData);

      if (!webhookResult || !webhookResult.success) {
        throw new Error(webhookResult?.error || 'Failed to submit to webhook');
      }

      console.log('Quiz results submitted to webhook successfully');

      // Save to history only after successful webhook submission
      const historyResult = await saveQuizToHistory(resultsData);

      if (!historyResult || !historyResult.success) {
        throw new Error(historyResult?.error || 'Failed to save to history');
      }

      console.log('Quiz saved to history successfully');

      // Leaderboard is now updated by n8n webhook automatically
      // No need to call updateLeaderboard from frontend

      // Update total points (add current quiz score)
      setTotalPoints(prev => prev + resultsData.total_score);

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setSubmitError(err?.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
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

    // Reset game mechanics
    // setLives(3); // Commented for arcade mode
    setCorrectCount(0);
    setIncorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setHiddenOptions([]);
    setShowCorrectAnswer(false);
    resetAllPowerUps();
  };

  // Power-up handlers
  const handleFiftyFifty = () => {
    const question = questions[currentQuestion];

    // Only works on MCQ questions
    if (question.question_type !== 'mcq') {
      return;
    }

    const success = activateFiftyFifty();
    if (!success) {
      return;
    }

    // Parse options - handle both string and array formats
    let options = [];
    if (Array.isArray(question.options)) {
      options = question.options;
    } else if (typeof question.options === 'string') {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        console.error('[50/50] Failed to parse options:', e);
        return;
      }
    } else {
      console.error('[50/50] Invalid options format:', question.options);
      return;
    }

    // Get correct answer and find 2 wrong options to hide
    const correctAnswer = question.correct_answer;
    const wrongOptions = options.filter(opt => opt !== correctAnswer);

    if (wrongOptions.length < 2) {
      console.warn('[50/50] Not enough wrong options to hide');
      return;
    }

    // Randomly select 2 wrong options to hide
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const toHide = shuffled.slice(0, 2);

    setHiddenOptions(toHide);

    // Sound already played by hook
  };

  const handleBlaster = () => {
    const success = activateBlaster();
    if (!success) {
      return;
    }

    // Get current question
    const question = questions[currentQuestion];

    // Trigger particle explosion animation
    setBlasterActive(true);

    // Show correct answer briefly
    setShowCorrectAnswer(true);

    // Sound already played by hook

    // Auto-select correct answer after 1.5 seconds (shorter for particle effect)
    setTimeout(() => {
      setShowCorrectAnswer(false);
      setBlasterActive(false);
      handleAnswerSelect(question.correct_answer);
    }, 1500);
  };

  const handleExtraTime = () => {
    const success = activateExtraTime();
    if (!success) {
      return;
    }

    // Timer removed - this power-up needs new functionality
    // TODO: Replace with something else (e.g., bonus points, skip question, etc.)

    // Sound already played by hook
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
      isCorrect,
      hiddenOptions,
      showCorrectAnswer
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

  // History screen
  if (gameState === 'history') {
    const handleReplayQuiz = (replayQuestions, quizInfo) => {
      // Load the questions for replay
      setQuestions(replayQuestions);
      setCurrentQuestion(0);
      setShowResult(false);
      setIsReplayMode(true); // Mark as replay mode

      // Reset game state for replay mode
      setCorrectCount(0);
      setIncorrectCount(0);
      setStreak(0);
      setMaxStreak(0);
      setScore(0);
      setAnswers({});
      setQuestionTimers({});
      setHiddenOptions([]);
      setShowCorrectAnswer(false);
      resetAllPowerUps();

      // Initialize answers and timers
      const initialAnswers = {};
      const initialTimers = {};
      replayQuestions.forEach((q, index) => {
        initialAnswers[index] = '';
        initialTimers[index] = 0;
      });
      setAnswers(initialAnswers);
      setQuestionTimers(initialTimers);

      // Set start time
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());

      // Switch to playing mode
      setGameState('playing');

      // Show alert that this is review mode (no points)
      setTimeout(() => {
        alert('📚 Review Mode: This quiz won\'t affect your score or leaderboard position. Use it to practice and review!');
      }, 500);
    };

    return (
      <History
        student={student}
        onBack={() => setGameState('menu')}
        onReplayQuiz={handleReplayQuiz}
      />
    );
  }

  // Leaderboard screen
  if (gameState === 'leaderboard') {
    return (
      <LeaderboardScreen
        student={student}
        onBack={() => setGameState('menu')}
      />
    );
  }

  // Settings screen
  if (gameState === 'settings') {
    return (
      <Settings
        student={student}
        musicEnabled={musicEnabled}
        setMusicEnabled={setMusicEnabled}
        sfxEnabled={sfxEnabled}
        setSfxEnabled={setSfxEnabled}
        onBack={() => setGameState('menu')}
      />
    );
  }

  // Results screen
  if (gameState === 'results') {
    return (
      <ResultScreen
        score={finalScore}
        correctAnswers={correctCount}
        incorrectAnswers={incorrectCount}
        totalQuestions={questions.length}
        timeTaken={totalTime}
        studentId={student?.id}
        maxStreak={maxStreak}
        totalScore={score}
        onRestart={handleRestart}
        onSubmit={handleSubmitResults}
        submitting={submitting}
        submitted={submitted}
        submitError={submitError}
        isReplayMode={isReplayMode}
      />
    );
  }

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen game-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">

          {/* Main Card */}
          <div className="neon-border-purple bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-lg rounded-3xl p-8 text-center">
            <div className="mb-8">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 neon-text-pink" style={{ fontFamily: 'Arial Black, sans-serif', letterSpacing: '1px' }}>
                Fluence<br/>Daily Quiz
              </h1>
              {student ? (
                <p className="text-cyan-300 text-lg font-semibold">Welcome, {student.display_name}! 🎮</p>
              ) : (
                <p className="text-cyan-300 text-lg font-semibold">Enter your name to begin</p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 neon-border-pink bg-red-900/30 rounded-xl">
                <p className="text-red-300 text-sm font-semibold">{error}</p>
              </div>
            )}

            {!student && (
              <div className="mb-6">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  placeholder="Your Name..."
                  className="w-full px-4 py-4 rounded-2xl neon-border-cyan bg-purple-900/50 text-white text-center text-lg font-bold
                    placeholder-cyan-300/50 focus:outline-none focus:neon-border-pink transition-all"
                />
              </div>
            )}

            {student && questions.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-4">
                {/* Questions Ready */}
                <div className="p-4 neon-border-cyan bg-cyan-900/20 rounded-2xl">
                  <p className="text-cyan-300 text-sm mb-1 font-semibold">Questions Ready</p>
                  <p className="text-white font-black text-3xl">{questions.length}</p>
                </div>
                {/* Total Points */}
                <div className="p-4 neon-border-yellow bg-yellow-900/20 rounded-2xl">
                  <p className="text-yellow-300 text-sm mb-1 font-semibold">Total Points</p>
                  <p className="text-white font-black text-3xl">{totalPoints.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Action Buttons Grid */}
            {student ? (
              <>
                <button
                  onClick={startQuiz}
                  disabled={questions.length === 0}
                  className="w-full neon-border-pink bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xl py-5 px-8 rounded-full
                    hover:from-pink-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-2xl mb-4
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider"
                >
                  PLAY QUIZ
                </button>

                {/* Rapid Fire - Coming Soon */}
                <button
                  onClick={() => alert('🔥 Rapid Fire Mode Coming Soon!\n\nGet ready for:\n• ⏱️ 30-second rapid questions\n• 🎮 Power-ups (50:50, Blaster, +30s)\n• ❤️ 3 lives system\n• ⚡ Infinite questions\n• 🏆 High score challenge\n\nStay tuned!')}
                  className="relative w-full neon-border-yellow bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-xl py-5 px-8 rounded-full
                    hover:from-orange-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 shadow-2xl mb-6 uppercase tracking-wider"
                >
                  <span className="flex items-center justify-center gap-2">
                    🔥 RAPID FIRE
                  </span>
                  <span className="absolute top-1 right-4 bg-yellow-300 text-purple-900 text-xs font-black px-2 py-1 rounded-full animate-pulse">
                    COMING SOON
                  </span>
                </button>

                {/* Menu Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button
                    onClick={() => setGameState('settings')}
                    className="neon-border-cyan bg-cyan-900/30 p-4 rounded-2xl hover:bg-cyan-800/40 transition-all"
                  >
                    <div className="text-3xl mb-2">⚙️</div>
                    <div className="text-white font-bold text-sm">Settings</div>
                  </button>
                  <button
                    onClick={() => alert('Bonus: Daily challenges and special rewards will be available here.')}
                    className="neon-border-cyan bg-cyan-900/30 p-4 rounded-2xl hover:bg-cyan-800/40 transition-all"
                  >
                    <div className="text-3xl mb-2">🎁</div>
                    <div className="text-white font-bold text-sm">Bonus</div>
                  </button>
                  <button
                    onClick={() => setGameState('history')}
                    className="neon-border-cyan bg-cyan-900/30 p-4 rounded-2xl hover:bg-cyan-800/40 transition-all"
                  >
                    <div className="text-3xl mb-2">📜</div>
                    <div className="text-white font-bold text-sm">History</div>
                  </button>
                  <button
                    onClick={() => setGameState('leaderboard')}
                    className="neon-border-cyan bg-cyan-900/30 p-4 rounded-2xl hover:bg-cyan-800/40 transition-all"
                  >
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-white font-bold text-sm">Leaderboard</div>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleNameSubmit}
                className="w-full neon-border-purple bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl py-5 px-8 rounded-full
                  hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 shadow-2xl uppercase tracking-wider"
              >
                Tap to Continue
              </button>
            )}

            {/* Sound Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className="p-3 neon-border-purple bg-purple-900/50 rounded-full hover:bg-purple-800/60 transition-all"
              >
                {musicEnabled ? <Volume2 className="w-6 h-6 text-cyan-300" /> : <VolumeX className="w-6 h-6 text-pink-400" />}
              </button>
              <button
                onClick={() => setSfxEnabled(!sfxEnabled)}
                className="p-3 neon-border-purple bg-purple-900/50 rounded-full hover:bg-purple-800/60 transition-all"
              >
                {sfxEnabled ? <Volume2 className="w-6 h-6 text-cyan-300" /> : <VolumeX className="w-6 h-6 text-pink-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen game-bg p-3">
      <div className="max-w-4xl mx-auto py-4">
        {/* Progress Bar - At the very top */}
        <ProgressBar
          current={currentQuestion + 1}
          total={questions.length}
        />

        {/* Simplified Header Row: Streak and Score */}
        <div className="flex items-center justify-between mb-3">
          {/* Left: Streak Display */}
          <div className="flex-shrink-0">
            <GameHeader
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              streak={streak}
              score={score}
              onlyTimer={true}
            />
          </div>

          {/* Right: Score Badge */}
          <div className="flex-shrink-0">
            <div className="coin-badge px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center text-base">
                💰
              </div>
              <span className="text-white font-black text-lg">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Question Card with Animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-6 mb-4 shadow-2xl min-h-[350px] relative overflow-hidden ${blasterActive ? 'blaster-animation' : ''}`}
          >
            {/* Particle Explosion Effect */}
            {blasterActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Create 20 particles exploding in all directions */}
                {[...Array(20)].map((_, i) => {
                  const angle = (i / 20) * 2 * Math.PI;
                  const distance = 300;
                  const tx = Math.cos(angle) * distance;
                  const ty = Math.sin(angle) * distance;
                  const colors = ['bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400'];
                  const color = colors[i % colors.length];
                  const size = Math.random() * 8 + 4;

                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1, opacity: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`particle absolute ${color} rounded-full`}
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        '--tx': `${tx}px`,
                        '--ty': `${ty}px`,
                        filter: 'drop-shadow(0 0 8px currentColor)',
                        animationDelay: `${Math.random() * 0.1}s`
                      }}
                    />
                  );
                })}
              </div>
            )}
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>

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
