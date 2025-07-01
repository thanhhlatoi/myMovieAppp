// 📄 src/services/ProfileService.js - User Profile Management Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEBUG_CONFIG } from '../config/apiConfig';
import { AuthService } from './AuthService';

class ProfileService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.profileEndpoint = `${this.baseUrl}/profile`;
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
            this.log('Getting current profile from:', url);
            
            const response = await this.makeAuthenticatedRequest(url);
            this.log('Profile response received:', response);

            // Extract actual user data from ResponseBuilder format
            const userData = response.body || response.data || response;
            
            // Update stored user data with fresh info
            await this.updateStoredUserData(userData);

            return this.formatUserProfile(userData);
        } catch (error) {
            console.error('Error getting current profile:', error);
            
            // Fallback to cached data if API fails
            const cachedData = await this.getCurrentUserData();
            if (cachedData) {
                this.log('Using cached profile data');
                return this.formatUserProfile(cachedData);
            }
            
            throw error;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            console.log('📤 Profile update data:', profileData);

            // Use JSON endpoint instead of FormData
            const jsonData = {
                firstName: '',
                lastName: '',
                phoneNumber: profileData.phone || '',
                dateOfBirth: null,
                address: profileData.country || '',
                gender: false
            };

            // Map frontend fields to backend fields
            if (profileData.fullName) {
                const nameParts = profileData.fullName.trim().split(' ');
                jsonData.firstName = nameParts[0] || '';
                jsonData.lastName = nameParts.slice(1).join(' ') || '';
            }

            if (profileData.dateOfBirth) {
                const date = new Date(profileData.dateOfBirth);
                jsonData.dateOfBirth = date.toISOString().split('T')[0];
            }

            if (profileData.gender !== undefined && profileData.gender !== '') {
                jsonData.gender = profileData.gender === 'Nam';
            }

            console.log('📤 Sending JSON data:', jsonData);

            const url = `${API_CONFIG.BASE_URL}/user/profile/update-json`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Backend error response:', response.status, errorData);
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Cập nhật thất bại`);
            }

            const result = await response.json();
            
            // Handle ResponseBuilder format
            let profileResult = result;
            if (result.code === 200 && result.result) {
                profileResult = result.result;
            }

            // Update stored user data
            await this.updateStoredUserData(profileResult);

            this.log('Profile updated successfully');
            return this.formatUserProfile(profileResult);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            const url = `${API_CONFIG.BASE_URL}/user/profile/change-password`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword: newPassword
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Đổi mật khẩu thất bại');
            }

            const result = await response.json();

            this.log('Password changed successfully');
            return result;
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
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            const formData = new FormData();
            formData.append('avatar', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'avatar.jpg'
            });

            const url = `${API_CONFIG.BASE_URL}/user/profile/avatar`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type for FormData
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload avatar');
            }

            const result = await response.json();

            // Handle ResponseBuilder format
            let avatarResult = result;
            if (result.code === 200 && result.result) {
                avatarResult = result.result;
            }

            // Update stored user data with new avatar
            await this.updateStoredUserData({ profilePictureUrl: avatarResult.avatarUrl });

            this.log('Avatar uploaded successfully');
            return avatarResult;
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
    // async getUserStats() {
    //     try {
    //         // Get current user data
    //         const userData = await this.getCurrentUserData();
    //         if (!userData || !userData.id) {
    //             throw new Error('User not logged in');
    //         }

    //         // Use the user-specific endpoint for statistics
    //         const url = `${this.baseUrl}/user/statistics/${userData.id}`;
            
    //         this.log('Getting user stats from:', url);
            
    //         const response = await this.makeAuthenticatedRequest(url);
    //         this.log('Stats response:', response);

    //         // If no data, return default stats
    //         if (!response || !response.body) {
    //             return {
    //                 totalMoviesWatched: 0,
    //                 totalWatchTime: 0,
    //                 favoriteGenres: [],
    //                 reviewsCount: 0,
    //                 avgRating: 0,
    //                 watchStreak: 0
    //             };
    //         }

    //         return this.formatUserStats(response);
    //     } catch (error) {
    //         console.error('Error getting user stats:', error);
    //         // Return default stats instead of throwing error
    //         return {
    //             totalMoviesWatched: 0,
    //             totalWatchTime: 0,
    //             favoriteGenres: [],
    //             reviewsCount: 0,
    //             avgRating: 0,
    //             watchStreak: 0
    //         };
    //     }
    // }

    // Get user activity
    // async getUserActivity(page = 0, size = 20) {
    //     try {
    //         const queryParams = new URLSearchParams({
    //             page: page.toString(),
    //             size: size.toString()
    //         });

    //         const url = `${this.profileEndpoint}/activity?${queryParams}`;
    //         const response = await this.makeAuthenticatedRequest(url);

    //         return {
    //             ...response,
    //             content: response.content?.map(item => this.formatActivityItem(item)) || []
    //         };
    //     } catch (error) {
    //         console.error('Error getting user activity:', error);
    //         throw error;
    //     }
    // }

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
        // Handle different response formats
        const data = apiResponse.body || apiResponse.data || apiResponse;
        
        // Format date of birth
        let formattedDateOfBirth = null;
        if (data.dateOfBirth) {
            try {
                formattedDateOfBirth = new Date(data.dateOfBirth).toISOString();
            } catch (e) {
                console.error('Error formatting date of birth:', e);
            }
        }

        // Format join date
        let formattedJoinDate = null;
        if (data.createdAt || data.joinDate) {
            try {
                formattedJoinDate = new Date(data.createdAt || data.joinDate).toISOString();
            } catch (e) {
                console.error('Error formatting join date:', e);
            }
        }

        // Construct full name
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || data.fullName || data.username || data.name || 'User';
        
        return {
            id: data.id,
            email: data.email,
            name: fullName,
            fullName: fullName,
            username: data.username || data.email,
            avatar: data.profilePictureUrl || data.avatar,
            bio: data.bio || '',
            dateOfBirth: formattedDateOfBirth,
            gender: data.gender === true ? 'Nam' : (data.gender === false ? 'Nữ' : 'Chưa cập nhật'),
            country: data.address || data.country || 'Chưa cập nhật',
            phone: data.phoneNumber || data.phone || 'Chưa cập nhật',
            isVerified: data.verified || data.isVerified || false,
            joinDate: formattedJoinDate || new Date().toISOString(),
            lastLogin: data.lastLogin,
            preferences: data.preferences || {},
            notificationSettings: data.notificationSettings || {},
            firstName: firstName,
            lastName: lastName,
            active: data.active || true,
            coverImage: data.coverImage || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
            // Backend serves files through MinIO, usually already has full URL
            return `${API_CONFIG.BASE_URL}/files/avatar/${avatar}`;
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
