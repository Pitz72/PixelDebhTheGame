
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
      backgroundColor: '#5D637C',
      borderTop: '4px solid #A8ADBD',
      borderLeft: '4px solid #A8ADBD',
      borderRight: '4px solid #3E4252',
      borderBottom: '4px solid #3E4252',
    }}
  />
);

export default Platform;
