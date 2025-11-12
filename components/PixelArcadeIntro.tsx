
import React, { useState, useEffect, useCallback } from 'react';
import * as soundService from '../services/soundService';

interface PixelArcadeIntroProps {
  onIntroComplete: () => void;
}

const PixelArcadeIntro: React.FC<PixelArcadeIntroProps> = ({ onIntroComplete }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
    }, 2800);

    const completeTimer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, []);

  const handleContinue = useCallback(() => {
    if (isFadingOut) return;
    soundService.initAudio();
    soundService.playSound('start');
    setIsFadingOut(true);
    setTimeout(() => {
      onIntroComplete();
    }, 500); // Match fade animation duration
  }, [onIntroComplete, isFadingOut]);

  useEffect(() => {
    if (animationComplete) {
      const handleKeyDown = (e: KeyboardEvent) => {
        handleContinue();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [animationComplete, handleContinue]);

  const elements = [
    { id: 'bg', delay: 0, from: 'center', scale: true },
    { id: 'character', delay: 0.3, from: 'bottom', icon: '👧', size: 120 },
    { id: 'headphones', delay: 0.5, from: 'left', icon: '🎧', size: 60, offsetX: -80, offsetY: -60 },
    { id: 'controller', delay: 0.7, from: 'right', icon: '🎮', size: 55, offsetX: 75, offsetY: 40 },
    { id: 'phone', delay: 0.9, from: 'top-left', icon: '📱', size: 45, offsetX: -110, offsetY: 30 },
    { id: 'cat1', delay: 1.1, from: 'left', icon: '🐱', size: 40, offsetX: -120, offsetY: -100 },
    { id: 'music', delay: 1.3, from: 'top-right', icon: '🎵', size: 35, offsetX: 100, offsetY: -80 },
    { id: 'cat2', delay: 1.5, from: 'bottom-right', icon: '😺', size: 38, offsetX: 110, offsetY: 90 },
    { id: 'sparkle1', delay: 1.7, from: 'top', icon: '✨', size: 30, offsetX: -90, offsetY: -130 },
    { id: 'sparkle2', delay: 1.8, from: 'right', icon: '💫', size: 30, offsetX: 130, offsetY: -30 },
    { id: 'heart', delay: 1.9, from: 'bottom-left', icon: '💖', size: 35, offsetX: -130, offsetY: 120 },
  ];

  const getInitialPosition = (from: string) => {
    const distance = 150;
    switch(from) {
      case 'top': return { x: 0, y: -distance };
      case 'bottom': return { x: 0, y: distance };
      case 'left': return { x: -distance, y: 0 };
      case 'right': return { x: distance, y: 0 };
      case 'top-left': return { x: -distance, y: -distance };
      case 'top-right': return { x: distance, y: -distance };
      case 'bottom-left': return { x: -distance, y: distance };
      case 'bottom-right': return { x: distance, y: distance };
      case 'center': return { x: 0, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 overflow-hidden flex justify-center items-center">
      {/* Flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-pulse" />
      )}
      
      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none z-40 opacity-10"
           style={{
             backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, black 2px, black 4px)',
           }} />

      {/* Main container - Scaled up for more impact */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ transform: 'scale(1.75)' }}
      >
        {/* Background circle */}
        <div 
          className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-orange-300 to-red-400 shadow-2xl"
          style={{
            animation: 'scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            transform: 'scale(0)',
            opacity: 0.6,
          }}
        />

        {/* Animated elements */}
        {elements.map((element) => {
          const initialPos = getInitialPosition(element.from);
          const finalX = element.offsetX || 0;
          const finalY = element.offsetY || 0;
          
          const style: React.CSSProperties = {
            fontSize: `${element.size}px`,
            animation: `flyIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${element.delay}s forwards`,
            transform: `translate(${initialPos.x}vw, ${initialPos.y}vh) rotate(${Math.random() * 720 - 360}deg) scale(0)`,
            '--final-x': `${finalX}px`,
            '--final-y': `${finalY}px`,
          };

          return (
            <div
              key={element.id}
              className="absolute flex items-center justify-center"
              style={style}
            >
              {element.id === 'character' ? (
                <div className="relative">
                  {/* Character head */}
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-gray-800 relative">
                    {/* Eyes */}
                    <div className="absolute top-8 left-4 w-4 h-5 bg-gray-800 rounded-full" />
                    <div className="absolute top-8 right-4 w-4 h-5 bg-gray-800 rounded-full" />
                    {/* Mouth */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-4 border-b-4 border-gray-800 rounded-b-full" />
                    {/* Hair */}
                    <div className="absolute -top-2 -left-2 w-20 h-16 bg-gray-800 rounded-t-full" />
                  </div>
                </div>
              ) : (
                <span className="drop-shadow-lg">{element.icon}</span>
              )}
            </div>
          );
        })}

        {/* Title */}
        <div 
          className="absolute z-30"
          style={{
            animation: 'titleAppear 0.5s ease-out 2.5s forwards',
            opacity: 0,
            transform: 'scale(0.5)',
          }}
        >
          <h1 className="text-7xl font-black text-white relative"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                letterSpacing: '0.1em',
              }}>
            PIXEL
          </h1>
          <h2 className="text-5xl font-black text-white text-center mt-4"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                letterSpacing: '0.1em',
              }}>
            DEBH
          </h2>
        </div>
      </div>
      
      {/* Press Start - Positioned relative to the viewport to avoid being pushed off-screen */}
      {animationComplete && (
        <div 
          className="absolute text-white text-2xl font-bold"
          style={{
            bottom: '15%', // Adjusted for visibility with scaling
            animation: 'intro-blink 1s infinite',
            fontFamily: "'Press Start 2P', cursive",
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          PRESS START
        </div>
      )}

      {/* Fade out overlay */}
      {isFadingOut && (
        <div
          className="absolute inset-0 bg-black z-50"
          style={{ animation: 'fadeOut 0.5s ease-in forwards' }}
        />
      )}
    </div>
  );
};

export default PixelArcadeIntro;