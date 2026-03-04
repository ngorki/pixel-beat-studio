import { useState, useCallback, useEffect } from 'react';
import { PatternProvider, usePattern } from './store/PatternContext';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useTransport } from './hooks/useTransport';
import { useKeyBindings } from './hooks/useKeyBindings';
import { exportToMidi } from './utils/midiExport';
import TopBar from './components/TopBar';
import DrumKit from './components/DrumKit';
import StepSequencer from './components/StepSequencer';
import SheetMusic from './components/SheetMusic';
import SoundPanel from './components/SoundPanel';
import { SaveModal, LoadModal } from './components/Modals';

function AppContent() {
  const { state, actions } = usePattern();
  const { pattern, activeTab, isRecording } = state;

  const [hitPieces, setHitPieces] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Handle drum hit animation
  const handleHit = useCallback((drumId) => {
    setHitPieces(prev => [...prev, drumId]);
    setTimeout(() => {
      setHitPieces(prev => prev.filter(id => id !== drumId));
    }, 150);
  }, []);

  // Audio engine
  const {
    isLoaded,
    loadError,
    latencyWarning,
    triggerDrum,
    loadCustomSample,
    metronomeClick,
  } = useAudioEngine(pattern.soundSettings, handleHit);

  // Transport controls
  const {
    startPlayback,
    stopPlayback,
    pausePlayback,
    startRecording,
    stopRecording,
    recordHit,
  } = useTransport(triggerDrum, metronomeClick);

  // Key bindings
  useKeyBindings(triggerDrum, recordHit, isRecording);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Show latency warning
  useEffect(() => {
    if (latencyWarning) {
      showToast('High audio latency detected', 'warning');
    }
  }, [latencyWarning, showToast]);

  // Show load error
  useEffect(() => {
    if (loadError) {
      showToast('Using synth sounds (samples not loaded)', 'warning');
    }
  }, [loadError, showToast]);

  // Handle MIDI export
  const handleExportMidi = useCallback(() => {
    try {
      exportToMidi(pattern);
      showToast('MIDI file exported!', 'success');
    } catch (err) {
      console.error('MIDI export error:', err);
      showToast('Failed to export MIDI', 'error');
    }
  }, [pattern, showToast]);

  // Combined trigger function that includes hit animation
  const handleTrigger = useCallback((drumId, velocity = 100) => {
    triggerDrum(drumId, velocity);
  }, [triggerDrum]);

  return (
    <div className="h-full flex flex-col bg-[#0D0D1A]">
      {/* CRT Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Top Bar */}
      <TopBar
        onPlay={startPlayback}
        onStop={stopPlayback}
        onPause={pausePlayback}
        onRecord={startRecording}
        onStopRecord={stopRecording}
        onSave={() => setSaveModalOpen(true)}
        onLoad={() => setLoadModalOpen(true)}
        onExportMidi={handleExportMidi}
      />

      {/* Drum Kit */}
      <div className="h-[40vh] min-h-[280px] bg-[#0D0D1A] border-b border-[#333355]">
        <DrumKit onTrigger={handleTrigger} hitPieces={hitPieces} />
      </div>

      {/* Bottom Panel - Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Buttons */}
        <div className="flex bg-[#0D0D1A] px-4 pt-2">
          <button
            className={`tab-btn ${activeTab === 'sequencer' ? 'active' : ''}`}
            onClick={() => actions.setActiveTab('sequencer')}
          >
            STEP SEQ
          </button>
          <button
            className={`tab-btn ${activeTab === 'sheet' ? 'active' : ''}`}
            onClick={() => actions.setActiveTab('sheet')}
          >
            SHEET MUSIC
          </button>
          <button
            className={`tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => actions.setActiveTab('sounds')}
          >
            SOUNDS
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-[#16213E] border-t-2 border-[#7B2FBE] min-h-0">
          {activeTab === 'sequencer' && (
            <StepSequencer onTrigger={handleTrigger} />
          )}
          {activeTab === 'sheet' && (
            <SheetMusic />
          )}
          {activeTab === 'sounds' && (
            <SoundPanel
              onTrigger={handleTrigger}
              loadCustomSample={loadCustomSample}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <SaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
      />
      <LoadModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-[#0D0D1A] flex items-center justify-center z-50">
          <div className="text-center">
            <div className="font-pixel text-[14px] text-[#E040FB] mb-4">
              PIXEL BEAT STUDIO
            </div>
            <div className="font-pixel text-[10px] text-[#8888AA] animate-pulse">
              LOADING...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PatternProvider>
      <AppContent />
    </PatternProvider>
  );
}
