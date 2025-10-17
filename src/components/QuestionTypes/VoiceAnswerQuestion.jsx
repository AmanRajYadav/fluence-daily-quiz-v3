import React, { useState, useEffect } from 'react';
import { Mic, Square, CheckCircle, AlertCircle } from 'lucide-react';

const VoiceAnswerQuestion = ({ question, selectedAnswer, onAnswerSelect, showResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(selectedAnswer || '');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'en-IN'; // English (India)
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      onAnswerSelect(speechResult);
      setIsRecording(false);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsRecording(false);
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    setRecognition(recognitionInstance);
  }, [onAnswerSelect]);

  const startRecording = () => {
    if (recognition && !showResult) {
      setError('');
      setIsRecording(true);
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 text-center leading-relaxed">
        {question.question_text}
      </h2>

      <div className="flex flex-col items-center gap-6">
        {!error && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={showResult}
            className={`relative p-12 rounded-full transition-all duration-300 ${
              isRecording
                ? 'neon-border-pink bg-red-900/40 animate-pulse scale-110'
                : 'neon-border-cyan bg-cyan-900/40 hover:scale-105'
            } ${showResult && 'opacity-50 cursor-not-allowed neon-border-purple bg-purple-900/40'}`}
          >
            {isRecording ? (
              <Square className="w-16 h-16 text-white fill-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
            {isRecording && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        )}

        <div className="text-center">
          <p className="text-white text-xl font-black">
            {isRecording ? '🔴 Recording... Speak now!' : '🎤 Click to record your answer'}
          </p>
          <p className="text-cyan-300 text-sm mt-2">
            {isRecording ? 'Click again to stop' : 'Speak clearly in English'}
          </p>
        </div>

        {error && (
          <div className="w-full p-5 neon-border-pink bg-red-900/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-white font-bold">Error</p>
            </div>
            <p className="text-white/90 mb-3">{error}</p>
            <p className="text-white/70 text-sm">
              Try typing your answer in a short answer instead.
            </p>
          </div>
        )}

        {transcript && (
          <div className="w-full p-5 neon-border-cyan bg-purple-900/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-cyan-300" />
              <p className="text-cyan-300 text-sm font-bold">Your Answer:</p>
            </div>
            <p className="text-white font-semibold text-lg bg-purple-900/40 p-4 rounded-xl">
              "{transcript}"
            </p>
          </div>
        )}
      </div>

      {showResult && question.explanation && (
        <div className="mt-4 p-5 neon-border-purple bg-purple-900/30 rounded-2xl">
          <p className="text-cyan-300 text-sm font-bold mb-2">Explanation:</p>
          <p className="text-white font-medium">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAnswerQuestion;
