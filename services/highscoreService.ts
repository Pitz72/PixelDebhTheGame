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

    // Pad the array to always have MAX_SCORES entries
    while (sortedScores.length < MAX_SCORES) {
        sortedScores.push({ name: 'AAA', score: 0 });
    }

    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(sortedScores));
  } catch (error) {
    console.error("Failed to save highscores:", error);
  }
}

export function addHighscore(name: string, score: number): void {
  const scores = getHighscores();
  // Filter out the default placeholder entries before adding the new score.
  // A score of 0 is valid, but not from the default 'AAA'.
  const currentRealScores = scores.filter(s => !(s.name === 'AAA' && s.score === 0));

  currentRealScores.push({ name, score });
  saveHighscores(currentRealScores);
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