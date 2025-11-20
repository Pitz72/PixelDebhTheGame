
import React from 'react';

interface BackgroundProps {
  cameraX: number;
  cameraY?: number;
}

const Background: React.FC<BackgroundProps> = React.memo(({ cameraX, cameraY = 0 }) => {
  return (
    <>
      {/* Layer 1: Sfondo statico (cielo) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#050014] via-[#1a0b2e] to-[#2d1b4e]" 
      />
      
      {/* Layer 2: Stelle distanti (movimento lento) */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5,
          transform: `translate3d(-${cameraX * 0.05}px, -${cameraY * 0.05}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* Layer 3: Montagne/Città digitale (Parallasse medio) */}
      <div 
        className="absolute bottom-0 left-0 h-64 w-[200%]"
        style={{
            transform: `translate3d(-${cameraX * 0.15}px, ${cameraY * 0.1}px, 0)`,
            willChange: 'transform',
            background: 'linear-gradient(to top, #1a0b2e 0%, transparent 100%)',
        }}
      >
         {/* Silhouette using repeating-linear-gradient trick for buildings */}
         <div className="w-full h-full" style={{
             backgroundImage: 'linear-gradient(to right, #100520 5px, transparent 5px), linear-gradient(to right, #100520 10px, transparent 10px)',
             backgroundSize: '40px 100px, 90px 150px',
             backgroundPosition: 'bottom',
             backgroundRepeat: 'repeat-x',
             opacity: 0.7
         }} />
      </div>
      
      {/* Layer 4: Stelle vicine (movimento più veloce) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)',
          backgroundSize: '25px 25px',
          opacity: 0.8,
          transform: `translate3d(-${cameraX * 0.3}px, -${cameraY * 0.3}px, 0)`,
          willChange: 'transform',
        }}
      />
    </>
  );
});

export default Background;
