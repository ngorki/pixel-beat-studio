import { useEffect, useRef, useState, useCallback } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Beam } from 'vexflow';
import { usePattern, DRUM_PIECES } from '../../store/PatternContext';

// VexFlow percussion note positions (using standard drum notation)
const DRUM_POSITIONS = {
  kick: { line: 5, noteHead: 'x2' },      // Below staff
  snare: { line: 3, noteHead: 'x2' },     // 3rd space
  hihatClosed: { line: 0, noteHead: 'x2' }, // Top line (X notehead)
  hihatOpen: { line: 0, noteHead: 'x0' },   // Top line (open X)
  tom1: { line: 1, noteHead: 'x2' },      // Top space
  tom2: { line: 2, noteHead: 'x2' },      // 2nd line from top
  floorTom: { line: 4, noteHead: 'x2' },  // 4th space
  crash: { line: -1, noteHead: 'x2' },    // Above staff
  ride: { line: -1, noteHead: 'x2' },     // Above staff
};

// Convert line position to VexFlow key string
function getVexflowKey(drumId) {
  const pos = DRUM_POSITIONS[drumId];
  if (!pos) return 'c/5';

  // VexFlow percussion clef line mapping
  const lineToKey = {
    '-1': 'g/5',  // Above staff
    '0': 'f/5',   // Top line
    '1': 'e/5',   // Top space
    '2': 'd/5',   // 2nd line
    '3': 'c/5',   // Middle
    '4': 'b/4',   // 4th line
    '5': 'a/4',   // Below staff
  };

  return lineToKey[pos.line.toString()] || 'c/5';
}

// Convert note value to VexFlow duration
function getNoteValueDuration(noteValue) {
  switch (noteValue) {
    case 4: return 'q';
    case 8: return '8';
    case 16: return '16';
    case 32: return '32';
    default: return '16';
  }
}

export default function SheetMusic({ onNoteClick }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const { state, actions } = usePattern();
  const {
    pattern,
    selectedNotes,
    currentMeasure,
    isPlaying,
    stepResolution,
  } = state;

  const [zoom, setZoom] = useState(100);

  // Render sheet music
  const renderMusic = useCallback(() => {
    if (!containerRef.current) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    // Create renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    rendererRef.current = renderer;

    const { numerator, denominator } = pattern.timeSignature;
    const stepsPerMeasure = denominator === 8
      ? numerator * (stepResolution / 8)
      : numerator * (stepResolution / 4);

    // Calculate dimensions
    const measureWidth = 250;
    const measuresPerLine = Math.floor((containerRef.current.clientWidth - 100) / measureWidth) || 1;
    const numLines = Math.ceil(pattern.measures.length / measuresPerLine);
    const width = containerRef.current.clientWidth;
    const height = Math.max(200, numLines * 120 + 50);

    renderer.resize(width * (zoom / 100), height * (zoom / 100));
    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(zoom / 100, zoom / 100);

    // Render each measure
    pattern.measures.forEach((measure, measureIndex) => {
      const lineIndex = Math.floor(measureIndex / measuresPerLine);
      const posInLine = measureIndex % measuresPerLine;

      const x = 50 + posInLine * measureWidth;
      const y = 40 + lineIndex * 120;

      // Create stave
      const stave = new Stave(x, y, measureWidth - 10);

      // Add clef and time signature for first measure of each line
      if (posInLine === 0) {
        stave.addClef('percussion');
        if (lineIndex === 0 || measureIndex === 0) {
          stave.addTimeSignature(`${numerator}/${denominator}`);
        }
      }

      // Add measure number
      stave.setText(`${measureIndex + 1}`, 3, { shift_y: -10 });

      // Highlight current measure during playback
      if (isPlaying && measureIndex === currentMeasure) {
        context.save();
        context.setFillStyle('rgba(123, 47, 190, 0.2)');
        context.fillRect(x, y, measureWidth - 10, 80);
        context.restore();
      }

      stave.setContext(context).draw();

      // Group notes by step for beaming
      const notesByStep = {};
      measure.notes.forEach(note => {
        if (!notesByStep[note.step]) {
          notesByStep[note.step] = [];
        }
        notesByStep[note.step].push(note);
      });

      // Create VexFlow notes
      const vexNotes = [];
      const stepsWithNotes = Object.keys(notesByStep).map(Number).sort((a, b) => a - b);

      if (stepsWithNotes.length === 0) {
        // Add a whole rest for empty measures
        const rest = new StaveNote({
          clef: 'percussion',
          keys: ['b/4'],
          duration: 'wr',
        });
        vexNotes.push(rest);
      } else {
        // Add notes with rests between them
        let lastStep = 0;

        stepsWithNotes.forEach(step => {
          const notes = notesByStep[step];
          const keys = notes.map(n => getVexflowKey(n.drumId));
          const duration = getNoteValueDuration(notes[0].noteValue || stepResolution);

          try {
            const staveNote = new StaveNote({
              clef: 'percussion',
              keys,
              duration,
            });

            // Style selected notes
            notes.forEach((note, i) => {
              if (selectedNotes.includes(note.id)) {
                staveNote.setKeyStyle(i, { fillStyle: '#E040FB', strokeStyle: '#E040FB' });
              }
            });

            // Store note data for click handling
            staveNote.setAttribute('noteData', JSON.stringify(notes.map(n => n.id)));

            vexNotes.push(staveNote);
          } catch (err) {
            console.warn('Error creating note:', err);
          }
        });
      }

      if (vexNotes.length > 0) {
        try {
          // Create voice and format
          const voice = new Voice({
            num_beats: numerator,
            beat_value: denominator,
          }).setMode(Voice.Mode.SOFT);

          voice.addTickables(vexNotes);

          new Formatter().joinVoices([voice]).format([voice], measureWidth - 50);

          voice.draw(context, stave);
        } catch (err) {
          console.warn('Error rendering voice:', err);
        }
      }
    });
  }, [pattern, selectedNotes, currentMeasure, isPlaying, stepResolution, zoom]);

  // Re-render when pattern changes
  useEffect(() => {
    renderMusic();
  }, [renderMusic]);

  // Handle click on notes
  const handleClick = useCallback((e) => {
    if (!rendererRef.current) return;

    // Get SVG element
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    // Find clicked note element
    const target = e.target.closest('.vf-stavenote');
    if (target) {
      const noteData = target.getAttribute('data-notedata');
      if (noteData) {
        try {
          const noteIds = JSON.parse(noteData);
          if (e.ctrlKey || e.metaKey) {
            // Add to selection
            actions.selectNotes([...selectedNotes, ...noteIds]);
          } else {
            // Replace selection
            actions.selectNotes(noteIds);
          }
        } catch (err) {
          console.warn('Error parsing note data:', err);
        }
      }
    } else {
      // Click on empty space - deselect
      actions.selectNotes([]);
    }
  }, [selectedNotes, actions]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-2 bg-[#16213E] border-b border-[#333355]">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">ZOOM</span>
          <button
            className="pixel-btn text-[8px] px-2 py-1"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            -
          </button>
          <span className="font-pixel text-[10px] text-[#E0D7F5] w-12 text-center">
            {zoom}%
          </span>
          <button
            className="pixel-btn text-[8px] px-2 py-1"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            +
          </button>
        </div>

        <div className="w-px h-6 bg-[#333355]" />

        <div className="flex items-center gap-2">
          <button
            className="pixel-btn text-[8px]"
            onClick={actions.undo}
          >
            UNDO
          </button>
          <button
            className="pixel-btn text-[8px]"
            onClick={actions.redo}
          >
            REDO
          </button>
        </div>

        {selectedNotes.length > 0 && (
          <>
            <div className="w-px h-6 bg-[#333355]" />
            <span className="font-pixel text-[8px] text-[#E040FB]">
              {selectedNotes.length} SELECTED
            </span>
            <button
              className="pixel-btn text-[8px]"
              onClick={actions.copyNotes}
            >
              COPY
            </button>
            <button
              className="pixel-btn text-[8px]"
              onClick={() => actions.deleteNotes(selectedNotes)}
            >
              DELETE
            </button>
          </>
        )}
      </div>

      {/* Sheet music container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#1A1A2E] p-4"
        onClick={handleClick}
      />
    </div>
  );
}
