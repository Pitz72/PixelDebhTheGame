import React, { useState, useCallback, FormEvent } from 'react';
import * as highscoreService from '../services/highscoreService';

interface EnterHighscoreScreenProps {
  score: number;
  onHighscoreEntered: () => void;
}

const EnterHighscoreScreen: React.FC<EnterHighscoreScreenProps> = ({ score, onHighscoreEntered }) => {
  const [name, setName] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    setName(value.slice(0, 3));
  };

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (name.length === 3) {
      highscoreService.addHighscore(name, score);
      onHighscoreEntered();
    }
  }, [name, score, onHighscoreEntered]);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-center items-center text-center p-8">
      <h1 className="text-7xl text-green-400 mb-8" style={{textShadow: '3px 3px #fff'}}>NEW HIGH SCORE!</h1>
      <p className="text-6xl text-white mb-12">{score}</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <label htmlFor="name-input" className="text-4xl text-yellow-400 mb-4">Enter Your Initials</label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={handleNameChange}
          maxLength={3}
          className="w-48 text-center text-7xl bg-gray-800 border-4 border-white text-white p-2 outline-none"
          style={{ caretColor: 'transparent' }}
          autoFocus
        />
        <button
          type="submit"
          disabled={name.length !== 3}
          className="text-4xl text-white mt-12 px-8 py-4 border-2 border-white rounded-lg transition-colors disabled:opacity-50 disabled:border-gray-600 disabled:text-gray-600 hover:enabled:bg-white hover:enabled:text-black"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default EnterHighscoreScreen;