
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
    }, 2000);

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
            z-index: 0;
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
            font-size: 4.5rem;
            color: #fff;
            text-shadow: 4px 4px #00eaff, -4px -4px #ff0055;
            position: relative;
            z-index: 10;
            animation: glitch 3s infinite;
            margin-bottom: 1rem;
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
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 4px;
            z-index: 50;
        }

        /* Avatar Animation */
        .pixel-avatar-container {
            position: relative;
            z-index: 10;
            margin-top: 4rem;
            margin-bottom: 2rem;
            animation: floatAvatar 3s ease-in-out infinite;
        }

        @keyframes floatAvatar {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .orbiting-item {
            transform-box: fill-box;
            transform-origin: center;
            animation: orbitItem 4s linear infinite;
        }
        
        .orbiting-item-reverse {
            transform-box: fill-box;
            transform-origin: center;
            animation: orbitItemReverse 5s linear infinite;
        }

        @keyframes orbitItem {
            0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        
        @keyframes orbitItemReverse {
            0% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
            100% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
        }

      `}</style>

      <div className="mountain-silhouette"></div>
      <div className="synth-grid"></div>

      {/* Title Group - Spaced out */}
      <div className="z-10 text-center flex flex-col items-center w-full mt-10">
          <h1 className="title-glitch">PixelDebh</h1>
          <h2 className="text-3xl text-yellow-300" style={{ textShadow: '2px 2px #ff0055', fontFamily: "'Press Start 2P', cursive" }}>
            RETRO-RESCUE!
          </h2>
      </div>

      {/* PIXEL ART AVATAR SVG - Slightly smaller to fit screen better */}
      <div className="pixel-avatar-container">
        <svg width="350" height="350" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="max-h-[40vh]">
            {/* Central Group: The Girl */}
            <g transform="translate(60, 50)">
                {/* Back Hair (Brown) */}
                <rect x="20" y="20" width="40" height="50" fill="#5d4037" />
                
                {/* Neck */}
                <rect x="35" y="55" width="10" height="10" fill="#fdd0b1" />

                {/* Body / Tank Top (Orange) */}
                <rect x="25" y="65" width="30" height="35" fill="#ff7043" />
                <rect x="25" y="65" width="4" height="15" fill="#d84315" /> {/* Strap Shadow */}
                <rect x="51" y="65" width="4" height="15" fill="#d84315" /> 

                {/* Arms (Skin) */}
                <rect x="15" y="65" width="10" height="25" fill="#fdd0b1" /> {/* Left Arm */}
                <rect x="55" y="65" width="10" height="25" fill="#fdd0b1" /> {/* Right Arm */}

                {/* Head (Skin) */}
                <rect x="25" y="25" width="30" height="30" fill="#fdd0b1" />
                
                {/* Face details */}
                <rect x="30" y="35" width="4" height="4" fill="#3e2723" /> {/* Eye L */}
                <rect x="46" y="35" width="4" height="4" fill="#3e2723" /> {/* Eye R */}
                <rect x="38" y="45" width="4" height="2" fill="#d84315" /> {/* Mouth */}
                <rect x="25" y="40" width="2" height="2" fill="#f8bbd0" opacity="0.6" /> {/* Blush */}
                <rect x="53" y="40" width="2" height="2" fill="#f8bbd0" opacity="0.6" />

                {/* Front Hair */}
                <rect x="25" y="20" width="30" height="8" fill="#5d4037" />
                <rect x="22" y="25" width="4" height="15" fill="#5d4037" />
                <rect x="54" y="25" width="4" height="15" fill="#5d4037" />

                {/* Headphones (Red/Orange) */}
                <rect x="18" y="25" width="6" height="20" fill="#d84315" /> {/* Left Cup */}
                <rect x="56" y="25" width="6" height="20" fill="#d84315" /> {/* Right Cup */}
                <rect x="22" y="18" width="36" height="4" fill="#d84315" /> {/* Band */}
                <rect x="18" y="22" width="4" height="4" fill="#d84315" />
                <rect x="58" y="22" width="4" height="4" fill="#d84315" />

                {/* Controller (Held in hands) */}
                <rect x="20" y="75" width="40" height="20" fill="#424242" />
                <rect x="25" y="80" width="6" height="6" fill="#212121" /> {/* D-Pad */}
                <rect x="50" y="80" width="3" height="3" fill="#ef5350" /> {/* Button A */}
                <rect x="46" y="84" width="3" height="3" fill="#42a5f5" /> {/* Button B */}
            </g>

            {/* Orbiting Objects Group - Centered on 100, 100 to rotate around girl */}
            <g transform="translate(100, 100)">
                
                {/* Webcam Item */}
                <g className="orbiting-item">
                    <rect x="-10" y="-10" width="20" height="12" fill="#212121" />
                    <rect x="-5" y="-5" width="10" height="10" fill="#424242" rx="5" />
                    <rect x="-2" y="-2" width="4" height="4" fill="#00e5ff" /> {/* Lens */}
                    <rect x="-3" y="2" width="6" height="8" fill="#212121" /> {/* Stand */}
                    <rect x="-8" y="10" width="16" height="4" fill="#212121" /> {/* Base */}
                </g>

                {/* Cat Head Item */}
                <g className="orbiting-item" style={{ animationDelay: '-1.3s' }}>
                    <rect x="-10" y="-8" width="20" height="16" fill="#fff" />
                    <rect x="-10" y="-12" width="6" height="6" fill="#fff" /> {/* Ear L */}
                    <rect x="4" y="-12" width="6" height="6" fill="#fff" /> {/* Ear R */}
                    <rect x="-6" y="-4" width="2" height="2" fill="#000" /> {/* Eye */}
                    <rect x="4" y="-4" width="2" height="2" fill="#000" /> {/* Eye */}
                    <rect x="-2" y="0" width="4" height="3" fill="#f48fb1" /> {/* Nose */}
                </g>

                 {/* Phone Item */}
                 <g className="orbiting-item-reverse" style={{ animationDelay: '-0.5s' }}>
                    <rect x="-6" y="-10" width="12" height="20" fill="#37474f" />
                    <rect x="-4" y="-8" width="8" height="14" fill="#0277bd" /> {/* Screen */}
                    <rect x="-2" y="6" width="4" height="2" fill="#78909c" /> {/* Button */}
                </g>
                 
                 {/* Floppy Disk */}
                <g className="orbiting-item-reverse" style={{ animationDelay: '-2.5s' }}>
                    <rect x="-8" y="-8" width="16" height="16" fill="#1e88e5"/>
                    <rect x="-4" y="-8" width="8" height="6" fill="white"/>
                    <rect x="-4" y="2" width="8" height="6" fill="#bdbdbd"/>
                </g>

            </g>
        </svg>
      </div>
      
      {/* Press Start Text - Ensured visibility with Z-Index and Relative Positioning */}
      <div className={`mt-8 pb-8 relative z-50 transition-opacity duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
             <p className="subtitle animate-pulse text-2xl bg-black bg-opacity-60 p-3 rounded border-2 border-cyan-500">PRESS START</p>
      </div>
      
      <div className="absolute bottom-4 text-white text-xs opacity-50 font-sans z-20">
         V.0.2.7 - PIXEL ART EDITION
      </div>
    </div>
  );
};

export default PixelArcadeIntro;
