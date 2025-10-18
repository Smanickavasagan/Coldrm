import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App';
import Alert from './components/Alert';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Alert />
    <SpeedInsights />
  </React.StrictMode>
);