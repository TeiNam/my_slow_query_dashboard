import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApiConfig } from './config/api';

async function initialize() {
    try {
        await initializeApiConfig();

        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

initialize();