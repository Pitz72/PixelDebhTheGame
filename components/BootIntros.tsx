import React, { useEffect, useRef, useState } from 'react';
import RuntimeIntro from '../intro/RuntimeIntro';
import DebhIntroVideo from './DebhIntroVideo';

/** Black between the two intros. */
export const GAP_MS = 500;

type Stage = 'runtime' | 'gap' | 'video';

interface BootIntrosProps {
  onDone: () => void;
}

/**
 * What the game shows when it starts, before the note on the AI and the title: half a second of black,
 * the animated logo of Runtime Multimedia, half a second of black, the animated intro of the Pixel Debh
 * channel. Full window on pure black (these pieces are sized on the window, not on the 1920x1080 stage).
 */
const BootIntros: React.FC<BootIntrosProps> = ({ onDone }) => {
  const [stage, setStage] = useState<Stage>('runtime');
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  // the half second of black before the logo is inside RuntimeIntro (see NERO_MS)
  const afterRuntime = () => {
    setStage('gap');
    timer.current = window.setTimeout(() => setStage('video'), GAP_MS);
  };

  return (
    <div className="fixed inset-0 bg-black" style={{ zIndex: 100 }}>
      {stage === 'runtime' && <RuntimeIntro onDone={afterRuntime} />}
      {stage === 'video' && <DebhIntroVideo onDone={onDone} />}
    </div>
  );
};

export default BootIntros;
