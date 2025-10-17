import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const MCQQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect, hiddenOptions = [], showCorrectAnswer = false }) => {
  const options = Array.isArray(question.options)
    ? question.options
    : (typeof question.options === 'string' ? JSON.parse(question.options || '[]') : []);

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
        {question.question_text}
      </h2>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correct_answer;

          // More robust comparison - trim whitespace and compare
          const isHidden = hiddenOptions.some(hidden =>
            String(hidden).trim() === String(option).trim()
          );

          const shouldGlow = showCorrectAnswer && isCorrectOption;

          if (isHidden) {
            return (
              <div
                key={index}
                className="w-full p-4 rounded-2xl bg-purple-900/20 border-2 border-purple-700/30 opacity-40"
              >
                <div className="flex items-center gap-3">
                  <span className="neon-border-purple bg-purple-800/40 text-purple-300 font-black text-sm w-8 h-8 rounded-full flex items-center justify-center">
                    {optionLabels[index]}
                  </span>
                  <span className="text-white/40 font-medium italic">Hidden by 50:50</span>
                </div>
              </div>
            );
          }

          let className = 'neon-border-purple bg-purple-900/40';
          let icon = null;

          if (showResult && isSelected) {
            if (isCorrect) {
              className = 'neon-border-cyan bg-green-900/40 scale-105';
              icon = <CheckCircle className="w-6 h-6 text-green-400" />;
            } else {
              className = 'neon-border-pink bg-red-900/40';
              icon = <XCircle className="w-6 h-6 text-red-400" />;
            }
          } else if (showResult && isCorrectOption) {
            className = 'neon-border-cyan bg-green-900/40';
            icon = <CheckCircle className="w-6 h-6 text-green-400" />;
          } else if (isSelected) {
            className = 'neon-border-cyan bg-cyan-900/40';
          } else if (shouldGlow) {
            className = 'neon-border-pink bg-yellow-900/40 animate-pulse';
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && onAnswerSelect(option)}
              disabled={showResult}
              className={`w-full p-4 rounded-2xl ${className}
                hover:scale-[1.02] transition-all duration-200
                ${!showResult && 'hover:brightness-110 cursor-pointer'}
                ${showResult && 'cursor-not-allowed'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="coin-badge text-white font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {optionLabels[index]}
                  </span>
                  <span className="text-white font-semibold text-left">{option}</span>
                </div>
                {icon}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && question.explanation && (
        <div className={`mt-6 p-5 rounded-2xl ${isCorrect ? 'neon-border-cyan bg-green-900/30' : 'neon-border-purple bg-purple-900/30'}`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
            <div>
              <p className="text-cyan-300 text-sm font-semibold mb-1">Explanation:</p>
              <p className="text-white/90 text-sm leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
