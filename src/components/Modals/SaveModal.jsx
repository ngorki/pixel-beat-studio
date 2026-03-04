import { useState, useCallback } from 'react';
import { usePattern } from '../../store/PatternContext';

const STORAGE_KEY = 'pixelbeat_patterns';
const MAX_PATTERNS = 20;

export default function SaveModal({ isOpen, onClose }) {
  const { state, actions } = usePattern();
  const { pattern } = state;
  const [patternName, setPatternName] = useState(pattern.name);
  const [error, setError] = useState(null);

  const handleSave = useCallback(() => {
    try {
      // Load existing patterns
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { patterns: [] };

      // Check if we're updating an existing pattern or creating new
      const existingIndex = data.patterns.findIndex(p => p.id === pattern.id);

      const patternToSave = {
        ...pattern,
        name: patternName || 'Untitled Pattern',
        createdAt: existingIndex >= 0 ? pattern.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing
        data.patterns[existingIndex] = patternToSave;
      } else {
        // Check limit
        if (data.patterns.length >= MAX_PATTERNS) {
          setError(`Maximum of ${MAX_PATTERNS} patterns reached. Delete some patterns first.`);
          return;
        }
        // Add new
        data.patterns.push(patternToSave);
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Update pattern name in state
      actions.setPatternName(patternName);

      onClose();
    } catch (err) {
      console.error('Error saving pattern:', err);
      setError('Failed to save pattern. Storage may be full.');
    }
  }, [pattern, patternName, actions, onClose]);

  const handleExportJson = useCallback(() => {
    const patternToExport = {
      ...pattern,
      name: patternName || pattern.name,
    };

    const blob = new Blob([JSON.stringify(patternToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixelbeat-${patternName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [pattern, patternName]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">SAVE PATTERN</h2>

        <div className="mb-4">
          <label className="block font-pixel text-[8px] text-[#8888AA] mb-2">
            PATTERN NAME
          </label>
          <input
            type="text"
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
            className="pixel-input w-full"
            placeholder="Enter pattern name..."
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 text-red-400 font-pixel text-[8px]">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="pixel-btn" onClick={handleExportJson}>
            EXPORT JSON
          </button>
          <button className="pixel-btn" onClick={onClose}>
            CANCEL
          </button>
          <button
            className="pixel-btn active"
            onClick={handleSave}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
