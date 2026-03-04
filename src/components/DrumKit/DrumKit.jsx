import { useCallback } from 'react';
import { usePattern, DRUM_PIECES } from '../../store/PatternContext';
import DrumPiece from './DrumPiece';

export default function DrumKit({ onTrigger, hitCounters }) {
  const { state, actions } = usePattern();
  const { pattern, activeDrumPiece } = state;
  const keyBindings = pattern.keyBindings;

  const handlePieceClick = useCallback((drumId) => {
    onTrigger(drumId, 100);
    actions.setActiveDrumPiece(drumId);
  }, [onTrigger, actions]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {/* Drum Kit Visual Layout */}
      <div className="relative w-full max-w-4xl h-full min-h-[300px] flex items-center justify-center">
        {/* Top Row - Cymbals */}
        <div className="absolute top-0 left-0 right-0 flex justify-center gap-8 md:gap-16">
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'crash')}
            keyBinding={keyBindings['crash']}
            hitCount={hitCounters['crash'] || 0}
            isActive={activeDrumPiece === 'crash'}
            onClick={() => handlePieceClick('crash')}
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'ride')}
            keyBinding={keyBindings['ride']}
            hitCount={hitCounters['ride'] || 0}
            isActive={activeDrumPiece === 'ride'}
            onClick={() => handlePieceClick('ride')}
          />
        </div>

        {/* Middle Row - Hi-Hats and Toms */}
        <div className="absolute top-1/4 left-0 right-0 flex justify-center items-center gap-4 md:gap-8">
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'hihatClosed')}
            keyBinding={keyBindings['hihatClosed']}
            hitCount={hitCounters['hihatClosed'] || 0}
            isActive={activeDrumPiece === 'hihatClosed'}
            onClick={() => handlePieceClick('hihatClosed')}
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'hihatOpen')}
            keyBinding={keyBindings['hihatOpen']}
            hitCount={hitCounters['hihatOpen'] || 0}
            isActive={activeDrumPiece === 'hihatOpen'}
            onClick={() => handlePieceClick('hihatOpen')}
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'tom1')}
            keyBinding={keyBindings['tom1']}
            hitCount={hitCounters['tom1'] || 0}
            isActive={activeDrumPiece === 'tom1'}
            onClick={() => handlePieceClick('tom1')}
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'tom2')}
            keyBinding={keyBindings['tom2']}
            hitCount={hitCounters['tom2'] || 0}
            isActive={activeDrumPiece === 'tom2'}
            onClick={() => handlePieceClick('tom2')}
          />
        </div>

        {/* Bottom Row - Kick, Snare, Floor Tom */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-end gap-4 md:gap-12">
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'snare')}
            keyBinding={keyBindings['snare']}
            hitCount={hitCounters['snare'] || 0}
            isActive={activeDrumPiece === 'snare'}
            onClick={() => handlePieceClick('snare')}
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'kick')}
            keyBinding={keyBindings['kick']}
            hitCount={hitCounters['kick'] || 0}
            isActive={activeDrumPiece === 'kick'}
            onClick={() => handlePieceClick('kick')}
            isLarge
          />
          <DrumPiece
            piece={DRUM_PIECES.find(p => p.id === 'floorTom')}
            keyBinding={keyBindings['floorTom']}
            hitCount={hitCounters['floorTom'] || 0}
            isActive={activeDrumPiece === 'floorTom'}
            onClick={() => handlePieceClick('floorTom')}
          />
        </div>
      </div>
    </div>
  );
}
