import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { usePattern, DRUM_PIECES } from '../store/PatternContext';

export function useTransport(triggerDrum, metronomeClick) {
  const { state, actions } = usePattern();
  const {
    pattern,
    isPlaying,
    isRecording,
    metronomeOn,
    loopOn,
    stepResolution,
    measureCount,
    swing,
    quantization,
  } = state;

  const sequenceRef = useRef(null);
  const recordStartTimeRef = useRef(null);
  const countInRef = useRef(null);

  // Calculate steps per measure based on time signature and resolution
  const getStepsPerMeasure = useCallback(() => {
    const { numerator, denominator } = pattern.timeSignature;
    // For 4/4 at 16th resolution: 4 beats * 4 subdivisions = 16 steps
    // For 6/8 at 16th resolution: 6 beats * 2 subdivisions = 12 steps
    if (denominator === 8) {
      return numerator * (stepResolution / 8);
    }
    return numerator * (stepResolution / 4);
  }, [pattern.timeSignature, stepResolution]);

  // Start playback
  const startPlayback = useCallback(async () => {
    await Tone.start();

    const stepsPerMeasure = getStepsPerMeasure();
    const totalSteps = stepsPerMeasure * measureCount;

    // Calculate step duration based on BPM and time signature
    const { denominator } = pattern.timeSignature;
    const beatDuration = 60 / pattern.bpm;
    const stepDuration = denominator === 8
      ? beatDuration / (stepResolution / 8)
      : beatDuration / (stepResolution / 4);

    // Clear any existing sequence
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    // Create step indices array
    const stepIndices = Array.from({ length: totalSteps }, (_, i) => i);

    // Create sequence
    sequenceRef.current = new Tone.Sequence(
      (time, stepIndex) => {
        const measureIndex = Math.floor(stepIndex / stepsPerMeasure);
        const step = stepIndex % stepsPerMeasure;

        // Apply swing to even steps (second sixteenth of each eighth pair)
        let adjustedTime = time;
        if (swing > 0 && step % 2 === 1) {
          const swingAmount = (swing / 100) * (stepDuration / 2);
          adjustedTime = time + swingAmount;
        }

        // Update current position in UI (use Draw for visual updates)
        Tone.Draw.schedule(() => {
          actions.setCurrentMeasure(measureIndex);
          actions.setCurrentStep(step);
        }, time);

        // Play metronome click on downbeats
        if (metronomeOn && step % (stepsPerMeasure / pattern.timeSignature.numerator) === 0) {
          const isDownbeat = step === 0;
          metronomeClick(adjustedTime, isDownbeat);
        }

        // Get notes for this step
        const measure = pattern.measures[measureIndex];
        if (measure) {
          const notesAtStep = measure.notes.filter(n => n.step === step);
          notesAtStep.forEach(note => {
            triggerDrum(note.drumId, note.velocity || 100, adjustedTime);
          });
        }
      },
      stepIndices,
      stepDuration
    );

    // Set loop behavior
    sequenceRef.current.loop = loopOn;
    sequenceRef.current.loopEnd = totalSteps;

    // Start transport
    Tone.Transport.bpm.value = pattern.bpm;
    Tone.Transport.start();
    sequenceRef.current.start(0);

    actions.setPlaying(true);
  }, [
    pattern,
    measureCount,
    stepResolution,
    swing,
    metronomeOn,
    loopOn,
    getStepsPerMeasure,
    triggerDrum,
    metronomeClick,
    actions,
  ]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    actions.setPlaying(false);
    actions.setCurrentStep(0);
    actions.setCurrentMeasure(0);
  }, [actions]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    Tone.Transport.pause();
    actions.setPlaying(false);
  }, [actions]);

  // Resume playback
  const resumePlayback = useCallback(() => {
    Tone.Transport.start();
    actions.setPlaying(true);
  }, [actions]);

  // Start recording
  const startRecording = useCallback(async () => {
    await Tone.start();

    // If metronome is on, do a count-in
    if (metronomeOn) {
      const beatDuration = 60 / pattern.bpm;
      const { numerator } = pattern.timeSignature;

      // Count-in for one measure
      for (let i = 0; i < numerator; i++) {
        const time = Tone.now() + i * beatDuration;
        metronomeClick(time, i === 0);
      }

      // Start recording after count-in
      countInRef.current = setTimeout(() => {
        recordStartTimeRef.current = Tone.now();
        actions.setRecording(true);

        // Also start playback during recording
        if (!isPlaying) {
          startPlayback();
        }
      }, numerator * beatDuration * 1000);
    } else {
      recordStartTimeRef.current = Tone.now();
      actions.setRecording(true);

      if (!isPlaying) {
        startPlayback();
      }
    }
  }, [metronomeOn, pattern.bpm, pattern.timeSignature, isPlaying, metronomeClick, actions, startPlayback]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (countInRef.current) {
      clearTimeout(countInRef.current);
      countInRef.current = null;
    }

    actions.setRecording(false);
    stopPlayback();
  }, [actions, stopPlayback]);

  // Record a live hit
  const recordHit = useCallback((drumId, velocity = 100) => {
    if (!isRecording || recordStartTimeRef.current === null) return;

    const currentTime = Tone.now();
    const timeSinceStart = currentTime - recordStartTimeRef.current;

    // Calculate which measure and step this hit falls on
    const { numerator, denominator } = pattern.timeSignature;
    const stepsPerMeasure = getStepsPerMeasure();
    const beatDuration = 60 / pattern.bpm;
    const stepDuration = denominator === 8
      ? beatDuration / (stepResolution / 8)
      : beatDuration / (stepResolution / 4);

    const measureDuration = stepDuration * stepsPerMeasure;
    const measureIndex = Math.floor(timeSinceStart / measureDuration) % measureCount;

    // Calculate raw step position
    let step = (timeSinceStart % measureDuration) / stepDuration;

    // Apply quantization if set
    if (quantization !== null) {
      // Calculate how many quantization grid points per measure
      const quantGridPerMeasure = denominator === 8
        ? numerator * (quantization / 8)
        : numerator * (quantization / 4);

      // Convert step to quantization grid, round, then convert back
      const stepsPerQuantGrid = stepsPerMeasure / quantGridPerMeasure;
      step = Math.round(step / stepsPerQuantGrid) * stepsPerQuantGrid;
    } else {
      // No quantization - just round to nearest step
      step = Math.round(step);
    }

    step = Math.max(0, Math.min(stepsPerMeasure - 1, Math.round(step)));

    // Add note to pattern
    actions.addNote({
      measureIndex,
      note: {
        step,
        drumId,
        velocity,
        noteValue: quantization || stepResolution,
      },
    });
  }, [isRecording, pattern, stepResolution, measureCount, quantization, getStepsPerMeasure, actions]);

  // Update BPM in Transport when it changes
  useEffect(() => {
    Tone.Transport.bpm.value = pattern.bpm;
  }, [pattern.bpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      if (countInRef.current) {
        clearTimeout(countInRef.current);
      }
      Tone.Transport.stop();
    };
  }, []);

  return {
    startPlayback,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    startRecording,
    stopRecording,
    recordHit,
    getStepsPerMeasure,
  };
}
