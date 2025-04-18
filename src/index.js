import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter';
import { initializeLogging } from './utils/loggingConfig';
import suppressWarnings from './utils/suppressWarnings';

// Initialize logging configuration
initializeLogging();

// Suppress React warnings and other noisy logs
suppressWarnings();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);