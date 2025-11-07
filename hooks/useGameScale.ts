
import { useState, useEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export const useGameScale = () => {
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });
  const [margins, setMargins] = useState({ marginTop: 0, marginLeft: 0 });

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      const scale = Math.min(innerWidth / GAME_WIDTH, innerHeight / GAME_HEIGHT);
      
      const scaledWidth = GAME_WIDTH * scale;
      const scaledHeight = GAME_HEIGHT * scale;

      setScale(scale);
      setDimensions({ width: scaledWidth, height: scaledHeight });
      setMargins({
        marginTop: (innerHeight - scaledHeight) / 2,
        marginLeft: (innerWidth - scaledWidth) / 2,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { scale, dimensions, margins };
};
