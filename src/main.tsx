import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { LeadsProvider } from './contexts/LeadsContext';
import { ScraperProvider } from './contexts/ScraperContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <LeadsProvider>
            <ScraperProvider>
              <App />
            </ScraperProvider>
          </LeadsProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);