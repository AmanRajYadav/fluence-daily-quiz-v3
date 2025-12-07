# Background Music Setup Guide

## Quick Setup (3 Steps)

### Step 1: Add Your MP3 File

1. Create the sounds directory if it doesn't exist:
   ```
   E:\fluence-quiz-v2\public\sounds\
   ```

2. Copy your background music MP3 file to:
   ```
   E:\fluence-quiz-v2\public\sounds\background-music.mp3
   ```

### Step 2: The Music Will Auto-Play

The music is already configured to:
- ✅ Play when you click the "Start Quiz" button (user action triggers it)
- ✅ Loop continuously during the quiz
- ✅ Stop when quiz ends
- ✅ Volume set to 30% (not too loud)

### Step 3: Test It

1. Run: `npm start`
2. Enter student name
3. Click "Start Quiz" → Music should start playing
4. Music will loop in background while answering questions

---

## File Structure

```
E:\fluence-quiz-v2\
├── public/
│   └── sounds/
│       └── background-music.mp3  ← Put your music here
└── src/
    └── services/
        └── soundService.js  ← Already configured
```

---

## How It Works

The `soundService.js` already has background music support:

```javascript
// In soundService.js
export const soundService = {
  backgroundMusic: new Howl({
    src: ['/sounds/background-music.mp3'],
    loop: true,
    volume: 0.3,
    html5: true  // Better for long audio files
  }),

  startBackgroundMusic() {
    this.backgroundMusic.play();
  },

  stopBackgroundMusic() {
    this.backgroundMusic.stop();
  }
};
```

And in `App.js`, it's called when quiz starts:

```javascript
const handleStartQuiz = () => {
  setGameState('playing');
  soundService.startBackgroundMusic();  // ← Starts music
  // ... rest of code
};
```

---

## Customization Options

### Change Volume
Edit `src/services/soundService.js`:

```javascript
backgroundMusic: new Howl({
  src: ['/sounds/background-music.mp3'],
  loop: true,
  volume: 0.5,  // Change this (0.0 to 1.0)
  html5: true
}),
```

### Use Different Music File
Just replace the file at `public/sounds/background-music.mp3` with your new file (keep the same name).

Or change the file name in `soundService.js`:

```javascript
src: ['/sounds/your-custom-music.mp3'],
```

### Disable Background Music
In `App.js`, comment out the music start:

```javascript
const handleStartQuiz = () => {
  setGameState('playing');
  // soundService.startBackgroundMusic();  // ← Commented out
};
```

---

## Troubleshooting

### Music Not Playing?

**Check 1: File exists**
```bash
ls public/sounds/background-music.mp3
```

**Check 2: Browser console**
Open DevTools (F12) and check for errors

**Check 3: Browser autoplay policy**
Music will only play after user clicks "Start Quiz" button (this is required by browsers)

**Check 4: File format**
MP3 is recommended. If using other formats:
- WAV: Works but large file size
- OGG: Good alternative to MP3
- M4A: May not work in all browsers

---

## Where Music Plays

✅ **Plays during:**
- Quiz gameplay (all 30 questions)
- Question transitions

❌ **Doesn't play during:**
- Menu screen (before clicking Start)
- Result screen (after quiz completion)

To enable on result screen, add this to `App.js`:

```javascript
if (gameState === 'results') {
  soundService.stopBackgroundMusic();  // ← Already there
}
```

---

## Recommended Music Settings

For quiz background music:
- **Tempo:** Moderate (not too fast, not too slow)
- **Genre:** Lo-fi, instrumental, ambient
- **Volume:** 0.2 - 0.4 (background level)
- **Length:** Any (it loops automatically)

---

**That's it!** Just drop your MP3 file in `public/sounds/background-music.mp3` and it will work.
