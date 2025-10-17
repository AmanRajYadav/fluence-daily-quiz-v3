import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, Music, Zap, Info, User } from 'lucide-react';

const Settings = ({ student, musicEnabled, setMusicEnabled, sfxEnabled, setSfxEnabled, onBack }) => {
  const [sfxVolume, setSfxVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(50);
  const [showAbout, setShowAbout] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    const savedMusicVolume = localStorage.getItem('musicVolume');

    if (savedSfxVolume) setSfxVolume(parseInt(savedSfxVolume));
    if (savedMusicVolume) setMusicVolume(parseInt(savedMusicVolume));
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('sfxVolume', sfxVolume.toString());
    localStorage.setItem('musicVolume', musicVolume.toString());
    localStorage.setItem('musicEnabled', musicEnabled.toString());
    localStorage.setItem('sfxEnabled', sfxEnabled.toString());
  };

  useEffect(() => {
    saveSettings();
  }, [sfxVolume, musicVolume, musicEnabled, sfxEnabled]);

  return (
    <div className="min-h-screen game-bg p-4">
      <div className="max-w-3xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </button>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
              Settings
            </h1>
            <p className="text-cyan-300">Customize your quiz experience</p>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="neon-border-cyan bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-lg rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white">
              {(student?.display_name || 'U')[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{student?.display_name || 'Guest'}</h2>
              <p className="text-cyan-300 text-sm">{student?.grade || 'Student'}</p>
            </div>
          </div>

          {student?.subjects && student.subjects.length > 0 && (
            <div>
              <p className="text-cyan-300 text-sm mb-2">Subjects:</p>
              <div className="flex flex-wrap gap-2">
                {student.subjects.map((subject, i) => (
                  <span
                    key={i}
                    className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Settings */}
        <div className="neon-border-purple bg-gradient-to-br from-purple-900/60 to-purple-800/60 backdrop-blur-lg rounded-3xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-pink-400" />
            Audio Settings
          </h2>

          <div className="space-y-6">
            {/* Background Music */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-pink-400' : 'text-gray-500'}`} />
                  <span className="text-white font-bold">Background Music</span>
                </div>
                <button
                  onClick={() => setMusicEnabled(!musicEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    musicEnabled ? 'bg-pink-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                      musicEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {musicEnabled && (
                <div className="ml-7">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${musicVolume}%, rgb(75 85 99) ${musicVolume}%, rgb(75 85 99) 100%)`
                    }}
                  />
                  <p className="text-cyan-300 text-sm mt-2">Volume: {musicVolume}%</p>
                </div>
              )}
            </div>

            {/* Sound Effects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${sfxEnabled ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <span className="text-white font-bold">Sound Effects</span>
                </div>
                <button
                  onClick={() => setSfxEnabled(!sfxEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    sfxEnabled ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                      sfxEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {sfxEnabled && (
                <div className="ml-7">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    onChange={(e) => setSfxVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(234 179 8) 0%, rgb(234 179 8) ${sfxVolume}%, rgb(75 85 99) ${sfxVolume}%, rgb(75 85 99) 100%)`
                    }}
                  />
                  <p className="text-cyan-300 text-sm mt-2">Volume: {sfxVolume}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="neon-border-cyan bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-lg rounded-3xl p-6">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">About Fluence Quiz</h2>
            </div>
            <span className="text-cyan-300">{showAbout ? '−' : '+'}</span>
          </button>

          {showAbout && (
            <div className="mt-4 space-y-3 text-cyan-300">
              <p className="text-sm">
                <span className="font-bold text-white">Version:</span> 2.0.0
              </p>
              <p className="text-sm">
                <span className="font-bold text-white">Developer:</span> Fluence Education
              </p>
              <p className="text-sm leading-relaxed">
                Fluence Quiz is an AI-powered learning platform designed to make education fun, engaging,
                and personalized. With gamification, spaced repetition, and real-time leaderboards,
                learning has never been more exciting!
              </p>
              <div className="flex gap-2 mt-4">
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold">
                  React 19
                </span>
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
                  Supabase
                </span>
                <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs font-bold">
                  n8n
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              saveSettings();
              onBack();
            }}
            className="neon-border-pink bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-lg py-4 px-8 rounded-full
              hover:from-pink-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-2xl uppercase tracking-wider"
          >
            Save & Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
