import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

declare global {
  interface Window {
    __GAME_INITIALIZED__?: boolean;
  }
}

if (!window.__GAME_INITIALIZED__) {
  window.__GAME_INITIALIZED__ = true;
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
}
