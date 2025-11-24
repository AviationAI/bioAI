import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = "pk_test_dG91Y2hpbmcta29hbGEtMC5jbGVyay5hY2NvdW50cy5kZXYk";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
    </ClerkProvider>
  </StrictMode>,
)
