import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const ShortAnswerQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');
  const maxLength = 500;

  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer]);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setAnswer(value);
    }
  };

  const handleBlur = () => {
    // Auto-submit when user clicks outside textarea (e.g., clicking "Next" button)
    if (answer.trim()) {
      onAnswerSelect(answer);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
        {question.question_text}
      </h2>

      <div className="relative">
        <textarea
          value={answer}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={showResult}
          placeholder="Type your answer here... ✍️"
          className={`w-full p-4 rounded-2xl bg-purple-900/40 text-white font-medium text-lg
            placeholder-cyan-300/50 resize-none focus:outline-none
            transition-all duration-200
            ${showResult && isCorrect && 'neon-border-cyan bg-green-900/40'}
            ${showResult && !isCorrect && 'neon-border-pink bg-red-900/40'}
            ${!showResult && 'neon-border-purple focus:neon-border-cyan'}`}
          rows="5"
        />
        <div className="absolute bottom-3 right-3 coin-badge px-2 py-1 rounded-full text-xs font-bold">
          {answer.length}/{maxLength}
        </div>
      </div>

      {showResult && (
        <div className={`p-5 rounded-2xl ${isCorrect ? 'neon-border-cyan bg-green-900/30' : 'neon-border-purple bg-purple-900/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <span className={`font-black text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Not Quite'}
            </span>
          </div>
          {!isCorrect && (
            <div className="flex items-start gap-3 mt-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-1 shrink-0" />
              <div>
                <p className="text-cyan-300 text-sm font-semibold mb-1">Expected Answer:</p>
                <p className="text-white font-medium">{question.correct_answer}</p>
              </div>
            </div>
          )}
          {question.explanation && (
            <div className={`flex items-start gap-3 ${!isCorrect ? 'mt-3 pt-3 border-t border-purple-500/30' : ''}`}>
              <Lightbulb className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
              <div>
                <p className="text-cyan-300 text-sm font-semibold mb-1">Explanation:</p>
                <p className="text-white/90 text-sm leading-relaxed">{question.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShortAnswerQuestion;
