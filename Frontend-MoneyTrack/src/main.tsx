import React from 'react';
import { createRoot } from 'react-dom/client';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import App from './App';

// Configure status bar for native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setBackgroundColor({ color: '#FFFFFF' });
  StatusBar.setStyle({ style: Style.Light });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);