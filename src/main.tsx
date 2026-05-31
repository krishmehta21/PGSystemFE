import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Listen for Vite's chunk load errors (happens when deploying new versions) and force a refresh
window.addEventListener('vite:preloadError', () => {
  console.log('Vite preload error (missing chunk), reloading page...');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
