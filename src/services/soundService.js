import { Howl } from 'howler';

class SoundService {
  constructor() {
    // Get public URL for sound files
    const publicUrl = process.env.PUBLIC_URL || '';

    // Fallback URLs (external) if local files don't exist
    const fallbackUrls = {
      correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
      wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
      tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      powerup: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      levelup: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      complete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
    };

    // Sound effects - Use EXTERNAL URLs directly (local files optional)
    // Howler's fallback doesn't work well with CORS, so we use external URLs as primary
    this.sounds = {
      correct: new Howl({
        src: [fallbackUrls.correct],
        volume: 0.5,
        html5: true, // Use HTML5 audio for better compatibility
        onload: () => console.log('[SoundService] ✅ correct sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load correct sound:', error);
        }
      }),
      wrong: new Howl({
        src: [fallbackUrls.wrong],
        volume: 0.4,
        html5: true,
        onload: () => console.log('[SoundService] ✅ wrong sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load wrong sound:', error);
        }
      }),
      tick: new Howl({
        src: [fallbackUrls.tick],
        volume: 0.2,
        loop: true,
        html5: true,
        onload: () => console.log('[SoundService] ✅ tick sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load tick sound:', error);
        }
      }),
      powerup: new Howl({
        src: [fallbackUrls.powerup],
        volume: 0.6,
        html5: true,
        onload: () => console.log('[SoundService] ✅ powerup sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load powerup sound:', error);
        }
      }),
      levelup: new Howl({
        src: [fallbackUrls.levelup],
        volume: 0.7,
        html5: true,
        onload: () => console.log('[SoundService] ✅ levelup sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load levelup sound:', error);
        }
      }),
      complete: new Howl({
        src: [fallbackUrls.complete],
        volume: 0.8,
        html5: true,
        onload: () => console.log('[SoundService] ✅ complete sound loaded'),
        onloaderror: (id, error) => {
          console.error('[SoundService] ❌ Failed to load complete sound:', error);
        }
      }),
    };

    // Background music - Custom local file
    // Place your MP3 at: public/sounds/background-music.mp3
    this.bgMusic = new Howl({
      src: [`${publicUrl}/sounds/background-music.mp3`],
      loop: true,
      volume: 0.2, // Lowered volume so it stays in background
      html5: true, // Use HTML5 Audio for streaming (better for large files)
      preload: true,
      format: ['mp3'],
      onload: () => {
        console.log('[SoundService] ✅ Background music loaded successfully!');
      },
      onloaderror: (id, error) => {
        console.warn('[SoundService] background-music.mp3 not found - see public/sounds/SOUND-SOURCES.md');
      },
      onplayerror: (id, error) => {
        console.error('[SoundService] ❌ Playback error:', error);
        console.log('[SoundService] Click anywhere on the page first (browser requires user interaction)');
      }
    });

    this.enabled = true;
    this.musicEnabled = false;
  }

  // Start background music
  startBackgroundMusic() {
    this.musicEnabled = true;
    this.bgMusic.play();
  }

  // Stop background music
  stopBackgroundMusic() {
    this.musicEnabled = false;
    this.bgMusic.stop();
  }

  play(soundName) {
    if (this.enabled && this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }

  stop(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.bgMusic.play();
    } else {
      this.bgMusic.stop();
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  isSFXEnabled() {
    return this.enabled;
  }
}

export const soundService = new SoundService();
