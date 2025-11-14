import { HighscoreEntry } from '../types';
import { HIGHSCORE_KEY } from '../constants';

const MAX_SCORES = 5;

const createDefaultScores = (): HighscoreEntry[] => {
    return Array(MAX_SCORES).fill(null).map(() => ({
        name: 'AAA',
        score: 0,
    }));
};

export function getHighscores(): HighscoreEntry[] {
  try {
    const scoresJSON = localStorage.getItem(HIGHSCORE_KEY);
    if (!scoresJSON) return createDefaultScores();
    
    const scores = JSON.parse(scoresJSON);
    
    // Ensure the retrieved data is an array before returning, otherwise return defaults
    if (Array.isArray(scores) && scores.length > 0) {
        return scores.sort((a, b) => b.score - a.score);
    }
    return createDefaultScores();

  } catch (error) {
    console.error("Failed to retrieve highscores:", error);
    return createDefaultScores();
  }
}

function saveHighscores(scores: HighscoreEntry[]): void {
  try {
    const sortedScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SCORES);
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(sortedScores));
  } catch (error) {
    console.error("Failed to save highscores:", error);
  }
}

export function addHighscore(name: string, score: number): void {
  let scores = getHighscores();
  // Filter out default scores if this is the first real entry
  if (scores.every(s => s.name === 'AAA' && s.score === 0)) {
      scores = [];
  }
  scores.push({ name, score });
  saveHighscores(scores);
}

export function isHighscore(score: number): boolean {
  if (score <= 0) return false;
  
  const scores = getHighscores();
  if (scores.length < MAX_SCORES) {
    return true;
  }
  
  const lowestHighscore = scores[scores.length - 1]?.score || 0;
  return score > lowestHighscore;
}