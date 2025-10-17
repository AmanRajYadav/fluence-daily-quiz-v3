import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const FillBlankQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');

  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer]);

  // Split question text by blank marker (handles _, ___, _____, etc.)
  const blankRegex = /_{1,}/g;
  const parts = question.question_text.split(blankRegex);
  const hasBlank = blankRegex.test(question.question_text);

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    // Don't call onAnswerSelect on every keystroke - only on blur/submit
  };

  const handleBlur = () => {
    if (answer.trim() && !showResult) {
      onAnswerSelect(answer);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && answer.trim() && !showResult) {
      onAnswerSelect(answer);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-900/30 neon-border-purple rounded-2xl p-6">
        <div className="text-2xl font-bold text-white mb-2 flex items-center flex-wrap gap-3 justify-center">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="text-cyan-300">{part}</span>
              {index < parts.length - 1 && (
                <div className="inline-block">
                  <input
                    type="text"
                    value={answer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    disabled={showResult}
                    className={`px-4 py-3 rounded-xl text-white text-center font-black text-xl
                      placeholder-cyan-300/50 focus:outline-none min-w-[200px]
                      transition-all duration-200
                      ${showResult && isCorrect && 'neon-border-cyan bg-green-900/40'}
                      ${showResult && !isCorrect && 'neon-border-pink bg-red-900/40'}
                      ${!showResult && 'neon-border-purple bg-purple-900/60 focus:neon-border-cyan'}`}
                    placeholder="Type here..."
                    autoFocus={!showResult}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
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
              {isCorrect ? 'Perfect!' : 'Not Quite'}
            </span>
          </div>
          {!isCorrect && (
            <div className="flex items-start gap-3 mt-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-1 shrink-0" />
              <div>
                <p className="text-cyan-300 text-sm font-semibold mb-1">Correct Answer:</p>
                <p className="text-white font-black text-xl">{question.correct_answer}</p>
              </div>
            </div>
          )}
          {question.explanation && (
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-purple-500/30">
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

export default FillBlankQuestion;
