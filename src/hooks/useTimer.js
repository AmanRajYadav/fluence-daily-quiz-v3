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
