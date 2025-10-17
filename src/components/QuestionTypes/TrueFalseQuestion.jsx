import React from 'react';
import { Check, X, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const TrueFalseQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect, showCorrectAnswer = false }) => {
  const renderButton = (value, icon, label, color) => {
    const isSelected = selectedAnswer === value;
    const isCorrectAnswer = question.correct_answer.toLowerCase() === value.toLowerCase();
    const shouldGlow = showCorrectAnswer && isCorrectAnswer;

    let className = 'neon-border-purple bg-purple-900/40';
    let statusIcon = null;

    if (showResult && isSelected) {
      if (isCorrect) {
        className = 'neon-border-cyan bg-green-900/40 scale-105';
        statusIcon = <CheckCircle className="w-8 h-8 text-green-400 absolute top-4 right-4" />;
      } else {
        className = 'neon-border-pink bg-red-900/40';
        statusIcon = <XCircle className="w-8 h-8 text-red-400 absolute top-4 right-4" />;
      }
    } else if (showResult && isCorrectAnswer) {
      className = 'neon-border-cyan bg-green-900/40';
      statusIcon = <CheckCircle className="w-8 h-8 text-green-400 absolute top-4 right-4" />;
    } else if (isSelected) {
      className = 'neon-border-cyan bg-cyan-900/40';
    } else if (shouldGlow) {
      className = 'neon-border-pink bg-yellow-900/40 animate-pulse';
    }

    return (
      <button
        onClick={() => !showResult && onAnswerSelect(value)}
        disabled={showResult}
        className={`flex-1 p-8 rounded-3xl ${className} relative
          hover:scale-[1.02] transition-all duration-200 flex flex-col items-center gap-4
          ${!showResult && 'hover:brightness-110 cursor-pointer'}
          ${showResult && 'cursor-not-allowed'}`}
      >
        {statusIcon}
        <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center neon-border-${color.includes('green') ? 'cyan' : 'pink'}`}>
          {icon}
        </div>
        <span className="text-3xl font-black text-white tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-8 text-center leading-relaxed">
        {question.question_text}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {renderButton(
          'true',
          <Check className="w-12 h-12 text-white" />,
          'TRUE',
          'bg-green-600/30'
        )}
        {renderButton(
          'false',
          <X className="w-12 h-12 text-white" />,
          'FALSE',
          'bg-red-600/30'
        )}
      </div>

      {showResult && question.explanation && (
        <div className={`mt-6 p-5 rounded-2xl ${isCorrect ? 'neon-border-cyan bg-green-900/30' : 'neon-border-purple bg-purple-900/30'}`}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
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

export default TrueFalseQuestion;
