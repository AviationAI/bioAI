import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ClerkProvider } from '@clerk/clerk-react';
import { StrictMode } from 'react';

const PUBLISHABLE_KEY = "pk_test_dG91Y2hpbmcta29hbGEtMC5jbGVyay5hY2NvdW50cy5kZXYk";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
    </ClerkProvider>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
