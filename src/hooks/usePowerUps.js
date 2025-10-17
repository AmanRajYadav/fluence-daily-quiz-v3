import { useState } from 'react';
import { soundService } from '../services/soundService';

export const usePowerUps = () => {
  const [powerUps, setPowerUps] = useState({
    fiftyFifty: { count: 2, used: false },
    blaster: { count: 2, used: false },
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

  const useBlaster = (onUse) => {
    if (powerUps.blaster.count > 0 && !powerUps.blaster.used) {
      soundService.play('powerup');
      setPowerUps(prev => ({
        ...prev,
        blaster: {
          count: prev.blaster.count - 1,
          used: true
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
      blaster: { ...prev.blaster, used: false },
      extraTime: { ...prev.extraTime, used: false },
    }));
  };

  const resetAllPowerUps = () => {
    setPowerUps({
      fiftyFifty: { count: 2, used: false },
      blaster: { count: 2, used: false },
      extraTime: { count: 2, used: false },
    });
  };

  return {
    powerUps,
    useFiftyFifty,
    useBlaster,
    useExtraTime,
    resetQuestionPowerUps,
    resetAllPowerUps,
  };
};
