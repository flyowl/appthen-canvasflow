import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver errors which are common with React Flow and Resizable nodes
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications';
const resizeObserverLoopLimitErr = 'ResizeObserver loop limit exceeded';

// Helper to check if the error is one we want to ignore
const isResizeObserverError = (msg: string) => {
  return msg.includes(resizeObserverLoopErr) || msg.includes(resizeObserverLoopLimitErr);
}

const originalError = console.error;
console.error = (...args) => {
  if (args.some((arg) => typeof arg === 'string' && isResizeObserverError(arg))) {
    return;
  }
  originalError(...args);
};

window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (isResizeObserverError(msg)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Robust handler for the error overlay using the older window.onerror API
// This is often required to suppress the error overlay in development environments
const originalOnError = window.onerror;
window.onerror = function(msg, url, lineNo, columnNo, error) {
  if (typeof msg === 'string' && isResizeObserverError(msg)) {
    return true; // Return true to suppress the error completely
  }
  if (originalOnError) {
    return originalOnError(msg, url, lineNo, columnNo, error);
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);