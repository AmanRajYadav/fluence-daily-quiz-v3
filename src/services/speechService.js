/**
 * Speech Service - Web Speech API Integration
 *
 * Automatically reads quiz questions aloud using browser's text-to-speech
 *
 * Features:
 * - Auto-read question when it appears
 * - Support for multiple languages
 * - Play/pause/stop controls
 * - Rate and pitch adjustments
 * - Browser compatibility detection
 */

class SpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.enabled = true; // Default ON for better accessibility
    this.lang = 'en-US'; // Default language
    this.rate = 1.0; // Speed (0.1 to 10)
    this.pitch = 1.0; // Pitch (0 to 2)
    this.volume = 1.0; // Volume (0 to 1)

    // Check browser support
    this.isSupported = 'speechSynthesis' in window;

    if (!this.isSupported) {
      console.warn('[SpeechService] Web Speech API not supported in this browser');
    }

    // Load available voices when they're ready
    this.voices = [];
    if (this.isSupported) {
      this.loadVoices();

      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  /**
   * Load available voices from browser
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log(`[SpeechService] Loaded ${this.voices.length} voices`);

    // Try to find a good English voice
    const preferredVoice = this.voices.find(voice =>
      voice.lang === 'en-US' || voice.lang.startsWith('en')
    );

    if (preferredVoice) {
      console.log(`[SpeechService] Using voice: ${preferredVoice.name}`);
    }
  }

  /**
   * Read text aloud
   * @param {string} text - Text to speak
   * @param {Object} options - Optional settings
   */
  speak(text, options = {}) {
    if (!this.isSupported || !this.enabled || !text) {
      return;
    }

    // Stop any ongoing speech
    this.stop();

    // Clean text for better pronunciation
    const cleanText = this.cleanText(text);

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(cleanText);

    // Apply settings
    this.utterance.lang = options.lang || this.lang;
    this.utterance.rate = options.rate || this.rate;
    this.utterance.pitch = options.pitch || this.pitch;
    this.utterance.volume = options.volume || this.volume;

    // Try to use a good voice
    const voice = this.voices.find(v => v.lang === this.utterance.lang);
    if (voice) {
      this.utterance.voice = voice;
    }

    // Event handlers
    this.utterance.onstart = () => {
      console.log('[SpeechService] Started speaking');
    };

    this.utterance.onend = () => {
      console.log('[SpeechService] Finished speaking');
    };

    this.utterance.onerror = (event) => {
      console.error('[SpeechService] Error:', event.error);
    };

    // Speak
    this.synthesis.speak(this.utterance);
  }

  /**
   * Read a quiz question aloud
   * @param {Object} question - Question object
   */
  readQuestion(question) {
    if (!question) return;

    // Build text to read based on question type
    let textToRead = '';

    // Add question number if available
    if (question.question_number) {
      textToRead += `Question ${question.question_number}. `;
    }

    // Add question text
    if (question.question_text) {
      textToRead += question.question_text;
    }

    // For MCQ, optionally read options
    if (question.question_type === 'mcq' && question.options) {
      textToRead += '. Options are: ';
      const options = JSON.parse(question.options);
      textToRead += options.join(', ');
    }

    // For True/False, add clarification
    if (question.question_type === 'true_false') {
      textToRead += '. True or False?';
    }

    // For Fill in the Blank, replace underscores
    if (question.question_type === 'fill_blank') {
      textToRead = textToRead.replace(/_{2,}/g, ' blank ');
    }

    this.speak(textToRead);
  }

  /**
   * Clean text for better pronunciation
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    let cleaned = text;

    // Remove markdown/HTML
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Replace common symbols
    cleaned = cleaned.replace(/&/g, ' and ');
    cleaned = cleaned.replace(/@/g, ' at ');
    cleaned = cleaned.replace(/#/g, ' number ');
    cleaned = cleaned.replace(/\$/g, ' dollars ');

    // Handle abbreviations
    cleaned = cleaned.replace(/etc\./g, 'etcetera');
    cleaned = cleaned.replace(/e\.g\./g, 'for example');
    cleaned = cleaned.replace(/i\.e\./g, 'that is');

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.isSupported) {
      this.synthesis.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.isSupported && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.isSupported && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   * @returns {boolean}
   */
  isSpeaking() {
    return this.isSupported && this.synthesis.speaking;
  }

  /**
   * Toggle speech on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;

    if (!this.enabled) {
      this.stop();
    }

    return this.enabled;
  }

  /**
   * Set speech rate (speed)
   * @param {number} rate - Speed (0.1 to 10)
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set speech pitch
   * @param {number} pitch - Pitch (0 to 2)
   */
  setPitch(pitch) {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set speech volume
   * @param {number} volume - Volume (0 to 1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get enabled state
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled && this.isSupported;
  }

  /**
   * Get browser support status
   * @returns {boolean}
   */
  getBrowserSupport() {
    return this.isSupported;
  }
}

// Export singleton instance
export const speechService = new SpeechService();
