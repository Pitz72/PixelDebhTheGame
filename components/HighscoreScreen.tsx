import React, { useState, useEffect, useCallback } from 'react';
import * as highscoreService from '../services/highscoreService';
import * as soundService from '../services/soundService';
import { HighscoreEntry } from '../types';

interface HighscoreScreenProps {
  onStart: () => void;
}

const HighscoreScreen: React.FC<HighscoreScreenProps> = ({ onStart }) => {
  const [scores, setScores] = useState<HighscoreEntry[]>([]);

  useEffect(() => {
    setScores(highscoreService.getHighscores());
  }, []);

  const handleStart = useCallback(() => {
    soundService.playSound('start');
    onStart();
  }, [onStart]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  }, [handleStart]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center p-8">
      <h1 className="text-8xl text-yellow-400 mb-12" style={{textShadow: '4px 4px #e8175d'}}>High Scores</h1>
      
      <div className="w-full max-w-4xl text-5xl text-white">
        {scores.length > 0 ? (
          scores.map((entry, index) => (
            <div key={index} className="flex justify-between p-4 my-2 border-b-2 border-gray-700">
              <span className="text-cyan-400">{index + 1}. {entry.name}</span>
              <span>{entry.score.toString().padStart(8, '0')}</span>
            </div>
          ))
        ) : (
          <p className="text-4xl text-gray-500 mt-8">No scores yet!</p>
        )}
      </div>

      <p className="text-4xl text-white animate-blink mt-16">Press Enter to Start</p>
    </div>
  );
};

export default HighscoreScreen;