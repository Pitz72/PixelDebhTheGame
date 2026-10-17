import React from 'react';
import MenuList, { type MenuItem } from './MenuList';
import { levels } from '../levels';
import { loadProgress } from '../services/progress';
import { t, useLanguage } from '../services/i18n';

interface LevelSelectScreenProps {
  onClose: () => void;
  /** Start a practice game from this level (index in the level list). */
  onPlay: (levelIndex: number) => void;
}

/**
 * The levels she has reached in a real game, to start again from one of them. A game from here is practice:
 * it goes on from that level but earns no trophies and no place in the leaderboard. The names of the levels
 * are the ones the game gives them (proper names, not translated).
 */
const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ onClose, onPlay }) => {
  useLanguage();
  const { highestLevel } = loadProgress();
  const items: MenuItem[] = levels.map((l, i) => ({
    id: String(i),
    label: l.name.replace(/^Level (\d+)\s*[:—-]\s*/, '$1  ·  ').replace(/^(\d+)  ·  BOSS:/, '$1  ·  BOSS ·'),
    disabled: i > highestLevel,
  }));

  return (
    <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-[#050114] text-white">
      <h2
        className="mb-4 text-6xl font-black tracking-widest text-yellow-300"
        style={{ textShadow: '0 0 24px rgba(250,204,21,0.5), 4px 4px 0px #e8175d' }}
      >
        {t('levels.title')}
      </h2>
      <MenuList
        size="sm"
        width={900}
        items={items}
        initialId={String(highestLevel)}
        onSelect={id => onPlay(Number(id))}
        onBack={onClose}
      />
      <p className="mt-4 max-w-[1100px] text-center text-base text-gray-300">{t('levels.note')}</p>
      <p className="mt-2 text-sm font-bold tracking-widest text-cyan-200">{t('levels.close')}</p>
    </div>
  );
};

export default LevelSelectScreen;
