import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

// Register Service Worker for Offline PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker kayıt edildi (Çevrim Dışı Mod):', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker kaydı başarısız:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
