import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const FillBlankQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  // Parse question to find number of blanks (2+ underscores)
  const blankRegex = /_{2,}/g;
  const blanks = (question.question_text.match(blankRegex) || []).length;

  // Initialize answers array based on number of blanks
  const initializeAnswers = () => {
    if (selectedAnswer) {
      try {
        const parsed = JSON.parse(selectedAnswer);
        return Array.isArray(parsed) ? parsed : [selectedAnswer];
      } catch {
        return [selectedAnswer];
      }
    }
    return Array(Math.max(1, blanks)).fill('');
  };

  const [answers, setAnswers] = useState(initializeAnswers);

  useEffect(() => {
    setAnswers(initializeAnswers());
  }, [selectedAnswer, blanks]);

  // Handle answer change for specific blank
  const handleChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  // Submit answer(s)
  const submitAnswer = () => {
    if (showResult) return;
    const hasAnswer = answers.some(ans => ans.trim());
    if (!hasAnswer) return;
    const answerToSubmit = blanks > 1 ? JSON.stringify(answers) : answers[0];
    onAnswerSelect(answerToSubmit);
  };

  const handleBlur = () => {
    const allFilled = answers.every(ans => ans.trim());
    if (allFilled && !showResult) {
      submitAnswer();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.key === 'Enter' && !showResult) {
      if (index === answers.length - 1 || answers.length === 1) {
        const allFilled = answers.every(ans => ans.trim());
        if (allFilled) {
          submitAnswer();
        }
      } else {
        const nextInput = document.getElementById(`blank-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Split question text and create parts with input fields
  const renderQuestion = () => {
    const parts = question.question_text.split(blankRegex);
    let blankIndex = 0;

    return (
      <div className="text-2xl font-bold text-white mb-2 flex items-center flex-wrap gap-3 justify-center">
        {parts.map((part, partIndex) => (
          <React.Fragment key={partIndex}>
            {part && <span className="text-cyan-300">{part}</span>}
            {partIndex < parts.length - 1 && (
              <div className="inline-block" key={`input-${blankIndex}`}>
                <input
                  id={`blank-${blankIndex}`}
                  type="text"
                  value={answers[blankIndex] || ''}
                  onChange={(e) => handleChange(blankIndex, e.target.value)}
                  onBlur={handleBlur}
                  onKeyPress={(e) => handleKeyPress(e, blankIndex)}
                  disabled={showResult}
                  className={`px-4 py-3 rounded-xl text-white text-center font-black text-xl
                    placeholder-cyan-300/50 focus:outline-none min-w-[200px]
                    transition-all duration-200
                    ${showResult && isCorrect && 'neon-border-cyan bg-green-900/40'}
                    ${showResult && !isCorrect && 'neon-border-pink bg-red-900/40'}
                    ${!showResult && 'neon-border-purple bg-purple-900/60 focus:neon-border-cyan'}`}
                  placeholder={`Blank ${blankIndex + 1}`}
                  autoFocus={blankIndex === 0 && !showResult}
                />
                {(() => {
                  blankIndex++;
                  return null;
                })()}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-900/30 neon-border-purple rounded-2xl p-6">
        {renderQuestion()}
        {blanks > 1 && !showResult && (
          <p className="text-cyan-300/70 text-sm text-center mt-4">
            Fill in all {blanks} blanks • Press Enter to move to next
          </p>
        )}
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
                <p className="text-cyan-300 text-sm font-semibold mb-1">Correct Answer{blanks > 1 ? 's' : ''}:</p>
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
