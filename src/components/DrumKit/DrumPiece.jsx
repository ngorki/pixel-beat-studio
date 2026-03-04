import { useState, useEffect } from 'react';

const PIECE_STYLES = {
  kick: {
    width: 100,
    height: 100,
    shape: 'circle',
    color: '#7B2FBE',
    label: 'KICK',
  },
  snare: {
    width: 70,
    height: 40,
    shape: 'ellipse',
    color: '#E040FB',
    label: 'SNARE',
  },
  hihatClosed: {
    width: 60,
    height: 20,
    shape: 'ellipse',
    color: '#FFD700',
    label: 'HH-C',
  },
  hihatOpen: {
    width: 60,
    height: 20,
    shape: 'ellipse',
    color: '#FFA500',
    label: 'HH-O',
  },
  tom1: {
    width: 55,
    height: 35,
    shape: 'ellipse',
    color: '#00FF9F',
    label: 'TOM1',
  },
  tom2: {
    width: 60,
    height: 40,
    shape: 'ellipse',
    color: '#00CED1',
    label: 'TOM2',
  },
  floorTom: {
    width: 75,
    height: 50,
    shape: 'ellipse',
    color: '#4169E1',
    label: 'FLOOR',
  },
  crash: {
    width: 80,
    height: 15,
    shape: 'ellipse',
    color: '#FFD700',
    label: 'CRASH',
  },
  ride: {
    width: 85,
    height: 15,
    shape: 'ellipse',
    color: '#DAA520',
    label: 'RIDE',
  },
};

export default function DrumPiece({ piece, keyBinding, hitCount, isActive, onClick, isLarge }) {
  const [animating, setAnimating] = useState(false);
  const style = PIECE_STYLES[piece.id] || PIECE_STYLES.snare;
  const isCymbal = piece.type === 'cymbal';

  // Trigger animation whenever hitCount changes (and is > 0)
  useEffect(() => {
    if (hitCount > 0) {
      setAnimating(true);
      const timeout = setTimeout(() => setAnimating(false), isCymbal ? 150 : 100);
      return () => clearTimeout(timeout);
    }
  }, [hitCount, isCymbal]);

  const scale = isLarge ? 1.3 : 1;
  const width = style.width * scale;
  const height = style.height * scale;

  return (
    <div
      className={`
        relative cursor-pointer select-none
        transition-transform duration-75
        ${animating ? (isCymbal ? 'cymbal-hit' : 'drum-hit') : ''}
      `}
      onClick={onClick}
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
      }}
    >
      {/* Drum visual */}
      <div
        className={`
          relative flex items-center justify-center
          border-2 transition-all duration-75
          ${isActive ? 'ring-2 ring-offset-2 ring-offset-[#0D0D1A]' : ''}
        `}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: `${style.color}33`,
          borderColor: style.color,
          borderRadius: style.shape === 'circle' ? '50%' : `${width / 2}px / ${height / 2}px`,
          boxShadow: animating
            ? `0 0 20px ${style.color}, inset 0 0 10px ${style.color}`
            : `0 0 5px ${style.color}44`,
          ringColor: style.color,
        }}
      >
        {/* Pixel art pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            borderRadius: 'inherit',
            backgroundImage: `
              linear-gradient(45deg, transparent 25%, ${style.color}22 25%, ${style.color}22 50%, transparent 50%, transparent 75%, ${style.color}22 75%)
            `,
            backgroundSize: '8px 8px',
          }}
        />

        {/* Label */}
        <span
          className="font-pixel text-[8px] text-center relative z-10"
          style={{ color: style.color, textShadow: '1px 1px 0 #000' }}
        >
          {style.label}
        </span>
      </div>

      {/* Key binding label */}
      <div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2
                   font-pixel text-[10px] px-2 py-1
                   bg-[#1A1A2E] border border-[#333355] text-[#8888AA]"
      >
        [{keyBinding?.toUpperCase() || '?'}]
      </div>
    </div>
  );
}
