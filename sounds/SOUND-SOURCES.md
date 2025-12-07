# Sound Files for Fluence Quiz

## Required Sound Files

Place the following sound files in this directory (`public/sounds/`):

### 1. **correct.mp3** (Correct Answer Sound)
- **Purpose:** Plays when student answers correctly
- **Suggested Sources:**
  - [Freesound.org - Success](https://freesound.org/search/?q=success+notification)
  - [Zapsplat.com - Success](https://www.zapsplat.com/sound-effect-category/success-sounds/)
  - Search for: "success chime", "correct answer", "positive notification"

### 2. **wrong.mp3** (Wrong Answer Sound)
- **Purpose:** Plays when student answers incorrectly
- **Suggested Sources:**
  - [Freesound.org - Error](https://freesound.org/search/?q=error+buzzer)
  - [Zapsplat.com - Error](https://www.zapsplat.com/sound-effect-category/error-sounds/)
  - Search for: "error buzz", "wrong answer", "negative notification"

### 3. **powerup.mp3** (Power-Up Activation)
- **Purpose:** Plays when power-up is used (50:50, Blaster, +30s)
- **Suggested Sources:**
  - [Freesound.org - Power Up](https://freesound.org/search/?q=power+up)
  - [Zapsplat.com - Game Power Up](https://www.zapsplat.com/sound-effect-category/game-sounds/)
  - Search for: "power up", "game boost", "magic spell"

### 4. **levelup.mp3** (Level Up / Streak Milestone)
- **Purpose:** Plays on streak milestones (5, 10, 15, 20)
- **Suggested Sources:**
  - [Freesound.org - Level Up](https://freesound.org/search/?q=level+up)
  - [Zapsplat.com - Achievement](https://www.zapsplat.com/sound-effect-category/achievement-sounds/)
  - Search for: "level up", "achievement unlocked", "fanfare"

### 5. **complete.mp3** (Quiz Completion)
- **Purpose:** Plays when quiz is finished
- **Suggested Sources:**
  - [Freesound.org - Victory](https://freesound.org/search/?q=victory+fanfare)
  - [Zapsplat.com - Victory](https://www.zapsplat.com/sound-effect-category/victory-sounds/)
  - Search for: "quiz complete", "victory", "celebration"

### 6. **tick.mp3** (Timer Tick - OPTIONAL)
- **Purpose:** Plays during countdown (looping)
- **Suggested Sources:**
  - [Freesound.org - Clock Tick](https://freesound.org/search/?q=clock+tick)
  - Search for: "clock tick", "timer", "countdown"
- **Note:** Timer is currently disabled in regular quiz mode

### 7. **background-music.mp3** (Background Music - OPTIONAL)
- **Purpose:** Ambient music during quiz
- **Suggested Sources:**
  - [Incompetech.com](https://incompetech.com/music/royalty-free/) (CC licensed)
  - [Bensound.com](https://www.bensound.com/) (free with attribution)
  - Search for: "upbeat game music", "background music", "energetic instrumental"
- **Tip:** Choose something non-distracting, around 90-120 BPM

## How to Download

### From Freesound.org:
1. Create free account
2. Search for the sound type (e.g., "success notification")
3. Preview and select appropriate sound
4. Download as MP3 (or convert if needed)
5. Rename to match the filenames above
6. Place in `public/sounds/` directory

### From Zapsplat.com:
1. Create free account
2. Browse by category or search
3. Download sound (MP3 format)
4. Rename to match required filenames
5. Place in `public/sounds/` directory

## License Requirements

- ✅ **Commercial Use:** Make sure sounds allow commercial use if deploying publicly
- ✅ **Attribution:** Check if attribution is required (add to CREDITS.md if needed)
- ✅ **Creative Commons:** Look for CC0 (public domain) or CC-BY (attribution) licenses

## File Specifications

- **Format:** MP3 (recommended)
- **Quality:** 128-192 kbps (good balance of quality and file size)
- **Duration:**
  - correct/wrong/powerup: 0.5-2 seconds
  - levelup/complete: 2-5 seconds
  - background-music: 1-3 minutes (will loop)
  - tick: 0.2-0.5 seconds (will loop)

## Testing After Adding Files

1. Place sound files in `public/sounds/`
2. Restart development server: `npm start`
3. Take a quiz and test all sounds:
   - Answer correctly → correct.mp3
   - Answer wrong → wrong.mp3
   - Use power-up → powerup.mp3
   - Reach streak 5/10/15/20 → levelup.mp3
   - Complete quiz → complete.mp3
   - Enable music in settings → background-music.mp3

## Troubleshooting

**If sounds don't play:**
1. Check browser console for errors
2. Verify files are in `public/sounds/` directory
3. Ensure files are named exactly as listed (case-sensitive)
4. Try opening: `http://localhost:3000/sounds/correct.mp3` directly in browser
5. Check SFX is enabled in Settings (⚙️)

## Quick Start (Placeholder Sounds)

If you need placeholder sounds quickly:
1. Use Audacity or any audio editor
2. Generate simple tones:
   - Correct: 440 Hz + 554 Hz chord, 0.5s
   - Wrong: 220 Hz, 0.5s
   - PowerUp: Rising tone 440→880 Hz, 1s
   - Level Up: 440→554→659→880 Hz arpeggio, 2s
   - Complete: Triumphant chord, 3s
3. Export as MP3, place in `public/sounds/`

---

**Status:** ⚠️ SOUND FILES NOT INCLUDED
**Action Required:** Download and add sound files to enable audio feedback
