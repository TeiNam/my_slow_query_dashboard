interface ApiConfig {
    baseUrl: string;
}

let config: ApiConfig | null = null;

export async function initializeApiConfig(): Promise<void> {
    if (config) return;

    // import.meta.env를 사용하여 환경변수 접근
    config = {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    };
}

export function getApiConfig(): ApiConfig {
    if (!config) {
        throw new Error('API configuration is not initialized');
    }
    return config;
}