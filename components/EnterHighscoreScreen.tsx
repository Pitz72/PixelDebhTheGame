import React, { useState, useCallback, useEffect } from 'react';
import * as highscoreService from '../services/highscoreService';
import * as soundService from '../services/soundService';

interface EnterHighscoreScreenProps {
  score: number;
  onHighscoreEntered: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const EnterHighscoreScreen: React.FC<EnterHighscoreScreenProps> = ({ score, onHighscoreEntered }) => {
  const [initials, setInitials] = useState<string[]>(['A', 'A', 'A']);
  const [activeIndex, setActiveIndex] = useState(0);

  const changeLetter = useCallback((direction: number) => {
    soundService.playSound('collect'); // Use a sound for changing letter
    setInitials(currentInitials => {
      const newInitials = [...currentInitials];
      const currentLetter = newInitials[activeIndex];
      const currentIndex = ALPHABET.indexOf(currentLetter);
      const nextIndex = (currentIndex + direction + ALPHABET.length) % ALPHABET.length;
      newInitials[activeIndex] = ALPHABET[nextIndex];
      return newInitials;
    });
  }, [activeIndex]);

  const confirmLetter = useCallback(() => {
    soundService.playSound('start');
    if (activeIndex < 2) {
      setActiveIndex(activeIndex + 1);
    } else {
      const finalName = initials.join('');
      highscoreService.addHighscore(finalName, score);
      onHighscoreEntered();
    }
  }, [activeIndex, initials, score, onHighscoreEntered]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        changeLetter(1);
        break;
      case 's':
      case 'arrowdown':
        changeLetter(-1);
        break;
      case 'enter':
        confirmLetter();
        break;
    }
  }, [changeLetter, confirmLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center p-8">
      <h1 className="text-7xl text-green-400 mb-8" style={{textShadow: '3px 3px #fff'}}>NEW HIGH SCORE!</h1>
      <p className="text-6xl text-white mb-12">{score.toString().padStart(8, '0')}</p>
      
      <div className="flex flex-col items-center">
        <p className="text-4xl text-yellow-400 mb-6">Enter Your Initials</p>
        
        <div className="flex space-x-4">
          {initials.map((letter, index) => (
            <div
              key={index}
              className={`w-28 h-32 flex justify-center items-center text-8xl bg-gray-900 border-4 text-white p-2
                ${index === activeIndex ? 'border-yellow-400 animate-blink' : 'border-gray-600'}`
              }
            >
              {letter}
            </div>
          ))}
        </div>
        
        <div className="text-2xl text-gray-400 mt-10">
            <p>[W/S] or [↑/↓] to Change Letter</p>
            <p className="mt-2">[Enter] to Confirm</p>
        </div>
      </div>
    </div>
  );
};

export default EnterHighscoreScreen;
