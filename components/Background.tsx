import React from 'react';

interface BackgroundProps {
  cameraX: number;
}

const Background: React.FC<BackgroundProps> = React.memo(({ cameraX }) => {
  return (
    <>
      {/* Layer 1: Sfondo statico (cielo) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#0c1a4d] to-[#200e3d]" 
      />
      
      {/* Layer 2: Stelle distanti (movimento lento) */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5,
          transform: `translateX(-${cameraX * 0.1}px)`,
          willChange: 'transform',
        }}
      />
      
      {/* Layer 3: Stelle vicine (movimento più veloce) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 1px)',
          backgroundSize: '25px 25px',
          opacity: 1,
          transform: `translateX(-${cameraX * 0.3}px)`,
          willChange: 'transform',
        }}
      />
    </>
  );
});

export default Background;