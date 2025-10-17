import React from 'react';
import { Heart, Flame, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const GameHeader = ({
  lives, // kept for future arcade mode
  correctCount = 0,
  incorrectCount = 0,
  streak,
  score,
  onlyTimer = false
}) => {
  // Only show streak when onlyTimer is true
  if (onlyTimer) {
    return (
      <div className="flex items-center gap-2">
        {/* Streak Badge with Fire Emoji */}
        <motion.div
          className={`neon-border-yellow bg-orange-900/60 rounded-full px-3 py-2 flex items-center gap-1.5 ${streak > 0 ? 'opacity-100' : 'opacity-50'}`}
          animate={{
            scale: streak > 0 ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-xl">🔥</span>
          <span className={`text-base font-black ${streak > 0 ? 'text-yellow-300' : 'text-gray-400'}`}>
            {streak}
          </span>
        </motion.div>
      </div>
    );
  }

  // Default: Should not be used anymore (kept for backward compatibility)
  return null;
};

export default GameHeader;
