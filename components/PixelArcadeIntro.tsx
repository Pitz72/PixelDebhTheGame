
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
    }, 3000); // Intro leggermente più veloce

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = useCallback(() => {
    if (isFadingOut) return;
    soundService.initAudio();
    soundService.playSound('start');
    setIsFadingOut(true);
    setTimeout(() => {
      onIntroComplete();
    }, 800);
  }, [onIntroComplete, isFadingOut]);

  useEffect(() => {
    const handleKeyDown = () => handleContinue();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleContinue]);

  return (
    <div 
        className={`relative w-full h-full bg-gray-900 overflow-hidden flex flex-col justify-center items-center cursor-pointer transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleContinue}
    >
      <style>{`
        .retro-sun {
            width: 300px;
            height: 300px;
            background: linear-gradient(to bottom, #ffeb3b 0%, #ff9800 40%, #f44336 100%);
            border-radius: 50%;
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            box-shadow: 0 0 60px #ff9800, 0 0 100px #f44336;
            clip-path: polygon(
                0% 0%, 100% 0%, 100% 55%, 
                0% 55%, 0% 60%, 100% 60%, 100% 65%, 
                0% 65%, 0% 70%, 100% 70%, 100% 75%, 
                0% 75%, 0% 80%, 100% 80%, 100% 85%, 
                0% 85%, 0% 90%, 100% 90%, 100% 100%, 
                0% 100%
            );
            animation: sunPulse 4s ease-in-out infinite alternate;
        }
        
        @keyframes sunPulse {
            0% { transform: translateX(-50%) scale(1); filter: brightness(1); }
            100% { transform: translateX(-50%) scale(1.05); filter: brightness(1.2); }
        }

        .synth-grid {
            position: absolute;
            bottom: -30%;
            left: -50%;
            width: 200%;
            height: 100%;
            background: 
                linear-gradient(transparent 0%, rgba(200, 0, 255, 0.4) 2%, transparent 3%),
                linear-gradient(90deg, transparent 0%, rgba(200, 0, 255, 0.4) 2%, transparent 3%);
            background-size: 40px 40px;
            transform: perspective(300px) rotateX(60deg);
            animation: gridScroll 2s linear infinite;
            box-shadow: 0 -50px 100px rgba(200, 0, 255, 0.3) inset;
        }

        @keyframes gridScroll {
            0% { background-position: 0 0; }
            100% { background-position: 0 40px; }
        }

        .mountain-silhouette {
            position: absolute;
            bottom: 35%;
            left: 0;
            width: 100%;
            height: 150px;
            background-color: #1a0b2e;
            clip-path: polygon(
                0% 100%, 0% 80%, 10% 40%, 20% 90%, 30% 50%, 40% 80%, 
                50% 20%, 60% 70%, 70% 40%, 80% 90%, 90% 60%, 100% 80%, 100% 100%
            );
            z-index: 1;
        }

        .title-glitch {
            font-family: 'Press Start 2P', cursive;
            font-size: 5rem;
            color: #fff;
            text-shadow: 4px 4px #00eaff, -4px -4px #ff0055;
            position: relative;
            z-index: 10;
            animation: glitch 3s infinite;
        }

        @keyframes glitch {
            0% { transform: skew(0deg); text-shadow: 4px 4px #00eaff, -4px -4px #ff0055; }
            20% { transform: skew(-2deg); text-shadow: -4px 4px #ff0055, 4px -4px #00eaff; }
            21% { transform: skew(10deg); }
            22% { transform: skew(0deg); }
            100% { transform: skew(0deg); }
        }

        .subtitle {
            font-family: 'Press Start 2P', cursive;
            color: #00eaff;
            margin-top: 20px;
            text-transform: uppercase;
            letter-spacing: 4px;
            z-index: 10;
        }
      `}</style>

      <div className="retro-sun"></div>
      <div className="mountain-silhouette"></div>
      <div className="synth-grid"></div>

      <div className="z-10 text-center flex flex-col items-center">
          <h1 className="title-glitch mb-4">PixelDebh</h1>
          <h2 className="text-3xl text-yellow-300" style={{ textShadow: '2px 2px #ff0055', fontFamily: "'Press Start 2P', cursive" }}>
            RETRO-RESCUE!
          </h2>
          
          <div className={`mt-16 transition-opacity duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
             <p className="subtitle animate-pulse text-xl">PRESS ANY KEY TO START</p>
          </div>
      </div>
      
      <div className="absolute bottom-4 text-white text-xs opacity-50 font-sans">
         V.0.2.6 - SYNTHWAVE UPDATE
      </div>
    </div>
  );
};

export default PixelArcadeIntro;
