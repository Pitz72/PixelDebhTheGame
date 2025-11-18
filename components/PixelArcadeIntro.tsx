
import React, { useState, useEffect, useCallback } from 'react';
import * as soundService from '../services/soundService';

interface PixelArcadeIntroProps {
  onIntroComplete: () => void;
}

const PixelArcadeIntro: React.FC<PixelArcadeIntroProps> = ({ onIntroComplete }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = useCallback(() => {
    if (isFadingOut) return;
    soundService.initAudio();
    soundService.playSound('start');
    setIsFadingOut(true);
    setTimeout(() => {
      onIntroComplete();
    }, 500);
  }, [onIntroComplete, isFadingOut]);

  useEffect(() => {
    if (animationComplete) {
      const handleKeyDown = () => handleContinue();
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [animationComplete, handleContinue]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center perspective-container ${isFadingOut ? 'opacity-0 transition-opacity duration-500' : ''}`}>
      <style>{`
        .perspective-container {
            perspective: 600px;
            background: linear-gradient(to bottom, #110022 0%, #220033 60%, #ff00cc 100%);
        }
        
        .grid-floor {
            position: absolute;
            bottom: -50%;
            left: -50%;
            width: 200%;
            height: 100%;
            background-image: 
                linear-gradient(0deg, transparent 24%, rgba(255, 0, 204, .5) 25%, rgba(255, 0, 204, .5) 26%, transparent 27%, transparent 74%, rgba(255, 0, 204, .5) 75%, rgba(255, 0, 204, .5) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(255, 0, 204, .5) 25%, rgba(255, 0, 204, .5) 26%, transparent 27%, transparent 74%, rgba(255, 0, 204, .5) 75%, rgba(255, 0, 204, .5) 76%, transparent 77%, transparent);
            background-size: 60px 60px;
            transform: rotateX(60deg);
            animation: gridMove 1s linear infinite;
        }

        @keyframes gridMove {
            0% { transform: rotateX(60deg) translateY(0); }
            100% { transform: rotateX(60deg) translateY(60px); }
        }

        .sun {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 200px;
            background: linear-gradient(to bottom, #ffcc00, #ff00cc);
            border-radius: 50%;
            box-shadow: 0 0 40px #ff00cc;
            clip-path: polygon(0 0, 100% 0, 100% 60%, 0 60%, 0 65%, 100% 65%, 100% 70%, 0 70%, 0 75%, 100% 75%, 100% 80%, 0 80%, 0 85%, 100% 85%, 100% 100%, 0 100%);
            animation: sunRise 3s ease-out forwards;
        }

        @keyframes sunRise {
            from { bottom: -200px; opacity: 0; }
            to { top: 20%; opacity: 1; }
        }

        .logo-container {
            z-index: 10;
            text-align: center;
            transform: translateZ(50px);
        }

        .glitch-text {
            font-size: 6rem;
            font-weight: bold;
            text-transform: uppercase;
            position: relative;
            text-shadow: 0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff,
                        0.025em 0.04em 0 #fffc00;
            animation: glitch 725ms infinite;
        }

        @keyframes glitch {
            0% { text-shadow: 0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff, 0.025em 0.04em 0 #fffc00; }
            15% { text-shadow: 0.05em 0 0 #00fffc, -0.03em -0.04em 0 #fc00ff, 0.025em 0.04em 0 #fffc00; }
            16% { text-shadow: -0.05em -0.025em 0 #00fffc, 0.025em 0.035em 0 #fc00ff, -0.05em -0.05em 0 #fffc00; }
            49% { text-shadow: -0.05em -0.025em 0 #00fffc, 0.025em 0.035em 0 #fc00ff, -0.05em -0.05em 0 #fffc00; }
            50% { text-shadow: 0.05em 0.035em 0 #00fffc, 0.03em 0 0 #fc00ff, 0 -0.04em 0 #fffc00; }
            99% { text-shadow: 0.05em 0.035em 0 #00fffc, 0.03em 0 0 #fc00ff, 0 -0.04em 0 #fffc00; }
            100% { text-shadow: -0.05em 0 0 #00fffc, -0.025em -0.04em 0 #fc00ff, -0.04em -0.025em 0 #fffc00; }
        }
      `}</style>

      <div className="grid-floor"></div>
      <div className="sun"></div>
      
      <div className="logo-container">
          <h1 className="glitch-text text-white mb-8 font-sans tracking-widest">PixelDebh</h1>
          {animationComplete && (
            <p className="text-2xl text-cyan-400 animate-pulse font-mono">PRESS ANY KEY TO START</p>
          )}
      </div>
    </div>
  );
};

export default PixelArcadeIntro;
