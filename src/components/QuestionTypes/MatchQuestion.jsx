import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const MatchQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult, isCorrect }) => {
  // Parse options: should be { "left": [...], "right": [...] }
  const options = typeof question.options === 'string'
    ? JSON.parse(question.options || '{"left":[],"right":[]}')
    : question.options || { left: [], right: [] };

  const correctMatches = typeof question.correct_answer === 'string'
    ? JSON.parse(question.correct_answer || '{}')
    : question.correct_answer || {};

  const [matches, setMatches] = useState({});
  const [currentQuestionId, setCurrentQuestionId] = useState(question.id);
  const [allowRestore, setAllowRestore] = useState(false);

  // Reset matches when question changes - CRITICAL for multi-match questions
  useEffect(() => {
    // Check if this is a NEW question (not just a re-render)
    if (question.id !== currentQuestionId) {
      console.log('[MatchQuestion] NEW question detected, resetting matches. Old ID:', currentQuestionId, 'New ID:', question.id);
      setCurrentQuestionId(question.id);
      setMatches({}); // Clear matches for new question
      setAllowRestore(false); // Block restoration temporarily

      // Allow restoration after a brief delay (after React updates selectedAnswer prop)
      setTimeout(() => {
        setAllowRestore(true);
      }, 50);
    }
  }, [question.id, currentQuestionId]);

  // Restore matches ONLY when navigating back to a previously answered question
  useEffect(() => {
    // Only restore if:
    // 1. We have a selectedAnswer
    // 2. We're on the same question (IDs match)
    // 3. Restoration is allowed (not immediately after question change)
    // 4. Matches is currently empty (don't overwrite user input)
    if (selectedAnswer && typeof selectedAnswer === 'string' && currentQuestionId === question.id && allowRestore) {
      try {
        const parsed = JSON.parse(selectedAnswer);
        if (Object.keys(matches).length === 0 && Object.keys(parsed).length > 0) {
          console.log('[MatchQuestion] Restoring previous answer:', parsed);
          setMatches(parsed);
        }
      } catch (e) {
        console.error('[MatchQuestion] Failed to parse selectedAnswer:', e);
      }
    }
  }, [selectedAnswer, currentQuestionId, question.id, allowRestore, matches]);

  // Only auto-submit when all items are matched
  useEffect(() => {
    const leftItemsCount = options.left?.length || 0;
    const matchedCount = Object.keys(matches).length;

    // STRICT CHECK: Must have items AND all must be matched AND not showing result
    // AND we must be on the SAME question (prevents auto-submit during transitions)
    const isOnSameQuestion = currentQuestionId === question.id;

    if (leftItemsCount > 0 && matchedCount > 0 && matchedCount === leftItemsCount && !showResult && isOnSameQuestion) {
      console.log('[MatchQuestion] All items matched, auto-submitting...', { leftItemsCount, matchedCount, matches, currentQuestionId, questionId: question.id });
      onAnswerSelect(JSON.stringify(matches));
    }
  }, [matches, options.left, onAnswerSelect, showResult, currentQuestionId, question.id]);

  const handleMatch = (leftItem, rightItem) => {
    if (showResult) return;

    setMatches(prev => ({
      ...prev,
      [leftItem]: rightItem
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
        {question.question_text}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-3">
          <p className="text-cyan-300 text-sm font-semibold mb-2 text-center">Match These</p>
          {options.left.map((item, index) => {
            const matchedRight = matches[item];
            const isCorrectMatch = showResult && correctMatches[item] === matchedRight;
            const hasMatch = !!matchedRight;

            let className = 'neon-border-purple bg-purple-900/40';
            let icon = null;

            if (showResult && isCorrectMatch) {
              className = 'neon-border-cyan bg-green-900/40 scale-105';
              icon = <CheckCircle className="w-5 h-5 text-green-400" />;
            } else if (showResult && hasMatch) {
              className = 'neon-border-pink bg-red-900/40';
              icon = <XCircle className="w-5 h-5 text-red-400" />;
            } else if (hasMatch) {
              className = 'neon-border-cyan bg-cyan-900/40';
            }

            return (
              <div
                key={index}
                className={`p-4 rounded-2xl ${className} transition-all duration-200 relative`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white font-semibold">{item}</span>
                  <div className="flex items-center gap-2">
                    {matchedRight && (
                      <>
                        <ArrowRight className="w-4 h-4 text-cyan-300" />
                        <span className="text-white/90 text-sm font-medium">{matchedRight}</span>
                      </>
                    )}
                    {icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <p className="text-cyan-300 text-sm font-semibold mb-2 text-center">With These</p>
          {options.right.map((item, index) => {
            const isMatched = Object.values(matches).includes(item);

            return (
              <button
                key={index}
                onClick={() => {
                  // Match with first unmatched left item
                  const unmatchedLeft = options.left.find(left => !matches[left]);
                  if (unmatchedLeft) {
                    handleMatch(unmatchedLeft, item);
                  }
                }}
                disabled={showResult || isMatched}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-200
                  ${isMatched ? 'neon-border-purple bg-purple-900/20 opacity-40' : 'neon-border-purple bg-purple-900/40'}
                  ${!showResult && !isMatched && 'hover:neon-border-cyan hover:bg-cyan-900/30 hover:scale-[1.02] cursor-pointer'}
                  ${showResult && 'cursor-not-allowed'}`}
              >
                <span className="text-white font-semibold">{item}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="mt-4 p-5 rounded-2xl neon-border-cyan bg-purple-900/30">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-cyan-300" />
            <p className="text-cyan-300 text-sm font-bold">Correct Matches:</p>
          </div>
          {Object.entries(correctMatches).map(([left, right], index) => (
            <div key={index} className="flex items-center gap-3 text-white mb-2 last:mb-0 bg-purple-900/40 p-3 rounded-xl">
              <span className="font-semibold">{left}</span>
              <ArrowRight className="w-4 h-4 text-cyan-300" />
              <span className="font-semibold text-cyan-300">{right}</span>
            </div>
          ))}
          {question.explanation && (
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-purple-500/30">
              <CheckCircle className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
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

export default MatchQuestion;
