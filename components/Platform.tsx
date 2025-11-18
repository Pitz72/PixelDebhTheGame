
import React from 'react';
import { Platform as PlatformType } from '../types';

const Platform: React.FC<{ platform: PlatformType }> = ({ platform }) => (
  <div
    style={{
      position: 'absolute',
      left: platform.x,
      top: platform.y,
      width: platform.width,
      height: platform.height,
      backgroundColor: '#1a1a2e',
      // Cyber-block texture using gradients
      backgroundImage: `
        linear-gradient(45deg, #2a2a3e 25%, transparent 25%, transparent 75%, #2a2a3e 75%, #2a2a3e),
        linear-gradient(45deg, #2a2a3e 25%, transparent 25%, transparent 75%, #2a2a3e 75%, #2a2a3e)
      `,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
      borderTop: '4px solid #00eaff', // Neon cyan top
      borderBottom: '4px solid #5e2a84',
      borderLeft: '1px solid #5e2a84',
      borderRight: '1px solid #5e2a84',
      boxShadow: '0 0 5px rgba(0, 234, 255, 0.3)',
    }}
  />
);

export default Platform;
