import { Howl } from 'howler';

class SoundService {
  constructor() {
    // Get public URL for sound files
    const publicUrl = process.env.PUBLIC_URL || '';

    // Try local files first, fallback to external URLs
    // Local files are MUCH faster (no network latency)
    const getSoundUrls = (name, fallbackUrl) => {
      return [
        `${publicUrl}/sounds/${name}.mp3`, // Try local first
        fallbackUrl // Fallback to external
      ];
    };

    // External fallback URLs
    const fallbackUrls = {
      correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
      wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
      tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      powerup: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      levelup: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      complete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
    };

    // OPTIMIZATION: Remove html5 flag for Web Audio API (faster, no lag)
    // OPTIMIZATION: Preload all sounds immediately
    this.sounds = {
      correct: new Howl({
        src: getSoundUrls('correct', fallbackUrls.correct),
        volume: 0.5,
        preload: true, // Pre-load for instant playback
        onload: () => console.log('[SoundService] ✅ correct sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for correct sound');
        }
      }),
      wrong: new Howl({
        src: getSoundUrls('wrong', fallbackUrls.wrong),
        volume: 0.4,
        preload: true,
        onload: () => console.log('[SoundService] ✅ wrong sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for wrong sound');
        }
      }),
      tick: new Howl({
        src: getSoundUrls('tick', fallbackUrls.tick),
        volume: 0.2,
        loop: true,
        preload: true,
        onload: () => console.log('[SoundService] ✅ tick sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for tick sound');
        }
      }),
      powerup: new Howl({
        src: getSoundUrls('powerup', fallbackUrls.powerup),
        volume: 0.6,
        preload: true,
        onload: () => console.log('[SoundService] ✅ powerup sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for powerup sound');
        }
      }),
      levelup: new Howl({
        src: getSoundUrls('levelup', fallbackUrls.levelup),
        volume: 0.7,
        preload: true,
        onload: () => console.log('[SoundService] ✅ levelup sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for levelup sound');
        }
      }),
      complete: new Howl({
        src: getSoundUrls('complete', fallbackUrls.complete),
        volume: 0.8,
        preload: true,
        onload: () => console.log('[SoundService] ✅ complete sound loaded'),
        onloaderror: (id, error) => {
          console.warn('[SoundService] Using fallback for complete sound');
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
