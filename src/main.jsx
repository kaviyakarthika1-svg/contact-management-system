import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ensureSeeded } from './services/bootstrap';
import './styles/index.css';

// Initialise localStorage with demo data (or an empty start) before first render.
ensureSeeded();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
