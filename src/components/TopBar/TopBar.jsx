import { useState, useCallback, useEffect } from 'react';
import { usePattern, TIME_SIGNATURES, QUANTIZATION_VALUES } from '../../store/PatternContext';
import Transport from '../Transport';

export default function TopBar({
  onPlay,
  onStop,
  onPause,
  onRecord,
  onStopRecord,
  onSave,
  onLoad,
  onExportMidi,
}) {
  const { state, actions } = usePattern();
  const { pattern, mode, quantization, stepResolution, measureCount } = state;

  // Local state for BPM input to allow typing without immediate clamping
  const [bpmInput, setBpmInput] = useState(String(pattern.bpm));

  // Sync local state when pattern.bpm changes externally (e.g., +/- buttons)
  useEffect(() => {
    setBpmInput(String(pattern.bpm));
  }, [pattern.bpm]);

  const handleBpmChange = useCallback((e) => {
    setBpmInput(e.target.value);
  }, []);

  const commitBpm = useCallback(() => {
    const value = parseInt(bpmInput) || 120;
    actions.setBpm(value);
    setBpmInput(String(Math.max(20, Math.min(300, value))));
  }, [bpmInput, actions]);

  const handleBpmKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      commitBpm();
      e.target.blur();
    }
  }, [commitBpm]);

  const handleTimeSignatureChange = useCallback((e) => {
    const [num, denom] = e.target.value.split('/').map(Number);
    if (window.confirm('Changing time signature will reset the pattern. Continue?')) {
      actions.setTimeSignature({ numerator: num, denominator: denom });
      actions.clearStepGrid();
    }
  }, [actions]);

  const handleQuantizationChange = useCallback((e) => {
    const value = e.target.value === 'null' ? null : parseInt(e.target.value);
    actions.setQuantization(value);
  }, [actions]);

  const handleResolutionChange = useCallback((e) => {
    actions.setStepResolution(parseInt(e.target.value));
  }, [actions]);

  const handleMeasureCountChange = useCallback((e) => {
    actions.setMeasureCount(parseInt(e.target.value));
  }, [actions]);

  return (
    <header className="h-[60px] bg-[#1A1A2E] border-b border-[#333355] px-4 flex items-center justify-between panel-glow">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <h1 className="font-pixel text-[14px] text-[#E040FB] tracking-wider">
          PIXEL BEAT STUDIO
        </h1>

        {/* Mode Toggle */}
        <div className="flex bg-[#0D0D1A] border border-[#333355]">
          <button
            className={`px-3 py-1 font-pixel text-[8px] transition-colors ${
              mode === 'live'
                ? 'bg-[#7B2FBE] text-white'
                : 'text-[#8888AA] hover:text-white'
            }`}
            onClick={() => actions.setMode('live')}
          >
            LIVE
          </button>
          <button
            className={`px-3 py-1 font-pixel text-[8px] transition-colors ${
              mode === 'step'
                ? 'bg-[#7B2FBE] text-white'
                : 'text-[#8888AA] hover:text-white'
            }`}
            onClick={() => actions.setMode('step')}
          >
            STEP SEQ
          </button>
        </div>
      </div>

      {/* Center - Transport */}
      <Transport
        onPlay={onPlay}
        onStop={onStop}
        onPause={onPause}
        onRecord={onRecord}
        onStopRecord={onStopRecord}
      />

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">BPM</span>
          <div className="flex items-center">
            <button
              className="w-6 h-6 bg-[#0D0D1A] border border-[#333355] text-[#E0D7F5] hover:bg-[#2A2A3E]"
              onClick={() => actions.setBpm(pattern.bpm - 1)}
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={bpmInput}
              onChange={handleBpmChange}
              onBlur={commitBpm}
              onKeyDown={handleBpmKeyDown}
              className="pixel-input w-16 text-center"
            />
            <button
              className="w-6 h-6 bg-[#0D0D1A] border border-[#333355] text-[#E0D7F5] hover:bg-[#2A2A3E]"
              onClick={() => actions.setBpm(pattern.bpm + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Time Signature */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">TIME</span>
          <select
            value={`${pattern.timeSignature.numerator}/${pattern.timeSignature.denominator}`}
            onChange={handleTimeSignatureChange}
            className="pixel-select"
          >
            {TIME_SIGNATURES.map((ts) => (
              <option key={ts.label} value={ts.label}>
                {ts.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quantization */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">QUANT</span>
          <select
            value={quantization === null ? 'null' : quantization}
            onChange={handleQuantizationChange}
            className="pixel-select"
          >
            {QUANTIZATION_VALUES.map((q) => (
              <option key={q.label} value={q.value === null ? 'null' : q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        {/* Measures */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#8888AA]">BARS</span>
          <select
            value={measureCount}
            onChange={handleMeasureCountChange}
            className="pixel-select"
          >
            {[1, 2, 4, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[#333355]" />

        {/* Save/Load/Export */}
        <div className="flex items-center gap-2">
          <button
            className="pixel-btn text-[8px]"
            onClick={onSave}
            title="Save Pattern"
          >
            SAVE
          </button>
          <button
            className="pixel-btn text-[8px]"
            onClick={onLoad}
            title="Load Pattern"
          >
            LOAD
          </button>
          <button
            className="pixel-btn text-[8px]"
            onClick={onExportMidi}
            title="Export MIDI"
          >
            MIDI
          </button>
        </div>
      </div>
    </header>
  );
}
