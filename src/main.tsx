import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/roboto';
import '@fontsource-variable/open-sans';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/eb-garamond';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/lato';
import '@fontsource/poppins';
import './index.css';
import './components/resume/resume.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
