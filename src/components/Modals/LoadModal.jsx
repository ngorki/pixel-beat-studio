import { useState, useCallback, useEffect, useRef } from 'react';
import { usePattern } from '../../store/PatternContext';

const STORAGE_KEY = 'pixelbeat_patterns';

export default function LoadModal({ isOpen, onClose }) {
  const { actions } = usePattern();
  const [patterns, setPatterns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const fileInputRef = useRef(null);

  // Load patterns from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : { patterns: [] };
        setPatterns(data.patterns || []);
      } catch (err) {
        console.error('Error loading patterns:', err);
        setPatterns([]);
      }
    }
  }, [isOpen]);

  const handleLoad = useCallback(() => {
    const pattern = patterns.find(p => p.id === selectedId);
    if (pattern) {
      actions.loadPattern(pattern);
      onClose();
    }
  }, [selectedId, patterns, actions, onClose]);

  const handleDelete = useCallback((id) => {
    if (!window.confirm('Delete this pattern?')) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { patterns: [] };
      data.patterns = data.patterns.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPatterns(data.patterns);

      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Error deleting pattern:', err);
    }
  }, [selectedId]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const pattern = JSON.parse(event.target.result);

        // Validate pattern structure
        if (!pattern.id || !pattern.measures) {
          throw new Error('Invalid pattern format');
        }

        actions.loadPattern(pattern);
        onClose();
      } catch (err) {
        console.error('Error importing pattern:', err);
        alert('Failed to import pattern. Invalid file format.');
      }
    };
    reader.readAsText(file);

    e.target.value = '';
  }, [actions, onClose]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">LOAD PATTERN</h2>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Pattern list */}
        <div className="max-h-64 overflow-y-auto mb-4">
          {patterns.length === 0 ? (
            <div className="text-center py-8 text-[#8888AA] font-pixel text-[10px]">
              NO SAVED PATTERNS
            </div>
          ) : (
            <div className="space-y-2">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={`
                    flex items-center justify-between p-3 cursor-pointer
                    border transition-colors
                    ${selectedId === pattern.id
                      ? 'bg-[#7B2FBE33] border-[#7B2FBE]'
                      : 'bg-[#16213E] border-[#333355] hover:border-[#7B2FBE]'
                    }
                  `}
                  onClick={() => setSelectedId(pattern.id)}
                >
                  <div>
                    <div className="font-pixel text-[10px] text-[#E0D7F5]">
                      {pattern.name}
                    </div>
                    <div className="font-pixel text-[7px] text-[#8888AA] mt-1">
                      {pattern.bpm} BPM | {pattern.timeSignature?.numerator || 4}/{pattern.timeSignature?.denominator || 4} | {pattern.measures?.length || 0} bars
                    </div>
                    <div className="font-pixel text-[6px] text-[#666688] mt-1">
                      {formatDate(pattern.updatedAt || pattern.createdAt)}
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 text-red-400 hover:text-red-300 font-pixel text-[8px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pattern.id);
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between">
          <button className="pixel-btn" onClick={handleImportClick}>
            IMPORT JSON
          </button>
          <div className="flex gap-3">
            <button className="pixel-btn" onClick={onClose}>
              CANCEL
            </button>
            <button
              className="pixel-btn active"
              onClick={handleLoad}
              disabled={!selectedId}
            >
              LOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
