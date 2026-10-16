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
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = useCallback(() => {
    if (isFadingOut) return;
    soundService.initAudio();
    soundService.playSound('start');
    setIsFadingOut(true);
    setTimeout(() => {
      onIntroComplete();
    }, 650);
  }, [onIntroComplete, isFadingOut]);

  useEffect(() => {
    const handleKeyDown = () => handleContinue();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleContinue]);

  return (
    <div
      className={`relative w-full h-full bg-[#050114] overflow-hidden flex flex-col justify-center items-center cursor-pointer transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleContinue}
    >
      <style>{`
        .synth-grid-hd {
          position: absolute;
          bottom: -30%;
          left: -50%;
          width: 200%;
          height: 95%;
          background:
            linear-gradient(transparent 0%, rgba(0, 229, 255, 0.45) 2%, transparent 3%),
            linear-gradient(90deg, transparent 0%, rgba(255, 0, 128, 0.45) 2%, transparent 3%);
          background-size: 48px 48px;
          transform: perspective(340px) rotateX(62deg);
          animation: gridScrollHD 1.8s linear infinite;
          box-shadow: 0 -60px 120px rgba(124, 77, 255, 0.35) inset;
          z-index: 0;
        }
        @keyframes gridScrollHD {
          0% { background-position: 0 0; }
          100% { background-position: 0 48px; }
        }
        .official-logo-float {
          position: relative;
          z-index: 10;
          animation: floatLogoHD 3.2s ease-in-out infinite;
        }
        @keyframes floatLogoHD {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-14px) scale(1.025); }
        }
        .ring-spin-cw {
          animation: ringSpinCW 14s linear infinite;
          transform-origin: center;
        }
        .ring-spin-ccw {
          animation: ringSpinCCW 18s linear infinite;
          transform-origin: center;
        }
        @keyframes ringSpinCW {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ringSpinCCW {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      {/* Vector Horizon & Nebula Backdrop */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <radialGradient id="intro-nebula" cx="50%" cy="46%" r="55%">
            <stop offset="0%" stopColor="#ff6d00" stopOpacity="0.32" />
            <stop offset="45%" stopColor="#ff0055" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#651fff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#050114" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#intro-nebula)" />
        <polygon
          points="0,720 0,610 180,470 360,620 580,420 810,600 960,440 1160,610 1390,430 1620,590 1790,480 1920,600 1920,720"
          fill="#120529"
          stroke="#00e5ff"
          strokeWidth="2.5"
          strokeOpacity="0.5"
        />
      </svg>

      <div className="synth-grid-hd" />

      {/* Top Banner */}
      <div className="z-10 text-center flex flex-col items-center w-full mt-2">
        <span className="px-5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/60 text-orange-300 text-xs font-extrabold tracking-[0.3em] uppercase mb-2 shadow-[0_0_20px_rgba(255,109,0,0.35)]">
          IL VIDEOGIOCO UFFICIALE DEL CANALE YOUTUBE
        </span>
        <h1
          className="text-7xl font-black tracking-wider text-white mb-1"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 25px #00e5ff, 4px 4px 0px #ff3d00',
          }}
        >
          PIXELDEBH
        </h1>
        <h2
          className="text-2xl font-extrabold tracking-[0.28em] text-yellow-300 uppercase"
          style={{ textShadow: '0 0 14px #ff0055' }}
        >
          RETRO-RESCUE! • VECTOR HD EDITION
        </h2>
      </div>

      {/* Official PixelDebh Logo Centerpiece with Holographic Vector Rings */}
      <div className="official-logo-float my-3 flex items-center justify-center relative w-[430px] h-[430px]">
        {/* Animated Outer Energy Rings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 440 440"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="logo-aura-glow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#ff9100" stopOpacity="0.25" />
              <stop offset="82%" stopColor="#00e5ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="220" cy="220" r="208" fill="url(#logo-aura-glow)" />
          <circle
            className="ring-spin-cw"
            cx="220"
            cy="220"
            r="196"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="3"
            strokeDasharray="22 12 6 12"
            opacity="0.85"
          />
          <circle
            className="ring-spin-ccw"
            cx="220"
            cy="220"
            r="184"
            fill="none"
            stroke="#ff9100"
            strokeWidth="2.5"
            strokeDasharray="14 18"
            opacity="0.8"
          />
          {/* Corner Arcade Sparkles */}
          <circle cx="48" cy="85" r="5" fill="#ffea00" className="animate-ping" />
          <circle cx="392" cy="95" r="4" fill="#00e5ff" className="animate-pulse" />
          <circle cx="62" cy="355" r="4" fill="#ff4081" className="animate-pulse" />
          <circle cx="382" cy="348" r="5" fill="#00e676" className="animate-ping" />
        </svg>

        {/* Official Uploaded Circular Logo */}
        <img
          src="/pixeldebh-logo.png"
          alt="PixelDebh Official Logo"
          className="w-[348px] h-[348px] object-contain relative z-10 select-none"
          style={{
            filter:
              'drop-shadow(0 0 28px rgba(255, 145, 0, 0.55)) drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7))',
          }}
          draggable={false}
        />
      </div>

      {/* Prompt */}
      <div className={`mt-1 z-50 transition-opacity duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-2xl font-black tracking-widest text-cyan-300 bg-[#0d0628]/90 px-9 py-3.5 rounded-2xl border-2 border-cyan-400 shadow-[0_0_28px_rgba(0,229,255,0.5)] animate-pulse">
          PREMI UN TASTO O CLICCA PER INIZIARE
        </p>
      </div>

      <div className="absolute bottom-3 text-cyan-300/60 text-xs tracking-widest font-bold z-20">
        V.1.1.0 — OFFICIAL LOGO EDITION • ULTRA HD VECTOR ENGINE &amp; VISUAL FX
      </div>
    </div>
  );
};

export default PixelArcadeIntro;
