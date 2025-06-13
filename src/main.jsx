import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Error boundary for catching rendering errors
class ErrorBoundary {
  static handleError(error) {
    console.error('React Error:', error);
    // You could render a fallback UI here if needed
    document.getElementById('root').innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>The application encountered an error. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
}

// Catch any errors that occur during rendering
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found in the DOM');
  }
  
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  ErrorBoundary.handleError(error);
}
