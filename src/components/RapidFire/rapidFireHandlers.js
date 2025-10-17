/**
 * RAPID FIRE MODE - POWER-UP HANDLERS
 *
 * This file contains all power-up logic preserved for the upcoming Rapid Fire game mode.
 * These handlers were removed from the main quiz to simplify the UI.
 *
 * USAGE IN RAPID FIRE:
 *
 * 1. Import the hook:
 *    import { usePowerUps } from '../../hooks/usePowerUps';
 *
 * 2. Initialize power-ups:
 *    const {
 *      powerUps,
 *      useFiftyFifty: activateFiftyFifty,
 *      useBlaster: activateBlaster,
 *      useExtraTime: activateExtraTime,
 *      resetQuestionPowerUps,
 *      resetAllPowerUps
 *    } = usePowerUps();
 *
 * 3. Use these handlers with your game state
 */

/**
 * 50:50 POWER-UP HANDLER
 * Removes 2 wrong options from MCQ questions
 *
 * Requirements:
 * - Only works on MCQ questions
 * - Question must have at least 3 wrong options
 * - Randomly selects 2 wrong options to hide
 */
export const createHandleFiftyFifty = ({
  activateFiftyFifty,
  questions,
  currentQuestion,
  setHiddenOptions
}) => {
  return () => {
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
};

/**
 * BLASTER POWER-UP HANDLER
 * Auto-selects the correct answer with particle explosion animation
 *
 * Features:
 * - Triggers particle explosion animation
 * - Shows correct answer briefly
 * - Auto-submits after 1.5 seconds
 */
export const createHandleBlaster = ({
  activateBlaster,
  questions,
  currentQuestion,
  setBlasterActive,
  setShowCorrectAnswer,
  handleAnswerSelect
}) => {
  return () => {
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
};

/**
 * +30s TIMER POWER-UP HANDLER
 * Adds 30 seconds to the current question timer
 *
 * Note: This is specific to Rapid Fire mode which has a timer
 * Regular quiz mode removed the timer, so this power-up is only for Rapid Fire
 */
export const createHandleExtraTime = ({
  activateExtraTime,
  addTime // from useTimer hook
}) => {
  return () => {
    const success = activateExtraTime();
    if (!success) {
      return;
    }

    // Add 30 seconds to timer (Rapid Fire specific)
    addTime(30);

    // Sound already played by hook
  };
};

/**
 * PARTICLE EXPLOSION ANIMATION (for Blaster)
 * JSX to render in your game component
 *
 * Usage in JSX:
 * {blasterActive && (
 *   <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
 *     {[...Array(20)].map((_, i) => {
 *       const angle = (i / 20) * 2 * Math.PI;
 *       const distance = 300;
 *       const tx = Math.cos(angle) * distance;
 *       const ty = Math.sin(angle) * distance;
 *       const colors = ['bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400'];
 *       const color = colors[i % colors.length];
 *       const size = Math.random() * 8 + 4;
 *
 *       return (
 *         <div
 *           key={i}
 *           className={`particle absolute ${color} rounded-full`}
 *           style={{
 *             width: `${size}px`,
 *             height: `${size}px`,
 *             '--tx': `${tx}px`,
 *             '--ty': `${ty}px`,
 *             filter: 'drop-shadow(0 0 8px currentColor)',
 *             animationDelay: `${Math.random() * 0.1}s`
 *           }}
 *         />
 *       );
 *     })}
 *   </div>
 * )}
 */

/**
 * REQUIRED CSS (already in index.css):
 *
 * @keyframes particle-explode {
 *   0% {
 *     transform: translate(0, 0) scale(1);
 *     opacity: 1;
 *   }
 *   100% {
 *     transform: translate(var(--tx), var(--ty)) scale(0);
 *     opacity: 0;
 *   }
 * }
 *
 * .particle {
 *   animation: particle-explode 1s ease-out forwards;
 * }
 *
 * @keyframes flash-bg {
 *   0%, 100% {
 *     background-color: transparent;
 *   }
 *   50% {
 *     background-color: rgba(34, 211, 238, 0.2);
 *   }
 * }
 *
 * .blaster-animation {
 *   animation: flash-bg 0.4s ease-out;
 * }
 */
