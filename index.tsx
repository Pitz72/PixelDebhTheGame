import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/orbitron';
import '@fontsource/press-start-2p';
import './index.css';
import App from './App';
import { initStorage } from './services/storage';
import { loadAudioSettings } from './services/soundService';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

// A shipped game should not offer the WebView's "Inspect / Reload" menu.
if (!import.meta.env.DEV) {
  window.addEventListener('contextmenu', e => e.preventDefault());
}

const start = async () => {
  await initStorage(); // save data must be in memory before the first screen reads the leaderboard
  loadAudioSettings();

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void start();
