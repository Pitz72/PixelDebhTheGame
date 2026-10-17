import React from 'react';
import MenuList from './MenuList';
import { t, useLanguage } from '../services/i18n';

interface GameoverScreenProps {
  onRestart: () => void;
  /** Back to the title menu. */
  onTitle: () => void;
}

const GameoverScreen: React.FC<GameoverScreenProps> = ({ onRestart, onTitle }) => {
  useLanguage();
  return (
    <div className="w-full h-full bg-linear-to-b/srgb from-[#1a0008] via-[#0d010a] to-black flex flex-col justify-center items-center">
      <h1
        className="text-9xl font-black text-red-500 mb-14 tracking-wider"
        style={{ textShadow: '0 0 35px rgba(239,68,68,0.75), 5px 5px 0px #ffffff' }}
      >
        GAME OVER
      </h1>
      <MenuList
        size="lg"
        width={560}
        items={[
          { id: 'retry', label: t('gameover.retry') },
          { id: 'title', label: t('gameover.title') },
        ]}
        onSelect={id => (id === 'retry' ? onRestart() : onTitle())}
        onBack={onTitle}
      />
    </div>
  );
};

export default GameoverScreen;
