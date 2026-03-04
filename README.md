# Pixel Beat Studio

A browser-based drum emulator and sheet music editor with a dark 8-bit aesthetic inspired by Undertale.

![Pixel Beat Studio](https://img.shields.io/badge/version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18+-blue)
![Tone.js](https://img.shields.io/badge/Tone.js-audio-green)
![VexFlow](https://img.shields.io/badge/VexFlow-notation-orange)

## Features

- **Visual Drum Kit** - Pixel art drum kit with 9 pieces (kick, snare, hi-hats, toms, cymbals)
- **Dual Input Modes** - Live recording via keyboard or step sequencer grid
- **Step Sequencer** - 9-row grid with adjustable resolution (8/16/32 steps)
- **Sheet Music Editor** - VexFlow-based percussion notation
- **Audio Engine** - Tone.js with synthesized sounds and custom sample upload
- **MIDI Export** - Export patterns as standard MIDI files
- **Save/Load** - Persist patterns to localStorage
- **Customizable** - Key bindings, BPM (20-300), time signatures, quantization

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

## Keyboard Controls

| Key | Drum |
|-----|------|
| F | Kick |
| D | Snare |
| G | Hi-Hat (Closed) |
| H | Hi-Hat (Open) |
| J | Tom 1 (High) |
| K | Tom 2 (Mid) |
| L | Floor Tom |
| A | Crash Cymbal |
| S | Ride Cymbal |

### Shortcuts

- `Ctrl+Z` / `Ctrl+Y` - Undo / Redo
- `Ctrl+C` / `Ctrl+V` - Copy / Paste notes
- `Delete` / `Backspace` - Remove selected notes
- `Escape` - Deselect all

## Time Signatures

Supported: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8

## Tech Stack

- **React 18** + Vite
- **Tone.js** - Audio engine & scheduling
- **VexFlow 4** - Music notation rendering
- **Tailwind CSS** - Styling
- **midi-writer-js** - MIDI file export

## Project Structure

```
src/
├── components/
│   ├── DrumKit/        # Visual drum kit
│   ├── StepSequencer/  # Grid sequencer
│   ├── SheetMusic/     # VexFlow notation
│   ├── SoundPanel/     # Sound settings
│   ├── Transport/      # Playback controls
│   ├── TopBar/         # Main toolbar
│   └── Modals/         # Save/Load dialogs
├── hooks/
│   ├── useAudioEngine.js
│   ├── useTransport.js
│   └── useKeyBindings.js
├── store/
│   └── PatternContext.jsx
└── utils/
    ├── midiExport.js
    └── quantize.js
```

## License

MIT
