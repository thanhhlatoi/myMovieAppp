// 📄 src/config/apiConfig.js - API Configuration
import { Platform } from 'react-native';

// Development configurations
const DEVELOPMENT_CONFIG = {
    // Updated to use the current server IP
    BASE_URL: 'http://172.20.10.7:8082/api',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Production configurations
const PRODUCTION_CONFIG = {
    BASE_URL: 'https://your-production-api.com/api', // Replace with your production API URL
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

// Staging configurations
const STAGING_CONFIG = {
    BASE_URL: 'https://your-staging-api.com/api', // Replace with your staging API URL
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
};

// Determine current environment
const getCurrentEnvironment = () => {
    // You can set this via environment variables or build configurations
    return __DEV__ ? 'development' : 'production';
};

// Get configuration based on environment
const getConfig = () => {
    const environment = getCurrentEnvironment();
    
    switch (environment) {
        case 'development':
            return DEVELOPMENT_CONFIG;
        case 'staging':
            return STAGING_CONFIG;
        case 'production':
            return PRODUCTION_CONFIG;
        default:
            return DEVELOPMENT_CONFIG;
    }
};

// Export the current configuration
export const API_CONFIG = getConfig();

// Export specific endpoints
export const ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY_EMAIL: '/auth/verify',
        RESEND_OTP: '/auth/resend-otp',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    
    // Favorites
    FAVORITES: '/favorites',
    FAVORITES_USER: (userId) => `/favorites/user/${userId}`,
    FAVORITES_TOGGLE: '/favorites/toggle',
    FAVORITES_CHECK: (userId, movieId) => `/favorites/check/${userId}/${movieId}`,
    FAVORITES_BATCH: '/favorites/batch/add',
    FAVORITES_TRENDING: '/favorites/trending',
    FAVORITES_STATS_USER: (userId) => `/favorites/stats/user/${userId}`,
    FAVORITES_STATS_MOVIE: (movieId) => `/favorites/stats/movie/${movieId}`,
    
    // Movies
    MOVIES: '/movies',
    MOVIES_SEARCH: '/movies/search',
    MOVIES_TRENDING: '/movies/trending',
    MOVIES_GENRES: '/movies/genres',
    
    // Users
    USERS: '/users',
    USER_PROFILE: (userId) => `/users/${userId}`,
    
    // Health
    HEALTH: '/health',
};

// Export utility functions
export const buildUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const buildFavoritesUrl = (path = '') => {
    return `${API_CONFIG.BASE_URL}${ENDPOINTS.FAVORITES}${path}`;
};

// Network configuration
export const NETWORK_CONFIG = {
    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    
    // Request timeout
    TIMEOUT: API_CONFIG.TIMEOUT,
    
    // Retry configuration
    RETRY_ATTEMPTS: API_CONFIG.RETRY_ATTEMPTS,
    RETRY_DELAY: API_CONFIG.RETRY_DELAY,
    
    // Cache configuration
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Error codes that should trigger a retry
    RETRYABLE_ERROR_CODES: [408, 429, 500, 502, 503, 504],
};

// Debug configuration
export const DEBUG_CONFIG = {
    ENABLE_LOGGING: __DEV__,
    ENABLE_NETWORK_LOGGING: __DEV__,
    ENABLE_ERROR_LOGGING: true,
    LOG_LEVEL: __DEV__ ? 'debug' : 'error',
};

// Feature flags
export const FEATURE_FLAGS = {
    ENABLE_OFFLINE_MODE: true,
    ENABLE_CACHE: true,
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: !__DEV__,
    ENABLE_REVIEWS: false, // Disable reviews if server doesn't have endpoints yet
    ENABLE_REVIEW_STATS: false, // Disable review stats to prevent timeout errors
};

export default {
    API_CONFIG,
    ENDPOINTS,
    NETWORK_CONFIG,
    DEBUG_CONFIG,
    FEATURE_FLAGS,
    buildUrl,
    buildFavoritesUrl,
}; 