import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress only ReactQuill's specific findDOMNode deprecation warning.
// This warning originates from the react-quill library (not our code) and cannot
// be fixed without upgrading the library. We target the exact warning string
// and only suppress console.warn (where React 18 surfaces it), leaving
// console.error untouched so genuine errors are never swallowed.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

