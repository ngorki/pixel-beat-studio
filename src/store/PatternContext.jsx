import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Drum pieces configuration
export const DRUM_PIECES = [
  { id: 'kick', name: 'Kick Drum', key: 'f', midiNote: 36, type: 'drum' },
  { id: 'snare', name: 'Snare Drum', key: 'd', midiNote: 38, type: 'drum' },
  { id: 'hihatClosed', name: 'Hi-Hat (Closed)', key: 'g', midiNote: 42, type: 'cymbal' },
  { id: 'hihatOpen', name: 'Hi-Hat (Open)', key: 'h', midiNote: 46, type: 'cymbal' },
  { id: 'tom1', name: 'Tom 1 (High)', key: 'j', midiNote: 48, type: 'drum' },
  { id: 'tom2', name: 'Tom 2 (Mid)', key: 'k', midiNote: 45, type: 'drum' },
  { id: 'floorTom', name: 'Floor Tom', key: 'l', midiNote: 41, type: 'drum' },
  { id: 'crash', name: 'Crash Cymbal', key: 'a', midiNote: 49, type: 'cymbal' },
  { id: 'ride', name: 'Ride Cymbal', key: 's', midiNote: 51, type: 'cymbal' },
];

// Time signatures
export const TIME_SIGNATURES = [
  { numerator: 2, denominator: 4, label: '2/4' },
  { numerator: 3, denominator: 4, label: '3/4' },
  { numerator: 4, denominator: 4, label: '4/4' },
  { numerator: 5, denominator: 4, label: '5/4' },
  { numerator: 6, denominator: 8, label: '6/8' },
  { numerator: 7, denominator: 8, label: '7/8' },
  { numerator: 9, denominator: 8, label: '9/8' },
  { numerator: 12, denominator: 8, label: '12/8' },
];

// Quantization values
export const QUANTIZATION_VALUES = [
  { value: null, label: 'None (Free)' },
  { value: 4, label: '1/4' },
  { value: 8, label: '1/8' },
  { value: 16, label: '1/16' },
  { value: 32, label: '1/32' },
];

// Default state
const DEFAULT_MEASURE_COUNT = 4;

const createDefaultPattern = () => ({
  id: uuidv4(),
  name: 'Untitled Pattern',
  createdAt: new Date().toISOString(),
  bpm: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  measures: Array.from({ length: DEFAULT_MEASURE_COUNT }, () => createEmptyMeasure(4, 16)),
  soundSettings: DRUM_PIECES.reduce((acc, piece) => ({
    ...acc,
    [piece.id]: { source: 'default', volume: 80, pitch: 0 }
  }), {}),
  keyBindings: DRUM_PIECES.reduce((acc, piece) => ({
    ...acc,
    [piece.id]: piece.key
  }), {}),
});

function createEmptyMeasure(beats, subdivisions) {
  return {
    id: uuidv4(),
    notes: [],
  };
}

const initialState = {
  pattern: createDefaultPattern(),
  mode: 'live', // 'live' | 'step'
  isPlaying: false,
  isRecording: false,
  metronomeOn: false,
  loopOn: true,
  quantization: 16,
  swing: 0,
  stepResolution: 16,
  measureCount: 4,
  currentStep: 0,
  currentMeasure: 0,
  selectedNotes: [],
  clipboard: [],
  undoStack: [],
  redoStack: [],
  activeTab: 'sequencer', // 'sequencer' | 'sheet' | 'sounds'
  activeDrumPiece: 'kick',
};

// Action types
const ACTIONS = {
  SET_PATTERN: 'SET_PATTERN',
  SET_BPM: 'SET_BPM',
  SET_TIME_SIGNATURE: 'SET_TIME_SIGNATURE',
  SET_MODE: 'SET_MODE',
  SET_PLAYING: 'SET_PLAYING',
  SET_RECORDING: 'SET_RECORDING',
  SET_METRONOME: 'SET_METRONOME',
  SET_LOOP: 'SET_LOOP',
  SET_QUANTIZATION: 'SET_QUANTIZATION',
  SET_SWING: 'SET_SWING',
  SET_STEP_RESOLUTION: 'SET_STEP_RESOLUTION',
  SET_MEASURE_COUNT: 'SET_MEASURE_COUNT',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_CURRENT_MEASURE: 'SET_CURRENT_MEASURE',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_ACTIVE_DRUM_PIECE: 'SET_ACTIVE_DRUM_PIECE',
  TOGGLE_STEP: 'TOGGLE_STEP',
  ADD_NOTE: 'ADD_NOTE',
  DELETE_NOTES: 'DELETE_NOTES',
  SELECT_NOTES: 'SELECT_NOTES',
  COPY_NOTES: 'COPY_NOTES',
  PASTE_NOTES: 'PASTE_NOTES',
  MOVE_NOTE: 'MOVE_NOTE',
  SET_NOTE_VELOCITY: 'SET_NOTE_VELOCITY',
  SET_NOTE_VALUE: 'SET_NOTE_VALUE',
  ADD_MEASURE: 'ADD_MEASURE',
  DELETE_MEASURE: 'DELETE_MEASURE',
  QUANTIZE_NOTES: 'QUANTIZE_NOTES',
  DUPLICATE_MEASURE: 'DUPLICATE_MEASURE',
  UPDATE_SOUND_SETTING: 'UPDATE_SOUND_SETTING',
  UPDATE_KEY_BINDING: 'UPDATE_KEY_BINDING',
  UNDO: 'UNDO',
  REDO: 'REDO',
  RESET_PATTERN: 'RESET_PATTERN',
  LOAD_PATTERN: 'LOAD_PATTERN',
  SET_PATTERN_NAME: 'SET_PATTERN_NAME',
  CLEAR_STEP_GRID: 'CLEAR_STEP_GRID',
};

function pushUndoState(state) {
  const undoStack = [...state.undoStack, { pattern: JSON.parse(JSON.stringify(state.pattern)) }];
  if (undoStack.length > 50) undoStack.shift();
  return { undoStack, redoStack: [] };
}

function patternReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PATTERN:
      return { ...state, pattern: action.payload, ...pushUndoState(state) };

    case ACTIONS.SET_BPM:
      return {
        ...state,
        pattern: { ...state.pattern, bpm: Math.max(20, Math.min(300, action.payload)) },
      };

    case ACTIONS.SET_TIME_SIGNATURE:
      return {
        ...state,
        pattern: { ...state.pattern, timeSignature: action.payload },
        ...pushUndoState(state),
      };

    case ACTIONS.SET_MODE:
      return { ...state, mode: action.payload };

    case ACTIONS.SET_PLAYING:
      return { ...state, isPlaying: action.payload };

    case ACTIONS.SET_RECORDING:
      return { ...state, isRecording: action.payload };

    case ACTIONS.SET_METRONOME:
      return { ...state, metronomeOn: action.payload };

    case ACTIONS.SET_LOOP:
      return { ...state, loopOn: action.payload };

    case ACTIONS.SET_QUANTIZATION:
      return { ...state, quantization: action.payload };

    case ACTIONS.SET_SWING:
      return { ...state, swing: action.payload };

    case ACTIONS.SET_STEP_RESOLUTION:
      return { ...state, stepResolution: action.payload };

    case ACTIONS.SET_MEASURE_COUNT: {
      const newCount = action.payload;
      const measures = [...state.pattern.measures];
      while (measures.length < newCount) {
        measures.push(createEmptyMeasure(state.pattern.timeSignature.numerator, state.stepResolution));
      }
      while (measures.length > newCount) {
        measures.pop();
      }
      return {
        ...state,
        measureCount: newCount,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };

    case ACTIONS.SET_CURRENT_MEASURE:
      return { ...state, currentMeasure: action.payload };

    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    case ACTIONS.SET_ACTIVE_DRUM_PIECE:
      return { ...state, activeDrumPiece: action.payload };

    case ACTIONS.TOGGLE_STEP: {
      const { measureIndex, step, drumId, velocity = 100 } = action.payload;
      const measures = [...state.pattern.measures];

      // Ensure measure exists
      if (!measures[measureIndex]) {
        measures[measureIndex] = createEmptyMeasure(state.pattern.timeSignature.numerator, state.stepResolution);
      }

      const measure = { ...measures[measureIndex] };
      const notes = [...(measure.notes || [])];

      const existingIndex = notes.findIndex(
        n => n.step === step && n.drumId === drumId
      );

      if (existingIndex >= 0) {
        notes.splice(existingIndex, 1);
      } else {
        notes.push({
          id: uuidv4(),
          step,
          drumId,
          velocity,
          noteValue: state.stepResolution,
        });
      }

      measure.notes = notes;
      measures[measureIndex] = measure;

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.ADD_NOTE: {
      const { measureIndex, note } = action.payload;
      const measures = [...state.pattern.measures];

      // Ensure measure exists
      if (!measures[measureIndex]) {
        measures[measureIndex] = createEmptyMeasure(state.pattern.timeSignature.numerator, state.stepResolution);
      }

      const measure = { ...measures[measureIndex] };
      measure.notes = [...(measure.notes || []), { ...note, id: uuidv4() }];
      measures[measureIndex] = measure;

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.DELETE_NOTES: {
      const noteIds = action.payload;
      const measures = state.pattern.measures.map(measure => ({
        ...measure,
        notes: (measure.notes || []).filter(n => !noteIds.includes(n.id)),
      }));

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        selectedNotes: [],
        ...pushUndoState(state),
      };
    }

    case ACTIONS.SELECT_NOTES:
      return { ...state, selectedNotes: action.payload };

    case ACTIONS.COPY_NOTES: {
      const selectedNotes = state.selectedNotes;
      const clipboard = [];
      state.pattern.measures.forEach((measure, mi) => {
        (measure.notes || []).forEach(note => {
          if (selectedNotes.includes(note.id)) {
            clipboard.push({ ...note, measureIndex: mi });
          }
        });
      });
      return { ...state, clipboard };
    }

    case ACTIONS.PASTE_NOTES: {
      const { targetMeasure, targetStep } = action.payload;
      if (state.clipboard.length === 0) return state;

      const minStep = Math.min(...state.clipboard.map(n => n.step));
      const minMeasure = Math.min(...state.clipboard.map(n => n.measureIndex));

      const measures = [...state.pattern.measures];
      state.clipboard.forEach(note => {
        const measureOffset = note.measureIndex - minMeasure;
        const stepOffset = note.step - minStep;
        const newMeasureIndex = targetMeasure + measureOffset;
        const newStep = targetStep + stepOffset;

        if (newMeasureIndex >= 0 && newMeasureIndex < measures.length) {
          const measure = { ...measures[newMeasureIndex] };
          measure.notes = [...(measure.notes || []), {
            ...note,
            id: uuidv4(),
            step: newStep,
          }];
          measures[newMeasureIndex] = measure;
        }
      });

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.MOVE_NOTE: {
      const { noteId, newStep, newDrumId, newMeasureIndex } = action.payload;
      const measures = state.pattern.measures.map((measure, mi) => ({
        ...measure,
        notes: (measure.notes || []).map(note => {
          if (note.id !== noteId) return note;
          return {
            ...note,
            step: newStep !== undefined ? newStep : note.step,
            drumId: newDrumId !== undefined ? newDrumId : note.drumId,
          };
        }).filter(note => {
          if (note.id === noteId && newMeasureIndex !== undefined && newMeasureIndex !== mi) {
            return false;
          }
          return true;
        }),
      }));

      if (newMeasureIndex !== undefined) {
        const noteToMove = state.pattern.measures.flatMap(m => m.notes || []).find(n => n.id === noteId);
        if (noteToMove && measures[newMeasureIndex]) {
          measures[newMeasureIndex] = {
            ...measures[newMeasureIndex],
            notes: [...(measures[newMeasureIndex].notes || []), {
              ...noteToMove,
              step: newStep !== undefined ? newStep : noteToMove.step,
              drumId: newDrumId !== undefined ? newDrumId : noteToMove.drumId,
            }],
          };
        }
      }

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.SET_NOTE_VELOCITY: {
      const { noteId, velocity } = action.payload;
      const measures = state.pattern.measures.map(measure => ({
        ...measure,
        notes: (measure.notes || []).map(note =>
          note.id === noteId ? { ...note, velocity } : note
        ),
      }));

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.SET_NOTE_VALUE: {
      const { noteId, noteValue } = action.payload;
      const measures = state.pattern.measures.map(measure => ({
        ...measure,
        notes: (measure.notes || []).map(note =>
          note.id === noteId ? { ...note, noteValue } : note
        ),
      }));

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.ADD_MEASURE: {
      const { afterIndex } = action.payload;
      const measures = [...state.pattern.measures];
      const newMeasure = createEmptyMeasure(state.pattern.timeSignature.numerator, state.stepResolution);
      measures.splice(afterIndex + 1, 0, newMeasure);

      return {
        ...state,
        measureCount: measures.length,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.DELETE_MEASURE: {
      const { measureIndex } = action.payload;
      if (state.pattern.measures.length <= 1) return state;

      const measures = state.pattern.measures.filter((_, i) => i !== measureIndex);

      return {
        ...state,
        measureCount: measures.length,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.DUPLICATE_MEASURE: {
      const { measureIndex } = action.payload;
      const measures = [...state.pattern.measures];
      const measureToCopy = measures[measureIndex];
      const newMeasure = {
        id: uuidv4(),
        notes: (measureToCopy?.notes || []).map(n => ({ ...n, id: uuidv4() })),
      };
      measures.splice(measureIndex + 1, 0, newMeasure);

      return {
        ...state,
        measureCount: measures.length,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.QUANTIZE_NOTES: {
      const { quantizeValue, stepsPerMeasure } = action.payload;
      if (!quantizeValue) return state;

      // Calculate steps per quantization grid
      const { numerator, denominator } = state.pattern.timeSignature;
      const quantGridPerMeasure = denominator === 8
        ? numerator * (quantizeValue / 8)
        : numerator * (quantizeValue / 4);
      const stepsPerQuantGrid = stepsPerMeasure / quantGridPerMeasure;

      const measures = state.pattern.measures.map(measure => ({
        ...measure,
        notes: (measure.notes || []).map(note => {
          const quantizedStep = Math.round(note.step / stepsPerQuantGrid) * stepsPerQuantGrid;
          return {
            ...note,
            step: Math.max(0, Math.min(stepsPerMeasure - 1, quantizedStep)),
          };
        }),
      }));

      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    case ACTIONS.UPDATE_SOUND_SETTING: {
      const { drumId, setting, value } = action.payload;
      return {
        ...state,
        pattern: {
          ...state.pattern,
          soundSettings: {
            ...state.pattern.soundSettings,
            [drumId]: {
              ...state.pattern.soundSettings[drumId],
              [setting]: value,
            },
          },
        },
      };
    }

    case ACTIONS.UPDATE_KEY_BINDING: {
      const { drumId, key } = action.payload;
      return {
        ...state,
        pattern: {
          ...state.pattern,
          keyBindings: {
            ...state.pattern.keyBindings,
            [drumId]: key,
          },
        },
      };
    }

    case ACTIONS.UNDO: {
      if (state.undoStack.length === 0) return state;
      const undoStack = [...state.undoStack];
      const lastState = undoStack.pop();
      return {
        ...state,
        pattern: lastState.pattern,
        undoStack,
        redoStack: [...state.redoStack, { pattern: JSON.parse(JSON.stringify(state.pattern)) }],
      };
    }

    case ACTIONS.REDO: {
      if (state.redoStack.length === 0) return state;
      const redoStack = [...state.redoStack];
      const nextState = redoStack.pop();
      return {
        ...state,
        pattern: nextState.pattern,
        redoStack,
        undoStack: [...state.undoStack, { pattern: JSON.parse(JSON.stringify(state.pattern)) }],
      };
    }

    case ACTIONS.RESET_PATTERN:
      return {
        ...state,
        pattern: createDefaultPattern(),
        currentStep: 0,
        currentMeasure: 0,
        selectedNotes: [],
        undoStack: [],
        redoStack: [],
      };

    case ACTIONS.LOAD_PATTERN:
      return {
        ...state,
        pattern: action.payload,
        measureCount: action.payload.measures.length,
        currentStep: 0,
        currentMeasure: 0,
        selectedNotes: [],
        undoStack: [],
        redoStack: [],
      };

    case ACTIONS.SET_PATTERN_NAME:
      return {
        ...state,
        pattern: { ...state.pattern, name: action.payload },
      };

    case ACTIONS.CLEAR_STEP_GRID: {
      const measures = state.pattern.measures.map(measure => ({
        ...measure,
        notes: [],
      }));
      return {
        ...state,
        pattern: { ...state.pattern, measures },
        ...pushUndoState(state),
      };
    }

    default:
      return state;
  }
}

const PatternContext = createContext(null);

export function PatternProvider({ children }) {
  const [state, dispatch] = useReducer(patternReducer, initialState);

  const actions = {
    setPattern: useCallback((pattern) => dispatch({ type: ACTIONS.SET_PATTERN, payload: pattern }), []),
    setBpm: useCallback((bpm) => dispatch({ type: ACTIONS.SET_BPM, payload: bpm }), []),
    setTimeSignature: useCallback((ts) => dispatch({ type: ACTIONS.SET_TIME_SIGNATURE, payload: ts }), []),
    setMode: useCallback((mode) => dispatch({ type: ACTIONS.SET_MODE, payload: mode }), []),
    setPlaying: useCallback((playing) => dispatch({ type: ACTIONS.SET_PLAYING, payload: playing }), []),
    setRecording: useCallback((recording) => dispatch({ type: ACTIONS.SET_RECORDING, payload: recording }), []),
    setMetronome: useCallback((on) => dispatch({ type: ACTIONS.SET_METRONOME, payload: on }), []),
    setLoop: useCallback((on) => dispatch({ type: ACTIONS.SET_LOOP, payload: on }), []),
    setQuantization: useCallback((q) => dispatch({ type: ACTIONS.SET_QUANTIZATION, payload: q }), []),
    setSwing: useCallback((s) => dispatch({ type: ACTIONS.SET_SWING, payload: s }), []),
    setStepResolution: useCallback((r) => dispatch({ type: ACTIONS.SET_STEP_RESOLUTION, payload: r }), []),
    setMeasureCount: useCallback((c) => dispatch({ type: ACTIONS.SET_MEASURE_COUNT, payload: c }), []),
    setCurrentStep: useCallback((s) => dispatch({ type: ACTIONS.SET_CURRENT_STEP, payload: s }), []),
    setCurrentMeasure: useCallback((m) => dispatch({ type: ACTIONS.SET_CURRENT_MEASURE, payload: m }), []),
    setActiveTab: useCallback((t) => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: t }), []),
    setActiveDrumPiece: useCallback((d) => dispatch({ type: ACTIONS.SET_ACTIVE_DRUM_PIECE, payload: d }), []),
    toggleStep: useCallback((payload) => dispatch({ type: ACTIONS.TOGGLE_STEP, payload }), []),
    addNote: useCallback((payload) => dispatch({ type: ACTIONS.ADD_NOTE, payload }), []),
    deleteNotes: useCallback((noteIds) => dispatch({ type: ACTIONS.DELETE_NOTES, payload: noteIds }), []),
    selectNotes: useCallback((noteIds) => dispatch({ type: ACTIONS.SELECT_NOTES, payload: noteIds }), []),
    copyNotes: useCallback(() => dispatch({ type: ACTIONS.COPY_NOTES }), []),
    pasteNotes: useCallback((payload) => dispatch({ type: ACTIONS.PASTE_NOTES, payload }), []),
    moveNote: useCallback((payload) => dispatch({ type: ACTIONS.MOVE_NOTE, payload }), []),
    setNoteVelocity: useCallback((payload) => dispatch({ type: ACTIONS.SET_NOTE_VELOCITY, payload }), []),
    setNoteValue: useCallback((payload) => dispatch({ type: ACTIONS.SET_NOTE_VALUE, payload }), []),
    addMeasure: useCallback((payload) => dispatch({ type: ACTIONS.ADD_MEASURE, payload }), []),
    deleteMeasure: useCallback((payload) => dispatch({ type: ACTIONS.DELETE_MEASURE, payload }), []),
    duplicateMeasure: useCallback((payload) => dispatch({ type: ACTIONS.DUPLICATE_MEASURE, payload }), []),
    quantizeNotes: useCallback((payload) => dispatch({ type: ACTIONS.QUANTIZE_NOTES, payload }), []),
    updateSoundSetting: useCallback((payload) => dispatch({ type: ACTIONS.UPDATE_SOUND_SETTING, payload }), []),
    updateKeyBinding: useCallback((payload) => dispatch({ type: ACTIONS.UPDATE_KEY_BINDING, payload }), []),
    undo: useCallback(() => dispatch({ type: ACTIONS.UNDO }), []),
    redo: useCallback(() => dispatch({ type: ACTIONS.REDO }), []),
    resetPattern: useCallback(() => dispatch({ type: ACTIONS.RESET_PATTERN }), []),
    loadPattern: useCallback((pattern) => dispatch({ type: ACTIONS.LOAD_PATTERN, payload: pattern }), []),
    setPatternName: useCallback((name) => dispatch({ type: ACTIONS.SET_PATTERN_NAME, payload: name }), []),
    clearStepGrid: useCallback(() => dispatch({ type: ACTIONS.CLEAR_STEP_GRID }), []),
  };

  return (
    <PatternContext.Provider value={{ state, actions }}>
      {children}
    </PatternContext.Provider>
  );
}

export function usePattern() {
  const context = useContext(PatternContext);
  if (!context) {
    throw new Error('usePattern must be used within a PatternProvider');
  }
  return context;
}
