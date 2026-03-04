import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { DRUM_PIECES } from '../store/PatternContext';

// Default sample paths
const DEFAULT_SAMPLES = {
  kick: '/samples/default/kick.wav',
  snare: '/samples/default/snare.wav',
  hihatClosed: '/samples/default/hihat-closed.wav',
  hihatOpen: '/samples/default/hihat-open.wav',
  tom1: '/samples/default/tom-high.wav',
  tom2: '/samples/default/tom-mid.wav',
  floorTom: '/samples/default/tom-floor.wav',
  crash: '/samples/default/crash.wav',
  ride: '/samples/default/ride.wav',
};

// Synth configurations for fallback
const SYNTH_CONFIGS = {
  kick: () => new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
  }),
  snare: () => new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
  }),
  hihatClosed: () => new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }),
  hihatOpen: () => new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }),
  tom1: () => new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 },
  }),
  tom2: () => new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 },
  }),
  floorTom: () => new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.6 },
  }),
  crash: () => new Tone.MetalSynth({
    frequency: 300,
    envelope: { attack: 0.001, decay: 1, release: 0.5 },
    harmonicity: 5.1,
    modulationIndex: 40,
    resonance: 4000,
    octaves: 1.5,
  }),
  ride: () => new Tone.MetalSynth({
    frequency: 400,
    envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
    harmonicity: 5.1,
    modulationIndex: 20,
    resonance: 5000,
    octaves: 1,
  }),
};

// Note frequencies for synths
const SYNTH_NOTES = {
  kick: 'C1',
  snare: null, // NoiseSynth doesn't need a note
  hihatClosed: null,
  hihatOpen: null,
  tom1: 'G2',
  tom2: 'D2',
  floorTom: 'A1',
  crash: null,
  ride: null,
};

export function useAudioEngine(soundSettings, onHit) {
  const playersRef = useRef({});
  const synthsRef = useRef({});
  const customSamplesRef = useRef({});
  const volumeNodesRef = useRef({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [latencyWarning, setLatencyWarning] = useState(false);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Check latency
        if (Tone.context.baseLatency > 0.02) {
          setLatencyWarning(true);
        }

        // Create volume nodes for each piece
        DRUM_PIECES.forEach(piece => {
          volumeNodesRef.current[piece.id] = new Tone.Volume(0).toDestination();
        });

        // Try to load default samples
        const players = {};
        const loadPromises = [];

        DRUM_PIECES.forEach(piece => {
          const player = new Tone.Player({
            url: DEFAULT_SAMPLES[piece.id],
            onload: () => {
              console.log(`Loaded sample: ${piece.id}`);
            },
            onerror: (err) => {
              console.warn(`Failed to load sample for ${piece.id}, using synth fallback`);
            },
          }).connect(volumeNodesRef.current[piece.id]);

          players[piece.id] = player;
          loadPromises.push(
            new Promise(resolve => {
              player.buffer.onload = resolve;
              // Resolve after timeout if sample doesn't load
              setTimeout(resolve, 3000);
            })
          );
        });

        playersRef.current = players;

        // Create synths as fallback
        DRUM_PIECES.forEach(piece => {
          const synth = SYNTH_CONFIGS[piece.id]();
          synth.connect(volumeNodesRef.current[piece.id]);
          synthsRef.current[piece.id] = synth;
        });

        // Wait for samples to load (with timeout)
        await Promise.race([
          Promise.all(loadPromises),
          new Promise(resolve => setTimeout(resolve, 5000)),
        ]);

        setIsLoaded(true);
      } catch (err) {
        console.error('Audio engine init error:', err);
        setLoadError(err.message);
        // Still mark as loaded so synths can be used
        setIsLoaded(true);
      }
    };

    initAudio();

    return () => {
      // Cleanup
      Object.values(playersRef.current).forEach(p => p.dispose());
      Object.values(synthsRef.current).forEach(s => s.dispose());
      Object.values(volumeNodesRef.current).forEach(v => v.dispose());
      Object.values(customSamplesRef.current).forEach(p => p.dispose());
    };
  }, []);

  // Update volume/pitch based on sound settings
  useEffect(() => {
    if (!isLoaded || !soundSettings) return;

    DRUM_PIECES.forEach(piece => {
      const settings = soundSettings[piece.id];
      if (settings && volumeNodesRef.current[piece.id]) {
        // Convert 0-100 to dB scale (-60 to 0)
        const dbValue = settings.volume === 0 ? -Infinity : (settings.volume / 100) * 60 - 60;
        volumeNodesRef.current[piece.id].volume.value = dbValue;

        // Apply pitch shift to players
        if (playersRef.current[piece.id] && settings.pitch !== undefined) {
          playersRef.current[piece.id].playbackRate = Math.pow(2, settings.pitch / 12);
        }
      }
    });
  }, [soundSettings, isLoaded]);

  // Helper to trigger a synth correctly based on type
  const triggerSynth = useCallback((drumId, velocity, time) => {
    const synth = synthsRef.current[drumId];
    if (!synth) return;

    const note = SYNTH_NOTES[drumId];

    // MembraneSynth needs a note, NoiseSynth and MetalSynth don't
    if (synth instanceof Tone.MembraneSynth) {
      synth.triggerAttackRelease(note || 'C2', '8n', time, velocity);
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease('8n', time, velocity);
    } else if (synth instanceof Tone.MetalSynth) {
      // MetalSynth needs triggerAttackRelease(duration, time, velocity)
      synth.triggerAttackRelease('16n', time, velocity);
    } else {
      // Generic fallback
      synth.triggerAttackRelease('8n', time, velocity);
    }
  }, []);

  // Trigger a drum hit
  const triggerDrum = useCallback((drumId, velocity = 100, time = Tone.now()) => {
    if (!isLoaded) return;

    const settings = soundSettings?.[drumId] || { source: 'default', volume: 80, pitch: 0 };
    const normalizedVelocity = velocity / 127;

    // Start audio context if needed
    if (Tone.context.state !== 'running') {
      Tone.start();
    }

    try {
      if (settings.source === 'synth') {
        // Use synth
        triggerSynth(drumId, normalizedVelocity, time);
      } else if (settings.source === 'custom' && customSamplesRef.current[drumId]) {
        // Use custom sample
        const player = customSamplesRef.current[drumId];
        if (player.loaded && player.buffer && player.buffer.duration > 0) {
          player.volume.value = Tone.gainToDb(normalizedVelocity);
          player.start(time);
        } else {
          triggerSynth(drumId, normalizedVelocity, time);
        }
      } else {
        // Use default sample or fallback to synth
        const player = playersRef.current[drumId];
        // Check if player has actually loaded audio data
        if (player && player.loaded && player.buffer && player.buffer.duration > 0) {
          player.volume.value = Tone.gainToDb(normalizedVelocity);
          player.start(time);
        } else {
          // Fallback to synth
          triggerSynth(drumId, normalizedVelocity, time);
        }
      }

      // Notify hit for animation
      if (onHit) {
        onHit(drumId);
      }
    } catch (err) {
      console.error('Error triggering drum:', err);
    }
  }, [isLoaded, soundSettings, triggerSynth, onHit]);

  // Load custom sample
  const loadCustomSample = useCallback(async (drumId, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;

          // Dispose old custom sample if exists
          if (customSamplesRef.current[drumId]) {
            customSamplesRef.current[drumId].dispose();
          }

          // Create new player from buffer
          const player = new Tone.Player().connect(volumeNodesRef.current[drumId]);

          // Decode audio data
          const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer.slice(0));
          player.buffer.set(audioBuffer);

          customSamplesRef.current[drumId] = player;

          // Store in IndexedDB for persistence
          try {
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const customSamples = JSON.parse(localStorage.getItem('pixelbeat_customSamples') || '{}');
            customSamples[drumId] = { name: file.name, data: base64 };
            localStorage.setItem('pixelbeat_customSamples', JSON.stringify(customSamples));
          } catch (storageErr) {
            console.warn('Could not save custom sample to storage:', storageErr);
          }

          resolve(file.name);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Create metronome click
  const metronomeClick = useCallback((time, isDownbeat) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination();

    synth.triggerAttackRelease(isDownbeat ? 'C5' : 'G4', '32n', time, 0.5);

    // Cleanup after playing
    setTimeout(() => synth.dispose(), 200);
  }, []);

  return {
    isLoaded,
    loadError,
    latencyWarning,
    triggerDrum,
    loadCustomSample,
    metronomeClick,
  };
}
