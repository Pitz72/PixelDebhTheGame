import React, { useState, useEffect } from 'react';
import * as highscoreService from '../services/highscoreService';
import { HighscoreEntry } from '../types';

interface HighscoreScreenProps {
  onBack: () => void;
}

const HighscoreScreen: React.FC<HighscoreScreenProps> = ({ onBack }) => {
  const [scores, setScores] = useState<HighscoreEntry[]>([]);

  useEffect(() => {
    setScores(highscoreService.getHighscores());
  }, []);

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

      <button
        onClick={onBack}
        className="text-4xl text-white mt-16 px-8 py-4 border-2 border-white rounded-lg hover:bg-white hover:text-black transition-colors"
      >
        Back
      </button>
    </div>
  );
};

export default HighscoreScreen;