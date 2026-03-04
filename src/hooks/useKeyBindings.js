import { useEffect, useCallback } from 'react';
import { usePattern, DRUM_PIECES } from '../store/PatternContext';

export function useKeyBindings(triggerDrum, recordHit, isRecording) {
  const { state, actions } = usePattern();
  const { pattern, selectedNotes } = state;
  const keyBindings = pattern.keyBindings;

  // Handle key press
  const handleKeyDown = useCallback((e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            actions.redo();
          } else {
            actions.undo();
          }
          return;
        case 'y':
          e.preventDefault();
          actions.redo();
          return;
        case 'c':
          if (selectedNotes.length > 0) {
            e.preventDefault();
            actions.copyNotes();
          }
          return;
        case 'v':
          e.preventDefault();
          actions.pasteNotes({ targetMeasure: 0, targetStep: 0 });
          return;
        case 'a':
          e.preventDefault();
          // Select all notes
          const allNoteIds = pattern.measures.flatMap(m => m.notes.map(n => n.id));
          actions.selectNotes(allNoteIds);
          return;
        default:
          break;
      }
    }

    // Handle delete/backspace for selected notes
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNotes.length > 0) {
      e.preventDefault();
      actions.deleteNotes(selectedNotes);
      return;
    }

    // Handle escape to deselect
    if (e.key === 'Escape') {
      actions.selectNotes([]);
      return;
    }

    // Check if the key matches a drum piece binding
    const pressedKey = e.key.toLowerCase();

    for (const piece of DRUM_PIECES) {
      const boundKey = keyBindings[piece.id]?.toLowerCase();
      if (boundKey === pressedKey) {
        e.preventDefault();

        // Trigger the drum sound
        triggerDrum(piece.id, 100);

        // If recording, add the hit
        if (isRecording) {
          recordHit(piece.id, 100);
        }

        return;
      }
    }
  }, [keyBindings, triggerDrum, recordHit, isRecording, selectedNotes, pattern.measures, actions]);

  // Set up event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Check for key binding conflicts
  const checkKeyConflict = useCallback((key, excludeDrumId) => {
    const lowerKey = key.toLowerCase();
    for (const piece of DRUM_PIECES) {
      if (piece.id !== excludeDrumId && keyBindings[piece.id]?.toLowerCase() === lowerKey) {
        return piece.name;
      }
    }
    return null;
  }, [keyBindings]);

  // Update key binding
  const updateKeyBinding = useCallback((drumId, newKey) => {
    actions.updateKeyBinding({ drumId, key: newKey });
  }, [actions]);

  return {
    keyBindings,
    checkKeyConflict,
    updateKeyBinding,
  };
}
