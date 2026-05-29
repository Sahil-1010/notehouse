import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(12,12,28,0.96)',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(24px)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#06060f' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#06060f' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
