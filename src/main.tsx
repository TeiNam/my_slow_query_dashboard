import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApiConfig } from './config/api';

async function initialize() {
    try {
        console.log("🔄 Initializing API config...");
        await initializeApiConfig();
        console.log("✅ API config initialized successfully");

        const rootElement = document.getElementById('root');
        if (!rootElement) {
            console.error("❌ Root element not found");
            return;
        }

        createRoot(rootElement).render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    } catch (error) {
        console.error('🔥 Firefox load failed:', error);
    }
}

initialize();