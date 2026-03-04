import MidiWriter from 'midi-writer-js';
import { DRUM_PIECES } from '../store/PatternContext';

// Get MIDI note number for a drum piece
function getMidiNote(drumId) {
  const piece = DRUM_PIECES.find(p => p.id === drumId);
  return piece ? piece.midiNote : 36;
}

// Convert note value to MIDI duration
function getNoteValueDuration(noteValue) {
  switch (noteValue) {
    case 4: return '4';
    case 8: return '8';
    case 16: return '16';
    case 32: return '32';
    default: return '16';
  }
}

export function exportToMidi(pattern, filename = 'pixelbeat-pattern') {
  // Create a new MIDI track
  const track = new MidiWriter.Track();

  // Set tempo
  track.setTempo(pattern.bpm);

  // Set time signature
  track.setTimeSignature(
    pattern.timeSignature.numerator,
    pattern.timeSignature.denominator
  );

  // Calculate ticks per step
  // MIDI uses 128 ticks per quarter note by default in midi-writer-js
  const ticksPerQuarter = 128;
  const { denominator } = pattern.timeSignature;

  // Collect all notes and sort by absolute position
  const allNotes = [];
  const stepsPerBeat = 16 / 4; // Assuming 16th note resolution

  pattern.measures.forEach((measure, measureIndex) => {
    measure.notes.forEach(note => {
      const absoluteStep = measureIndex * 16 + note.step; // Assuming 16 steps per measure
      allNotes.push({
        ...note,
        absoluteStep,
        measureIndex,
      });
    });
  });

  // Sort by absolute position
  allNotes.sort((a, b) => a.absoluteStep - b.absoluteStep);

  // Track the current position in ticks
  let currentTick = 0;
  const ticksPerStep = ticksPerQuarter / stepsPerBeat;

  allNotes.forEach(note => {
    const noteTick = note.absoluteStep * ticksPerStep;
    const wait = noteTick - currentTick;

    // Create MIDI note event
    const midiNote = new MidiWriter.NoteEvent({
      pitch: getMidiNote(note.drumId),
      duration: getNoteValueDuration(note.noteValue || 16),
      velocity: Math.round((note.velocity || 100) / 127 * 100),
      wait: wait > 0 ? `T${Math.round(wait)}` : 0,
      channel: 10, // GM drums channel
    });

    track.addEvent(midiNote);
    currentTick = noteTick + ticksPerStep;
  });

  // Generate the MIDI file
  const writer = new MidiWriter.Writer([track]);

  // Create a download link
  const blob = new Blob([writer.buildFile()], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Generate filename with pattern name and timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = pattern.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  link.download = `pixelbeat-${safeName}-${timestamp}.mid`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export function patternToMidiNotes(pattern) {
  // Convert pattern to a format that can be displayed in sheet music
  const notes = [];

  pattern.measures.forEach((measure, measureIndex) => {
    measure.notes.forEach(note => {
      notes.push({
        measureIndex,
        step: note.step,
        drumId: note.drumId,
        velocity: note.velocity || 100,
        noteValue: note.noteValue || 16,
        midiNote: getMidiNote(note.drumId),
      });
    });
  });

  return notes;
}
