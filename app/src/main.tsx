import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import { App } from './App';
import { initDemoFromUrl } from './demo/engine';
import { DEMO_SCENARIOS } from './demo/scenarios';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Mode démo scénarisée : ?demo=<id> lance le scénario après le premier rendu.
initDemoFromUrl(DEMO_SCENARIOS);
