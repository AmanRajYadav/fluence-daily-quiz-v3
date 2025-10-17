import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white/70 text-xs font-semibold">Question {current} of {total}</span>
        <span className="text-white/70 text-xs font-semibold">{Math.round(percentage)}%</span>
      </div>
      <div className="relative h-2 bg-purple-900/40 rounded-full overflow-hidden neon-border-purple">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
