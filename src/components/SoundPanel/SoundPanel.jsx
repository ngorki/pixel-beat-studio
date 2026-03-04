import { useState, useCallback, useRef } from 'react';
import { usePattern, DRUM_PIECES } from '../../store/PatternContext';

export default function SoundPanel({ onTrigger, loadCustomSample }) {
  const { state, actions } = usePattern();
  const { pattern } = state;
  const soundSettings = pattern.soundSettings;

  const [uploadingPiece, setUploadingPiece] = useState(null);
  const [customFilenames, setCustomFilenames] = useState({});
  const fileInputRef = useRef(null);

  const handleSourceChange = useCallback((drumId, source) => {
    actions.updateSoundSetting({ drumId, setting: 'source', value: source });
  }, [actions]);

  const handleVolumeChange = useCallback((drumId, volume) => {
    actions.updateSoundSetting({ drumId, setting: 'volume', value: volume });
  }, [actions]);

  const handlePitchChange = useCallback((drumId, pitch) => {
    actions.updateSoundSetting({ drumId, setting: 'pitch', value: pitch });
  }, [actions]);

  const handleUploadClick = useCallback((drumId) => {
    setUploadingPiece(drumId);
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPiece) return;

    try {
      const filename = await loadCustomSample(uploadingPiece, file);
      setCustomFilenames(prev => ({ ...prev, [uploadingPiece]: filename }));
      actions.updateSoundSetting({ drumId: uploadingPiece, setting: 'source', value: 'custom' });
    } catch (err) {
      console.error('Error loading custom sample:', err);
      alert('Failed to load custom sample. Please try a different file.');
    }

    setUploadingPiece(null);
    e.target.value = '';
  }, [uploadingPiece, loadCustomSample, actions]);

  const handleTest = useCallback((drumId) => {
    onTrigger(drumId, 100);
  }, [onTrigger]);

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-pixel text-[12px] text-[#E040FB] mb-4">SOUND SETTINGS</h2>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.ogg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Sound rows */}
        <div className="space-y-3">
          {DRUM_PIECES.map((piece) => {
            const settings = soundSettings[piece.id] || { source: 'default', volume: 80, pitch: 0 };

            return (
              <div
                key={piece.id}
                className="bg-[#16213E] border border-[#333355] p-4 flex items-center gap-4"
              >
                {/* Piece name */}
                <div className="w-32 flex-shrink-0">
                  <span className="font-pixel text-[10px] text-[#E0D7F5]">
                    {piece.name}
                  </span>
                </div>

                {/* Source selector */}
                <div className="flex-shrink-0">
                  <div className="flex bg-[#0D0D1A] border border-[#333355]">
                    <button
                      className={`px-2 py-1 font-pixel text-[7px] transition-colors ${
                        settings.source === 'default'
                          ? 'bg-[#7B2FBE] text-white'
                          : 'text-[#8888AA] hover:text-white'
                      }`}
                      onClick={() => handleSourceChange(piece.id, 'default')}
                    >
                      SAMPLE
                    </button>
                    <button
                      className={`px-2 py-1 font-pixel text-[7px] transition-colors ${
                        settings.source === 'synth'
                          ? 'bg-[#7B2FBE] text-white'
                          : 'text-[#8888AA] hover:text-white'
                      }`}
                      onClick={() => handleSourceChange(piece.id, 'synth')}
                    >
                      SYNTH
                    </button>
                    <button
                      className={`px-2 py-1 font-pixel text-[7px] transition-colors ${
                        settings.source === 'custom'
                          ? 'bg-[#7B2FBE] text-white'
                          : 'text-[#8888AA] hover:text-white'
                      }`}
                      onClick={() => handleSourceChange(piece.id, 'custom')}
                    >
                      CUSTOM
                    </button>
                  </div>
                </div>

                {/* Upload button (visible when custom) */}
                {settings.source === 'custom' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      className="pixel-btn text-[7px]"
                      onClick={() => handleUploadClick(piece.id)}
                    >
                      UPLOAD
                    </button>
                    {customFilenames[piece.id] && (
                      <span className="font-pixel text-[7px] text-[#8888AA] truncate max-w-24">
                        {customFilenames[piece.id]}
                      </span>
                    )}
                  </div>
                )}

                {/* Volume */}
                <div className="flex items-center gap-2 flex-1 min-w-32">
                  <span className="font-pixel text-[7px] text-[#8888AA]">VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => handleVolumeChange(piece.id, parseInt(e.target.value))}
                    className="pixel-slider flex-1"
                  />
                  <span className="font-pixel text-[8px] text-[#E0D7F5] w-8">
                    {settings.volume}%
                  </span>
                </div>

                {/* Pitch */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-pixel text-[7px] text-[#8888AA]">PITCH</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={settings.pitch}
                    onChange={(e) => handlePitchChange(piece.id, parseInt(e.target.value))}
                    className="pixel-slider w-20"
                  />
                  <span className="font-pixel text-[8px] text-[#E0D7F5] w-8">
                    {settings.pitch > 0 ? '+' : ''}{settings.pitch}
                  </span>
                </div>

                {/* Test button */}
                <button
                  className="pixel-btn text-[7px] flex-shrink-0"
                  onClick={() => handleTest(piece.id)}
                >
                  TEST
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
