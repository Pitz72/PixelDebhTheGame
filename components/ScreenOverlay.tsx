import React from 'react';
import OptionsScreen from './OptionsScreen';
import TrophyScreen from './TrophyScreen';
import CreditsScreen from './CreditsScreen';
import HowToPlayScreen from './HowToPlayScreen';
import HighscoreScreen from './HighscoreScreen';

/** The full-screen pages that open over the title and over the pause menu. */
export type OverlayKind = 'options' | 'trophies' | 'credits' | 'howto' | 'leaderboard';

interface ScreenOverlayProps {
  kind: OverlayKind;
  onClose: () => void;
}

const ScreenOverlay: React.FC<ScreenOverlayProps> = ({ kind, onClose }) => {
  switch (kind) {
    case 'options':
      return <OptionsScreen onClose={onClose} />;
    case 'trophies':
      return <TrophyScreen onClose={onClose} />;
    case 'credits':
      return <CreditsScreen onClose={onClose} />;
    case 'howto':
      return <HowToPlayScreen onClose={onClose} />;
    case 'leaderboard':
      return (
        <div className="absolute inset-0 z-[70] bg-[#050114]">
          <HighscoreScreen onStart={onClose} closing />
        </div>
      );
  }
};

export default ScreenOverlay;
