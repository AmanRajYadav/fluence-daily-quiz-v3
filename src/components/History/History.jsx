import React, { useState, useEffect } from 'react';
import { Calendar, Book, Trophy, ArrowLeft, Clock, Star, Target, TrendingUp, Play } from 'lucide-react';
import { getQuizHistory, getNotesHistory, getQuestionsByDate } from '../../services/historyService';
import LoadingSpinner from '../LoadingSpinner';
import ProgressChart from './ProgressChart';

const History = ({ student, onBack, onReplayQuiz }) => {
  const [view, setView] = useState('calendar'); // calendar, quizzes, notes
  const [selectedDate, setSelectedDate] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [notesHistory, setNotesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showProgressChart, setShowProgressChart] = useState(false);

  // Available subjects (could be fetched from student profile)
  const subjects = ['all', 'Math', 'English', 'Science', 'Social Science'];

  // Handle quiz replay
  const handleReplayQuiz = async (quiz) => {
    try {
      // Fetch the questions from that date
      const questions = await getQuestionsByDate(student.id, quiz.quiz_date);

      if (questions && questions.length > 0) {
        // Call parent function to start quiz in replay mode
        if (onReplayQuiz) {
          onReplayQuiz(questions, quiz);
        }
      } else {
        alert('Questions for this quiz are no longer available.');
      }
    } catch (error) {
      console.error('Error loading quiz for replay:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  // Load all history on mount
  useEffect(() => {
    if (student) {
      loadHistory();
    }
  }, [student]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const quizzes = await getQuizHistory(student.id);
      const notes = await getNotesHistory(student.id);
      setQuizHistory(quizzes || []);
      setNotesHistory(notes || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates from history
  const getHistoryDates = () => {
    const quizDates = quizHistory.map(q => q.quiz_date);
    const noteDates = notesHistory.map(n => n.note_date);
    return [...new Set([...quizDates, ...noteDates])].sort().reverse();
  };

  // Filter by subject
  const filterBySubject = (items, dateField) => {
    if (selectedSubject === 'all') return items;
    return items.filter(item => item.subject === selectedSubject);
  };

  // Get items for selected date
  const getItemsForDate = (date) => {
    const quizzes = quizHistory.filter(q => q.quiz_date === date);
    const notes = notesHistory.filter(n => n.note_date === date);
    return { quizzes, notes };
  };

  // Render Calendar View
  const renderCalendar = () => {
    const historyDates = getHistoryDates();

    if (loading) {
      return <LoadingSpinner message="Loading your history..." />;
    }

    if (historyDates.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="w-20 h-20 text-cyan-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No History Yet</h3>
          <p className="text-cyan-300">Complete quizzes to see your learning journey!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {historyDates.map((date, index) => {
            const { quizzes, notes } = getItemsForDate(date);
            const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <button
                key={date}
                onClick={() => {
                  setSelectedDate(date);
                  setView('detail');
                }}
                className="neon-border-cyan bg-cyan-900/20 p-6 rounded-2xl hover:bg-cyan-800/30 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{displayDate}</h3>
                  <div className="flex gap-2">
                    {quizzes.length > 0 && (
                      <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {quizzes.length} Quiz{quizzes.length > 1 ? 'zes' : ''}
                      </span>
                    )}
                    {notes.length > 0 && (
                      <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Book className="w-4 h-4" />
                        {notes.length} Note{notes.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {quizzes.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <p className="text-cyan-300 text-xs">Score</p>
                      <p className="text-white font-bold">{quizzes[quizzes.length - 1].score.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <p className="text-cyan-300 text-xs">Questions</p>
                      <p className="text-white font-bold">{quizzes[quizzes.length - 1].total_questions}</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <p className="text-cyan-300 text-xs">Streak</p>
                      <p className="text-white font-bold">🔥 {quizzes[quizzes.length - 1].highest_streak || 0}</p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Detail View for selected date
  const renderDetail = () => {
    if (!selectedDate) return null;

    const { quizzes, notes } = getItemsForDate(selectedDate);
    const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-2">{displayDate}</h2>
          <p className="text-cyan-300">Your learning activities from this day</p>
        </div>

        {/* Quizzes */}
        {quizzes.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-pink-400" />
              Quiz Results
            </h3>
            <div className="space-y-4">
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="neon-border-pink bg-pink-900/20 p-6 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {quiz.subject || 'General'} Quiz
                      </h4>
                      <p className="text-pink-300 text-sm">
                        Completed at {new Date(quiz.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">
                        {quiz.score.toFixed(0)}%
                      </div>
                      <p className="text-pink-300 text-sm">Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/10 p-3 rounded-lg text-center">
                      <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{quiz.correct_answers}/{quiz.total_questions}</p>
                      <p className="text-cyan-300 text-xs">Correct</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg text-center">
                      <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{Math.floor(quiz.time_taken_seconds / 60)}m {quiz.time_taken_seconds % 60}s</p>
                      <p className="text-cyan-300 text-xs">Time</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg text-center">
                      <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-white font-bold">🔥 {quiz.highest_streak || 0}</p>
                      <p className="text-cyan-300 text-xs">Best Streak</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg text-center">
                      <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{quiz.total_score || 0}</p>
                      <p className="text-cyan-300 text-xs">Points</p>
                    </div>
                  </div>

                  {quiz.concepts_tested && quiz.concepts_tested.length > 0 && (
                    <div className="mt-4">
                      <p className="text-cyan-300 text-sm mb-2">Concepts Covered:</p>
                      <div className="flex flex-wrap gap-2">
                        {quiz.concepts_tested.map((concept, i) => (
                          <span
                            key={i}
                            className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replay Quiz Button */}
                  <button
                    onClick={() => handleReplayQuiz(quiz)}
                    className="w-full mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl
                      hover:from-pink-500 hover:to-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Replay This Quiz (Review Mode)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Replay Quiz Handler */}
        {onReplayQuiz && (
          <></>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Book className="w-6 h-6 text-yellow-400" />
              Class Notes
            </h3>
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div
                  key={note.id}
                  className="neon-border-yellow bg-yellow-900/20 p-6 rounded-2xl"
                >
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-white mb-1">
                      {note.title || `${note.subject} Notes`}
                    </h4>
                    <p className="text-yellow-300 text-sm">
                      {note.subject && `Subject: ${note.subject}`}
                    </p>
                  </div>

                  {note.concepts_covered && note.concepts_covered.length > 0 && (
                    <div className="mb-4">
                      <p className="text-yellow-300 text-sm mb-2">Topics Covered:</p>
                      <div className="flex flex-wrap gap-2">
                        {note.concepts_covered.map((concept, i) => (
                          <span
                            key={i}
                            className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => window.open('#', '_blank')} // TODO: Open note in new tab
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-xl
                      hover:from-yellow-500 hover:to-orange-500 transition-all"
                  >
                    View Notes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {quizzes.length === 0 && notes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-cyan-300">No activities found for this date.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4">
      {/* Progress Chart Modal */}
      {showProgressChart && (
        <ProgressChart
          student={student}
          onClose={() => setShowProgressChart(false)}
        />
      )}

      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={view === 'detail' ? () => setView('calendar') : onBack}
            className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {view === 'detail' ? 'Back to Calendar' : 'Back to Menu'}
          </button>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
              Learning History
            </h1>
            <p className="text-cyan-300">Track your progress and review past lessons</p>
          </div>

          {/* Progress Chart Button */}
          {view === 'calendar' && quizHistory.length > 0 && (
            <div className="text-center">
              <button
                onClick={() => setShowProgressChart(true)}
                className="neon-border-cyan bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full
                  hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-xl
                  flex items-center gap-2 mx-auto"
              >
                <TrendingUp className="w-5 h-5" />
                View Progress Chart
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-6">
          {view === 'calendar' && renderCalendar()}
          {view === 'detail' && renderDetail()}
        </div>
      </div>
    </div>
  );
};

export default History;
