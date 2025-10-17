import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Zap, Clock } from 'lucide-react';

const PowerUpBar = ({ powerUps, onUseFiftyFifty, onUseBlaster, onUseExtraTime, currentQuestionType }) => {
  const PowerUpButton = ({ icon: Icon, count, used, onClick, label, neonClass, bgClass, disabled = false }) => (
    <motion.button
      whileHover={{ scale: count > 0 && !used && !disabled ? 1.08 : 1 }}
      whileTap={{ scale: count > 0 && !used && !disabled ? 0.92 : 1 }}
      onClick={onClick}
      disabled={count === 0 || used || disabled}
      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all min-w-[60px]
        ${count > 0 && !used && !disabled
          ? `${neonClass} ${bgClass} hover:brightness-110 cursor-pointer`
          : 'neon-border-purple bg-purple-900/20 opacity-40 cursor-not-allowed'
        }`}
    >
      <Icon className="w-6 h-6 text-white" />
      <span className="text-[10px] text-white font-bold uppercase leading-none">{label}</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 coin-badge text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </motion.button>
  );

  return (
    <div className="flex gap-2.5 justify-center">
      <PowerUpButton
        icon={Scissors}
        count={powerUps.fiftyFifty.count}
        used={powerUps.fiftyFifty.used}
        onClick={onUseFiftyFifty}
        label="50:50"
        neonClass="neon-border-cyan"
        bgClass="bg-blue-900/40"
        disabled={currentQuestionType !== 'mcq'}
      />
      <PowerUpButton
        icon={Zap}
        count={powerUps.blaster.count}
        used={powerUps.blaster.used}
        onClick={onUseBlaster}
        label="Blaster"
        neonClass="neon-border-pink"
        bgClass="bg-green-900/40"
      />
      <PowerUpButton
        icon={Clock}
        count={powerUps.extraTime.count}
        used={powerUps.extraTime.used}
        onClick={onUseExtraTime}
        label="+30s"
        neonClass="neon-border-purple"
        bgClass="bg-orange-900/40"
      />
    </div>
  );
};

export default PowerUpBar;
