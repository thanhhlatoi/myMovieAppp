// 📄 src/services/FavoriteService.js - API Service for Favorites
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS, buildUrl, buildFavoritesUrl, NETWORK_CONFIG, DEBUG_CONFIG } from '../config/apiConfig';

class FavoriteService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.favoritesEndpoint = buildUrl(ENDPOINTS.FAVORITES);
    }

    // Helper method to log API calls (only in development)
    log(message, data = null) {
        if (DEBUG_CONFIG.ENABLE_LOGGING) {
            console.log(`[FavoriteService] ${message}`, data || '');
        }
    }

    // Helper method to get authentication token
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    // Helper method to get current user ID
    async getCurrentUserId() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                return user.id;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }

    // Helper method to make authenticated requests
    async makeAuthenticatedRequest(url, options = {}) {
        const token = await this.getAuthToken();
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const requestOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // ===================== BASIC CRUD OPERATIONS =====================

    // Get user's favorites
    async getUserFavorites(userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.favoritesEndpoint}/user/${targetUserId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error fetching user favorites:', error);
            throw error;
        }
    }

    // Get user's favorites with pagination
    async getUserFavoritesPaginated(userId = null, page = 0, size = 10, sortBy = ['id'], sortDir = 'desc') {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const sortByParam = Array.isArray(sortBy) ? sortBy.join(',') : sortBy;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: sortByParam,
                sortDir: sortDir
            });

            const url = `${this.favoritesEndpoint}/user/${targetUserId}/paginated?${queryParams}`;
            const response = await this.makeAuthenticatedRequest(url);
            
            // Return the content array from the paginated response
            return response.content || [];
        } catch (error) {
            console.error('Error fetching paginated favorites:', error);
            throw error;
        }
    }

    // Add movie to favorites
    async addToFavorites(movieProductId, userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const requestBody = {
                userId: targetUserId,
                movieProductId: movieProductId
            };

            return await this.makeAuthenticatedRequest(this.favoritesEndpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });
        } catch (error) {
            console.error('Error adding to favorites:', error);
            throw error;
        }
    }

    // Remove favorite by ID
    async removeFavorite(favoriteId) {
        try {
            const url = `${this.favoritesEndpoint}/${favoriteId}`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    // Remove favorite by user and movie
    async removeFavoriteByUserAndMovie(movieId, userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.favoritesEndpoint}/user/${targetUserId}/movie/${movieId}`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing favorite by user and movie:', error);
            throw error;
        }
    }

    // ===================== TOGGLE & CHECK OPERATIONS =====================

    // Toggle favorite status
    async toggleFavorite(movieProductId, userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const requestBody = {
                userId: targetUserId,
                movieProductId: movieProductId
            };

            const url = `${this.favoritesEndpoint}/toggle`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    // Check if movie is favorite
    async checkIsFavorite(movieId, userId = null) {
        try {
            // Try to get current user ID
            const targetUserId = userId || await this.getCurrentUserId();
            
            // If no user ID, try to fix user data
            if (!targetUserId) {
                const AuthService = require('./AuthService').default;
                const fixedUserData = await AuthService.fixUserData();
                if (fixedUserData && fixedUserData.id) {
                    return this.checkIsFavorite(movieId, fixedUserData.id);
                }
                // If still no user ID, return false instead of throwing error
                return false;
            }

            const url = `${this.favoritesEndpoint}/check/${targetUserId}/${movieId}`;
            try {
                const response = await this.makeAuthenticatedRequest(url);
                return response.isFavorite;
            } catch (apiError) {
                console.log('API error checking favorite:', apiError);
                // If API call fails, return false instead of throwing error
                return false;
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
            // Return false instead of throwing error
            return false;
        }
    }

    // ===================== BATCH OPERATIONS =====================

    // Add multiple movies to favorites
    async addMultipleFavorites(movieIds, userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const queryParams = new URLSearchParams({
                userId: targetUserId.toString()
            });

            const url = `${this.favoritesEndpoint}/batch/add?${queryParams}`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify(movieIds)
            });
        } catch (error) {
            console.error('Error adding multiple favorites:', error);
            throw error;
        }
    }

    // Remove all user favorites
    async removeAllUserFavorites(userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.favoritesEndpoint}/user/${targetUserId}/all`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing all user favorites:', error);
            throw error;
        }
    }

    // ===================== STATISTICS & ANALYTICS =====================

    // Get movie favorite stats
    async getMovieFavoriteStats(movieId) {
        try {
            const url = `${this.favoritesEndpoint}/stats/movie/${movieId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting movie favorite stats:', error);
            throw error;
        }
    }

    // Get user favorite stats
    async getUserFavoriteStats(userId = null) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.favoritesEndpoint}/stats/user/${targetUserId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting user favorite stats:', error);
            throw error;
        }
    }

    // Get trending/most favorited movies
    async getMostFavoritedMovies(limit = 10) {
        try {
            const queryParams = new URLSearchParams({
                limit: limit.toString()
            });

            const url = `${this.favoritesEndpoint}/trending?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting most favorited movies:', error);
            throw error;
        }
    }

    // ===================== SEARCH & FILTER OPERATIONS =====================

    // Search favorites with filters
    async searchFavorites(filters = {}) {
        try {
            const {
                userId,
                movieId,
                genreId,
                categoryId,
                year,
                page = 0,
                size = 10,
                sortBy = ['id'],
                sortDir = 'desc'
            } = filters;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: Array.isArray(sortBy) ? sortBy.join(',') : sortBy,
                sortDir: sortDir
            });

            // Add optional filters
            if (userId) queryParams.append('userId', userId.toString());
            if (movieId) queryParams.append('movieId', movieId.toString());
            if (genreId) queryParams.append('genreId', genreId.toString());
            if (categoryId) queryParams.append('categoryId', categoryId.toString());
            if (year) queryParams.append('year', year);

            const url = `${this.favoritesEndpoint}/search?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error searching favorites:', error);
            throw error;
        }
    }

    // ===================== RECOMMENDATIONS =====================

    // Get recommendations based on user favorites
    async getRecommendations(userId = null, limit = 10) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const queryParams = new URLSearchParams({
                limit: limit.toString()
            });

            const url = `${this.favoritesEndpoint}/recommendations/${targetUserId}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    // ===================== EXPORT OPERATIONS =====================

    // Export user favorites
    async exportUserFavorites(userId = null, format = 'json') {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const queryParams = new URLSearchParams({
                format: format
            });

            const url = `${this.favoritesEndpoint}/export/user/${targetUserId}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error exporting user favorites:', error);
            throw error;
        }
    }

    // ===================== UTILITY METHODS =====================

    // Transform API response to match current app data structure
    transformFavoriteResponse(apiResponse) {
        // Handle the new API response structure
        const imageUrl = apiResponse.movieImageUrl
            ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${apiResponse.movieImageUrl}`
            : 'https://via.placeholder.com/400x600/333/FFF?text=No+Image';

        return {
            id: apiResponse.movieProductId || apiResponse.id,
            title: apiResponse.movieTitle || 'Unknown Title',
            year: apiResponse.movieYear?.toString() || '2024',
            rating: 8.5, // Default rating since not provided in API
            duration: 120, // Default duration since not provided in API
            genre: 'Phim', // Default genre since not provided in API
            addedDate: apiResponse.createdAt || new Date().toISOString(),
            poster: imageUrl,
            backdrop: imageUrl, // Using same image for backdrop
            description: apiResponse.movieDescription || 'Chưa có mô tả cho bộ phim này.',
            isNew: this.isNewMovie(apiResponse.movieYear),
            isHD: true, // Default to HD
            progress: 0, // Default progress
            maturityRating: 'PG-13', // Default rating
            category: 'Phim lẻ', // Default category
            // Additional favorite-specific data
            favoriteId: apiResponse.id,
            userId: apiResponse.userId,
            note: apiResponse.note,
            priority: apiResponse.priority,
            updatedAt: apiResponse.updatedAt
        };
    }

    // Helper to determine if movie is new (released within last 2 years)
    isNewMovie(releaseYear) {
        if (!releaseYear) return false;
        const currentYear = new Date().getFullYear();
        return (currentYear - parseInt(releaseYear)) <= 2;
    }

    // Helper to map backend categories to frontend categories
    mapCategory(backendCategory) {
        const categoryMap = {
            'MOVIE': 'Phim lẻ',
            'TV_SERIES': 'Phim bộ',
            'ANIMATION': 'Hoạt hình',
            'DOCUMENTARY': 'Tài liệu'
        };
        return categoryMap[backendCategory] || 'Phim lẻ';
    }

    // Health check
    async healthCheck() {
        try {
            const url = `${this.favoritesEndpoint}/health`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new FavoriteService(); 