import { useCallback } from 'react';
import { usePattern } from '../../store/PatternContext';

export default function Transport({
  onPlay,
  onStop,
  onPause,
  onRecord,
  onStopRecord,
}) {
  const { state, actions } = usePattern();
  const { isPlaying, isRecording, metronomeOn, loopOn } = state;

  return (
    <div className="flex items-center gap-3">
      {/* Record Button */}
      <button
        className={`pixel-btn ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? onStopRecord : onRecord}
        aria-label={isRecording ? 'Stop Recording' : 'Record'}
      >
        <span className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-red-700'
            }`}
          />
          REC
        </span>
      </button>

      {/* Play/Pause Button */}
      <button
        className={`pixel-btn ${isPlaying ? 'active' : ''}`}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <span className="flex items-center gap-2">
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="3" height="10" />
              <rect x="8" y="1" width="3" height="10" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <polygon points="2,1 2,11 11,6" />
            </svg>
          )}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </span>
      </button>

      {/* Stop Button */}
      <button
        className="pixel-btn"
        onClick={onStop}
        aria-label="Stop"
      >
        <span className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="10" height="10" />
          </svg>
          STOP
        </span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-[#333355] mx-2" />

      {/* Loop Toggle */}
      <button
        className={`pixel-btn ${loopOn ? 'active' : ''}`}
        onClick={() => actions.setLoop(!loopOn)}
        aria-label={loopOn ? 'Disable Loop' : 'Enable Loop'}
      >
        <span className="flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11v-1a4 4 0 014-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v1a4 4 0 01-4 4H3" />
          </svg>
          LOOP
        </span>
      </button>

      {/* Metronome Toggle */}
      <button
        className={`pixel-btn ${metronomeOn ? 'active' : ''}`}
        onClick={() => actions.setMetronome(!metronomeOn)}
        aria-label={metronomeOn ? 'Disable Metronome' : 'Enable Metronome'}
      >
        <span className="flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v8" />
            <path d="M5 12l7-3 7 3" />
            <path d="M5 12v8a2 2 0 002 2h10a2 2 0 002-2v-8" />
            <path d="M12 10l4-6" />
          </svg>
          METRO
        </span>
      </button>
    </div>
  );
}
