// 📄 src/services/ReviewService.js - Comprehensive Review API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS, buildUrl, DEBUG_CONFIG } from '../config/apiConfig';

class ReviewService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.reviewsEndpoint = `${this.baseUrl}/reviews`;
    }

    // Helper method to log API calls
    log(message, data = null) {
        if (DEBUG_CONFIG.ENABLE_LOGGING) {
            console.log(`[ReviewService] ${message}`, data || '');
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
                return user.id || user.userId;
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
            this.log(`Making request to: ${url}`, requestOptions);
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

    // Create a new review
    async createReview(reviewData) {
        try {
            const userId = await this.getCurrentUserId();
            const requestBody = {
                userId,
                movieProductId: reviewData.movieId,
                rating: reviewData.rating,
                comment: reviewData.comment,
                ...reviewData
            };

            this.log('Creating review', requestBody);
            return await this.makeAuthenticatedRequest(this.reviewsEndpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    // Get review by ID
    async getReviewById(reviewId) {
        try {
            const url = `${this.reviewsEndpoint}/${reviewId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting review by ID:', error);
            throw error;
        }
    }

    // Update review
    async updateReview(reviewId, reviewData) {
        try {
            const url = `${this.reviewsEndpoint}/${reviewId}`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'PUT',
                body: JSON.stringify(reviewData)
            });
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    // Delete review
    async deleteReview(reviewId) {
        try {
            const url = `${this.reviewsEndpoint}/${reviewId}`;
            return await this.makeAuthenticatedRequest(url, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    // Get all reviews (admin only)
    async getAllReviews(page = 0, size = 10, sortBy = ['id'], sortDir = 'desc') {
        try {
            const sortByParam = Array.isArray(sortBy) ? sortBy.join(',') : sortBy;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: sortByParam,
                sortDir: sortDir
            });

            const url = `${this.reviewsEndpoint}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting all reviews:', error);
            throw error;
        }
    }

    // ===================== MOVIE REVIEW OPERATIONS =====================

    // Get reviews for a specific movie
    async getMovieReviews(movieId, page = 0, size = 10, sortBy = ['createdAt'], sortDir = 'desc') {
        try {
            const sortByParam = Array.isArray(sortBy) ? sortBy.join(',') : sortBy;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: sortByParam,
                sortDir: sortDir
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting movie reviews:', error);
            throw error;
        }
    }

    // Get recent reviews for a movie
    async getRecentMovieReviews(movieId, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/recent?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting recent movie reviews:', error);
            throw error;
        }
    }

    // Get reviews by specific rating
    async getReviewsByRating(movieId, rating, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/rating/${rating}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting reviews by rating:', error);
            throw error;
        }
    }

    // Get reviews by rating range
    async getReviewsByRatingRange(movieId, minRating, maxRating, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                minRating: minRating.toString(),
                maxRating: maxRating.toString(),
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/rating-range?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting reviews by rating range:', error);
            throw error;
        }
    }

    // Get high rated reviews
    async getHighRatedReviews(movieId, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/high-rated?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting high rated reviews:', error);
            throw error;
        }
    }

    // Get low rated reviews
    async getLowRatedReviews(movieId, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/low-rated?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting low rated reviews:', error);
            throw error;
        }
    }

    // Get reviews with comments
    async getReviewsWithComments(movieId, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/with-comments?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting reviews with comments:', error);
            throw error;
        }
    }

    // Search reviews
    async searchReviews(movieId, keyword, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                keyword: keyword,
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/movie/${movieId}/search?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error searching reviews:', error);
            throw error;
        }
    }

    // ===================== USER REVIEW OPERATIONS =====================

    // Get user's reviews
    async getUserReviews(userId = null, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy: sortBy,
                sortDir: sortDir
            });

            const url = `${this.reviewsEndpoint}/user/${targetUserId}?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting user reviews:', error);
            throw error;
        }
    }

    // Get user's review for specific movie
    async getUserReviewForMovie(userId = null, movieId) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.reviewsEndpoint}/user/${targetUserId}/movie/${movieId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting user review for movie:', error);
            throw error;
        }
    }

    // Check if user can review movie
    async canUserReviewMovie(userId = null, movieId) {
        try {
            const targetUserId = userId || await this.getCurrentUserId();
            if (!targetUserId) {
                throw new Error('User ID not found');
            }

            const url = `${this.reviewsEndpoint}/check/${targetUserId}/${movieId}`;
            const response = await this.makeAuthenticatedRequest(url);
            return response.canReview;
        } catch (error) {
            console.error('Error checking if user can review:', error);
            throw error;
        }
    }

    // ===================== STATISTICS OPERATIONS =====================

    // Get movie review statistics
    async getMovieReviewStats(movieId) {
        try {
            const url = `${this.reviewsEndpoint}/stats/movie/${movieId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting movie review stats:', error);
            throw error;
        }
    }

    // Get rating distribution
    async getRatingDistribution(movieId) {
        try {
            const url = `${this.reviewsEndpoint}/rating-distribution/${movieId}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting rating distribution:', error);
            throw error;
        }
    }

    // Get top rated movies
    async getTopRatedMovies(minReviewCount = 5, page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                minReviewCount: minReviewCount.toString(),
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/trending/top-rated?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting top rated movies:', error);
            throw error;
        }
    }

    // Get most reviewed movies
    async getMostReviewedMovies(page = 0, size = 10) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.reviewsEndpoint}/trending/most-reviewed?${queryParams}`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Error getting most reviewed movies:', error);
            throw error;
        }
    }

    // ===================== UTILITY METHODS =====================

    // Format review data for display
    async formatReviewResponse(apiResponse) {
        const currentUserId = await this.getCurrentUserId();
        return {
            id: apiResponse.id,
            userId: apiResponse.userId,
            userName: apiResponse.userName || 'Người dùng ẩn danh',
            userAvatar: apiResponse.userAvatar,
            movieId: apiResponse.movieProductId,
            movieTitle: apiResponse.movieTitle,
            rating: apiResponse.rating,
            comment: apiResponse.comment,
            createdAt: apiResponse.createdAt,
            updatedAt: apiResponse.updatedAt,
            isEdited: apiResponse.updatedAt !== apiResponse.createdAt,
            // Additional calculated fields
            isCurrentUser: currentUserId && apiResponse.userId === currentUserId,
            timeAgo: this.getTimeAgo(apiResponse.createdAt),
            likes: apiResponse.likes || 0
        };
    }

    // Calculate time ago
    getTimeAgo(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.ceil(diffTime / (1000 * 60));

            if (diffMinutes < 60) return `${diffMinutes} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            if (diffDays === 1) return 'Hôm qua';
            if (diffDays <= 7) return `${diffDays} ngày trước`;
            if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} tuần trước`;
            return `${Math.ceil(diffDays / 30)} tháng trước`;
        } catch {
            return 'Không xác định';
        }
    }

    // Health check
    async healthCheck() {
        try {
            const url = `${this.reviewsEndpoint}/health`;
            return await this.makeAuthenticatedRequest(url);
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new ReviewService();
