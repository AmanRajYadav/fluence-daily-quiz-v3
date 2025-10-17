# 🔥 Rapid Fire Mode - Power-Ups System (PRESERVED)

This folder contains the complete power-ups system preserved from the main quiz.

## 📁 Files

### 1. `RapidFirePowerUpBar.jsx`
Complete UI component for displaying power-ups.

**Features:**
- 50:50 button (only enabled on MCQ questions)
- Blaster button (works on all question types)
- +30s Timer button (adds time to countdown)
- Count badges showing remaining uses
- Disabled state when used or unavailable

### 2. `rapidFireHandlers.js`
All power-up handler functions with full logic.

**Includes:**
- `createHandleFiftyFifty()` - Removes 2 wrong MCQ options
- `createHandleBlaster()` - Auto-selects correct answer with animation
- `createHandleExtraTime()` - Adds 30 seconds to timer
- Particle explosion animation JSX
- Required CSS documentation

## 🎮 How to Use in Rapid Fire Mode

### Step 1: Import Dependencies
```javascript
import { usePowerUps } from '../../hooks/usePowerUps';
import { useTimer } from '../../hooks/useTimer';
import RapidFirePowerUpBar from './RapidFirePowerUpBar';
import { createHandleFiftyFifty, createHandleBlaster, createHandleExtraTime } from './rapidFireHandlers';
```

### Step 2: Initialize Hooks
```javascript
// Power-ups hook
const {
  powerUps,
  useFiftyFifty: activateFiftyFifty,
  useBlaster: activateBlaster,
  useExtraTime: activateExtraTime,
  resetQuestionPowerUps,
  resetAllPowerUps
} = usePowerUps();

// Timer hook (30 seconds for rapid fire)
const { timeLeft, start: startTimer, pause: pauseTimer, reset: resetTimer, addTime } = useTimer(30, handleTimeUp);

// Game state
const [hiddenOptions, setHiddenOptions] = useState([]);
const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
const [blasterActive, setBlasterActive] = useState(false);
```

### Step 3: Create Handlers
```javascript
const handleFiftyFifty = createHandleFiftyFifty({
  activateFiftyFifty,
  questions,
  currentQuestion,
  setHiddenOptions
});

const handleBlaster = createHandleBlaster({
  activateBlaster,
  questions,
  currentQuestion,
  setBlasterActive,
  setShowCorrectAnswer,
  handleAnswerSelect
});

const handleExtraTime = createHandleExtraTime({
  activateExtraTime,
  addTime
});
```

### Step 4: Render UI
```javascript
<RapidFirePowerUpBar
  powerUps={powerUps}
  onUseFiftyFifty={handleFiftyFifty}
  onUseBlaster={handleBlaster}
  onUseExtraTime={handleExtraTime}
  currentQuestionType={questions[currentQuestion]?.question_type}
/>
```

### Step 5: Add Blaster Animation
```javascript
<div className={`question-card ${blasterActive ? 'blaster-animation' : ''}`}>
  {/* Particle explosion */}
  {blasterActive && (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * 2 * Math.PI;
        const distance = 300;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const colors = ['bg-cyan-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-blue-400'];
        const color = colors[i % colors.length];
        const size = Math.random() * 8 + 4;

        return (
          <div
            key={i}
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

  {/* Question content */}
</div>
```

### Step 6: Track Power-Ups Usage (for database)
```javascript
const powerUpsUsed = {
  fifty_fifty: 2 - powerUps.fiftyFifty.count,
  blaster: 2 - powerUps.blaster.count,
  extra_time: 2 - powerUps.extraTime.count
};

// Include in submission payload
const data = {
  // ... other fields
  power_ups_used: powerUpsUsed
};
```

## 🎨 CSS Requirements

The following CSS is already in `src/index.css`:

```css
@keyframes particle-explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}

.particle {
  animation: particle-explode 1s ease-out forwards;
}

@keyframes flash-bg {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(34, 211, 238, 0.2);
  }
}

.blaster-animation {
  animation: flash-bg 0.4s ease-out;
}
```

## 🎯 Rapid Fire Game Mode Concept

**Features:**
- ⏱️ **30-second timer** per question (faster than regular quiz)
- 🔥 **Power-ups enabled** (50:50, Blaster, +30s)
- ❤️ **3 lives system** (lose life on wrong answer, game over at 0)
- ⚡ **Infinite questions** (keeps going until lives run out)
- 🏆 **High score tracking** (how many questions answered correctly)
- 💎 **Bonus points** for speed and streaks

## 📊 Database Schema (Already Exists)

Power-ups are tracked in:
- `quiz_results.answers_json.metadata.power_ups_used`
- `quiz_history.power_ups_used` (JSONB column)

Example:
```json
{
  "fifty_fifty": 1,
  "blaster": 2,
  "extra_time": 0
}
```

## ✅ What's Already Working

- ✅ `usePowerUps` hook (in `src/hooks/usePowerUps.js`)
- ✅ `useTimer` hook (in `src/hooks/useTimer.js`)
- ✅ Sound effects integration (`soundService.play('powerup')`)
- ✅ All CSS animations
- ✅ MCQQuestion component supports `hiddenOptions` prop
- ✅ Database schema supports power-ups tracking

## 🚀 Ready to Build!

Everything is preserved and documented. When you're ready to build Rapid Fire mode, just:

1. Copy this folder's code
2. Create `RapidFireGame.jsx` component
3. Follow the usage guide above
4. Adjust timer from 60s → 30s
5. Add lives system (3 hearts)
6. Implement infinite question generation

---

**Last Updated:** 2025-01-11
**Status:** Preserved for future implementation
