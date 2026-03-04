import { useState, useCallback, useRef } from 'react';
import { usePattern, DRUM_PIECES } from '../../store/PatternContext';
import { v4 as uuidv4 } from 'uuid';

export default function StepSequencer({ onTrigger }) {
  const { state, actions } = usePattern();
  const {
    pattern,
    stepResolution,
    measureCount,
    currentStep,
    currentMeasure,
    isPlaying,
    activeDrumPiece,
  } = state;

  const [contextMenu, setContextMenu] = useState(null);
  const [fillInterval, setFillInterval] = useState(8); // Default 1/8 notes
  const containerRef = useRef(null);

  // Calculate steps per measure based on time signature
  const { numerator, denominator } = pattern.timeSignature;
  const stepsPerMeasure = denominator === 8
    ? numerator * (stepResolution / 8)
    : numerator * (stepResolution / 4);

  const totalSteps = stepsPerMeasure * measureCount;

  // Check if a step has a note
  const hasNote = useCallback((measureIndex, step, drumId) => {
    const measure = pattern.measures[measureIndex];
    if (!measure) return false;
    return measure.notes.some(n => n.step === step && n.drumId === drumId);
  }, [pattern.measures]);

  // Get note at position
  const getNote = useCallback((measureIndex, step, drumId) => {
    const measure = pattern.measures[measureIndex];
    if (!measure) return null;
    return measure.notes.find(n => n.step === step && n.drumId === drumId);
  }, [pattern.measures]);

  // Toggle step
  const handleStepClick = useCallback((measureIndex, step, drumId) => {
    actions.toggleStep({ measureIndex, step, drumId });
    onTrigger(drumId, 100);
  }, [actions, onTrigger]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e, measureIndex, step, drumId) => {
    e.preventDefault();
    const note = getNote(measureIndex, step, drumId);
    if (note) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        note,
        measureIndex,
        step,
        drumId,
      });
    }
  }, [getNote]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle velocity change from context menu
  const handleVelocityChange = useCallback((velocity) => {
    if (contextMenu?.note) {
      actions.setNoteVelocity({ noteId: contextMenu.note.id, velocity });
    }
    closeContextMenu();
  }, [contextMenu, actions, closeContextMenu]);

  // Handle note value change
  const handleNoteValueChange = useCallback((noteValue) => {
    if (contextMenu?.note) {
      actions.setNoteValue({ noteId: contextMenu.note.id, noteValue });
    }
    closeContextMenu();
  }, [contextMenu, actions, closeContextMenu]);

  // Fill a drum piece with notes at a given interval
  const handleFill = useCallback((drumId, interval) => {
    // Calculate step interval based on note value
    // interval 4 = quarter notes, 8 = eighth notes, etc.
    const stepsPerInterval = denominator === 8
      ? stepResolution / interval
      : (stepResolution / 4) / (interval / 4);

    // Add notes for each measure
    for (let mi = 0; mi < measureCount; mi++) {
      for (let step = 0; step < stepsPerMeasure; step += stepsPerInterval) {
        const roundedStep = Math.round(step);
        if (!hasNote(mi, roundedStep, drumId)) {
          actions.addNote({
            measureIndex: mi,
            note: {
              step: roundedStep,
              drumId,
              velocity: 100,
              noteValue: interval,
            },
          });
        }
      }
    }
  }, [denominator, stepResolution, measureCount, stepsPerMeasure, hasNote, actions]);

  // Clear notes for a specific drum piece
  const handleClearDrum = useCallback((drumId) => {
    const noteIdsToDelete = [];
    pattern.measures.forEach((measure) => {
      (measure.notes || []).forEach((note) => {
        if (note.drumId === drumId) {
          noteIdsToDelete.push(note.id);
        }
      });
    });
    if (noteIdsToDelete.length > 0) {
      actions.deleteNotes(noteIdsToDelete);
    }
  }, [pattern.measures, actions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      onClick={closeContextMenu}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-4 p-3 bg-[#16213E] border-b border-[#333355]">
        {/* Clear buttons */}
        <div className="flex items-center gap-2">
          <button
            className="pixel-btn text-[8px]"
            onClick={() => {
              if (window.confirm('Clear ALL notes from the sequence?')) {
                actions.clearStepGrid();
              }
            }}
          >
            CLEAR ALL
          </button>
          <button
            className="pixel-btn text-[8px]"
            onClick={() => handleClearDrum(activeDrumPiece)}
            title={`Clear ${DRUM_PIECES.find(p => p.id === activeDrumPiece)?.name || 'selected drum'}`}
          >
            CLEAR {DRUM_PIECES.find(p => p.id === activeDrumPiece)?.name.substring(0, 6).toUpperCase() || 'DRUM'}
          </button>
        </div>

        <div className="w-px h-6 bg-[#333355]" />

        {/* Fill controls */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">FILL</span>
          <select
            value={activeDrumPiece}
            onChange={(e) => actions.setActiveDrumPiece(e.target.value)}
            className="pixel-select text-[7px]"
          >
            {DRUM_PIECES.map((piece) => (
              <option key={piece.id} value={piece.id}>
                {piece.name}
              </option>
            ))}
          </select>
          <span className="font-pixel text-[8px] text-[#8888AA]">WITH</span>
          <select
            value={fillInterval}
            onChange={(e) => setFillInterval(parseInt(e.target.value))}
            className="pixel-select text-[7px]"
          >
            <option value={4}>1/4</option>
            <option value={8}>1/8</option>
            <option value={16}>1/16</option>
            <option value={32}>1/32</option>
          </select>
          <button
            className="pixel-btn text-[8px] active"
            onClick={() => handleFill(activeDrumPiece, fillInterval)}
          >
            FILL
          </button>
        </div>

        <div className="w-px h-6 bg-[#333355]" />

        {/* Quantize button */}
        <div className="flex items-center gap-2">
          <button
            className="pixel-btn text-[8px]"
            onClick={() => actions.quantizeNotes({ quantizeValue: fillInterval, stepsPerMeasure })}
            title="Snap all notes to the selected grid"
          >
            QUANTIZE TO 1/{fillInterval}
          </button>
        </div>
      </div>

      <div className="min-w-max p-4">
        {/* Header row with step numbers */}
        <div className="flex mb-2">
          <div className="w-24 flex-shrink-0" /> {/* Spacer for labels */}
          {Array.from({ length: measureCount }).map((_, mi) => (
            <div key={mi} className="flex">
              {Array.from({ length: stepsPerMeasure }).map((_, si) => {
                const isCurrentStep = isPlaying && currentMeasure === mi && currentStep === si;
                const isBeat = si % (stepsPerMeasure / numerator) === 0;
                return (
                  <div
                    key={si}
                    className={`
                      w-6 h-4 flex items-center justify-center
                      font-pixel text-[6px]
                      ${isBeat ? 'text-[#E040FB]' : 'text-[#8888AA]'}
                      ${isCurrentStep ? 'bg-[#7B2FBE] text-white' : ''}
                    `}
                  >
                    {si + 1}
                  </div>
                );
              })}
              {/* Measure separator */}
              <div className="w-2" />
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DRUM_PIECES.map((piece) => (
          <div key={piece.id} className="flex items-center mb-1">
            {/* Row label */}
            <div
              className="w-24 flex-shrink-0 font-pixel text-[8px] text-[#E0D7F5] pr-2 truncate"
              title={piece.name}
            >
              {piece.name.substring(0, 10)}
            </div>

            {/* Steps */}
            {Array.from({ length: measureCount }).map((_, mi) => (
              <div key={mi} className="flex">
                {Array.from({ length: stepsPerMeasure }).map((_, si) => {
                  const isActive = hasNote(mi, si, piece.id);
                  const isCurrentStep = isPlaying && currentMeasure === mi && currentStep === si;
                  const isBeat = si % (stepsPerMeasure / numerator) === 0;
                  const note = isActive ? getNote(mi, si, piece.id) : null;
                  const velocityOpacity = note ? (note.velocity || 100) / 100 : 1;

                  return (
                    <button
                      key={si}
                      className={`
                        w-6 h-6 border transition-all duration-75
                        ${isBeat ? 'border-[#444466]' : 'border-[#333355]'}
                        ${isActive
                          ? 'bg-[#00FF9F] border-[#00FF9F]'
                          : 'bg-[#1A1A2E] hover:bg-[#2A2A3E]'
                        }
                        ${isCurrentStep ? 'ring-2 ring-[#E040FB]' : ''}
                      `}
                      style={{
                        opacity: isActive ? velocityOpacity : 1,
                      }}
                      onClick={() => handleStepClick(mi, si, piece.id)}
                      onContextMenu={(e) => handleContextMenu(e, mi, si, piece.id)}
                      aria-label={`${piece.name} measure ${mi + 1} step ${si + 1}`}
                    />
                  );
                })}
                {/* Measure separator */}
                <div className="w-2 bg-[#0D0D1A]" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#1A1A2E] border-2 border-[#7B2FBE] p-3 z-50 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-pixel text-[8px] text-[#E040FB] mb-2">NOTE OPTIONS</div>

          <div className="mb-3">
            <div className="font-pixel text-[7px] text-[#8888AA] mb-1">VELOCITY</div>
            <input
              type="range"
              min="1"
              max="127"
              value={contextMenu.note?.velocity || 100}
              onChange={(e) => handleVelocityChange(parseInt(e.target.value))}
              className="pixel-slider w-32"
            />
            <span className="font-pixel text-[8px] text-[#E0D7F5] ml-2">
              {contextMenu.note?.velocity || 100}
            </span>
          </div>

          <div className="mb-3">
            <div className="font-pixel text-[7px] text-[#8888AA] mb-1">NOTE VALUE</div>
            <div className="flex gap-1">
              {[4, 8, 16, 32].map((val) => (
                <button
                  key={val}
                  className={`
                    pixel-btn text-[7px] px-2 py-1
                    ${contextMenu.note?.noteValue === val ? 'active' : ''}
                  `}
                  onClick={() => handleNoteValueChange(val)}
                >
                  1/{val}
                </button>
              ))}
            </div>
          </div>

          <button
            className="pixel-btn text-[8px] w-full mt-2"
            style={{ borderColor: '#ff4444' }}
            onClick={() => {
              actions.deleteNotes([contextMenu.note.id]);
              closeContextMenu();
            }}
          >
            DELETE
          </button>
        </div>
      )}
    </div>
  );
}
