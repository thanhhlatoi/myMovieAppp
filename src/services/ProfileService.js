// 📄 src/services/ProfileService.js - User Profile Management Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEBUG_CONFIG } from '../config/apiConfig';

class ProfileService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.profileEndpoint = `${this.baseUrl}/user/profile`;
    }

    // Helper method to log API calls
    log(message, data = null) {
        if (DEBUG_CONFIG.ENABLE_LOGGING) {
            console.log(`[ProfileService] ${message}`, data || '');
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

    // Helper method to get current user data
    async getCurrentUserData() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Helper method to update stored user data
    async updateStoredUserData(newData) {
        try {
            const currentData = await this.getCurrentUserData();
            const updatedData = { ...currentData, ...newData };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
            return updatedData;
        } catch (error) {
            console.error('Error updating stored user data:', error);
            throw error;
        }
    }

    // Helper method for authenticated requests
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

    // ===================== PROFILE OPERATIONS =====================

    // Get current user profile
    async getCurrentProfile() {
        try {
            const url = `${this.profileEndpoint}`;
            const response = await this.makeAuthenticatedRequest(url);

            // Update stored user data with fresh info
            await this.updateStoredUserData(response);

            return this.formatUserProfile(response);
        } catch (error) {
            console.error('Error getting current profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const url = `${this.profileEndpoint}/update`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            // Update stored user data
            await this.updateStoredUserData(response);

            this.log('Profile updated successfully');
            return this.formatUserProfile(response);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const url = `${this.profileEndpoint}/change-password`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            this.log('Password changed successfully');
            return response;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    // ===================== AVATAR OPERATIONS =====================

    // Upload avatar
    async uploadAvatar(imageUri) {
        try {
            const token = await this.getAuthToken();
            const formData = new FormData();

            formData.append('avatar', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'avatar.jpg'
            });

            const url = `${this.profileEndpoint}/avatar`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload avatar');
            }

            const result = await response.json();

            // Update stored user data with new avatar
            await this.updateStoredUserData({ avatar: result.avatarUrl });

            this.log('Avatar uploaded successfully');
            return result;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    }

    // Change/Update avatar
    async changeAvatar(imageUri) {
        try {
            const token = await this.getAuthToken();
            const formData = new FormData();

            formData.append('avatar', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'avatar.jpg'
            });

            const url = `${this.profileEndpoint}/avatar`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to change avatar');
            }

            const result = await response.json();

            // Update stored user data with new avatar
            await this.updateStoredUserData({ avatar: result.avatarUrl });

            this.log('Avatar changed successfully');
            return result;
        } catch (error) {
            console.error('Error changing avatar:', error);
            throw error;
        }
    }

    // Delete avatar
    async deleteAvatar() {
        try {
            const url = `${this.profileEndpoint}/avatar`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'DELETE'
            });

            // Update stored user data to remove avatar
            await this.updateStoredUserData({ avatar: null });

            this.log('Avatar deleted successfully');
            return response;
        } catch (error) {
            console.error('Error deleting avatar:', error);
            throw error;
        }
    }

    // ===================== USER STATISTICS & ACTIVITY =====================

    // Get user viewing statistics
    async getUserStats() {
        try {
            const url = `${this.profileEndpoint}/statistics`;
            const response = await this.makeAuthenticatedRequest(url);

            return this.formatUserStats(response);
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Get user activity
    async getUserActivity(page = 0, size = 20) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.profileEndpoint}/activity?${queryParams}`;
            const response = await this.makeAuthenticatedRequest(url);

            return {
                ...response,
                content: response.content?.map(item => this.formatActivityItem(item)) || []
            };
        } catch (error) {
            console.error('Error getting user activity:', error);
            throw error;
        }
    }

    // Get user viewing history (compatibility method)
    async getViewingHistory(page = 0, size = 20) {
        // Redirect to activity for backward compatibility
        return this.getUserActivity(page, size);
    }

    // Get user reviews
    async getUserReviews(page = 0, size = 10) {
        try {
            const userData = await this.getCurrentUserData();
            if (!userData || !userData.id) {
                throw new Error('User not logged in');
            }

            const queryParams = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });

            const url = `${this.baseUrl}/api/reviews/user/${userData.id}?${queryParams}`;
            const response = await this.makeAuthenticatedRequest(url);

            return response;
        } catch (error) {
            console.error('Error getting user reviews:', error);
            throw error;
        }
    }

    // ===================== SETTINGS OPERATIONS =====================

    // Get user settings
    async getSettings() {
        try {
            const url = `${this.profileEndpoint}/settings`;
            const response = await this.makeAuthenticatedRequest(url);

            this.log('Settings retrieved successfully');
            return response;
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    // Update user settings
    async updateSettings(settings) {
        try {
            const url = `${this.profileEndpoint}/settings`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            this.log('Settings updated successfully');
            return response;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    // Update notification settings (compatibility method)
    async updateNotificationSettings(settings) {
        // Use the general settings update for notification settings
        return this.updateSettings({ notificationSettings: settings });
    }

    // ===================== ACCOUNT OPERATIONS =====================

    // Delete account
    async deleteAccount(password) {
        try {
            const userData = await this.getCurrentUserData();
            if (!userData || !userData.id) {
                throw new Error('User not logged in');
            }

            const url = `${this.baseUrl}/api/users/${userData.id}`;
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'DELETE',
                body: JSON.stringify({ password })
            });

            // Clear stored data
            await AsyncStorage.multiRemove(['authToken', 'userData']);

            this.log('Account deleted successfully');
            return response;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }

    // ===================== UTILITY METHODS =====================

    // Format user profile response
    formatUserProfile(apiResponse) {
        return {
            id: apiResponse.id,
            email: apiResponse.email,
            fullName: apiResponse.fullName || apiResponse.username,
            username: apiResponse.username,
            avatar: apiResponse.avatar,
            bio: apiResponse.bio || '',
            dateOfBirth: apiResponse.dateOfBirth,
            gender: apiResponse.gender,
            country: apiResponse.country,
            phone: apiResponse.phone,
            isVerified: apiResponse.isVerified || false,
            joinDate: apiResponse.createdAt,
            lastLogin: apiResponse.lastLogin,
            preferences: apiResponse.preferences || {},
            notificationSettings: apiResponse.notificationSettings || {}
        };
    }

    // Format user statistics
    formatUserStats(apiResponse) {
        return {
            totalMoviesWatched: apiResponse.totalMoviesWatched || 0,
            totalWatchTime: apiResponse.totalWatchTime || 0, // in minutes
            favoriteGenres: apiResponse.favoriteGenres || [],
            reviewsCount: apiResponse.reviewsCount || 0,
            avgRating: apiResponse.avgRating || 0,
            watchStreak: apiResponse.watchStreak || 0,
            joinDate: apiResponse.joinDate,
            achievements: apiResponse.achievements || []
        };
    }

    // Format activity item
    formatActivityItem(apiResponse) {
        return {
            id: apiResponse.id,
            type: apiResponse.type, // 'watch', 'review', 'like', etc.
            movieId: apiResponse.movieId,
            movieTitle: apiResponse.movieTitle,
            moviePoster: apiResponse.moviePoster,
            timestamp: apiResponse.timestamp,
            details: apiResponse.details || {},
            isCompleted: apiResponse.isCompleted || false
        };
    }

    // Format viewing history item (compatibility method)
    formatViewingHistoryItem(apiResponse) {
        return this.formatActivityItem(apiResponse);
    }

    // Get avatar URL with fallback
    getAvatarUrl(avatar, fullName = 'User') {
        if (avatar) {
            if (avatar.startsWith('http')) {
                return avatar;
            }
            return `${this.baseUrl}/api/user/profile/avatar/view?path=${avatar}`;
        }

        // Generate placeholder avatar
        const initials = fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=E50914&color=ffffff&size=200`;
    }

    // Format watch time to human readable
    formatWatchTime(minutes) {
        if (minutes < 60) {
            return `${minutes} phút`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours < 24) {
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} giờ`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        return remainingHours > 0 ? `${days} ngày ${remainingHours}h` : `${days} ngày`;
    }
}

// Export singleton instance
export default new ProfileService();
