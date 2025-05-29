import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Thêm import này
import { API_CONFIG, ENDPOINTS, buildUrl, DEBUG_CONFIG } from '../config/apiConfig';

class AuthService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.authEndpoint = buildUrl(ENDPOINTS.AUTH);
    }

    // Helper method to log auth operations (only in development)
    log(message, data = null) {
        if (DEBUG_CONFIG.ENABLE_LOGGING) {
            console.log(`[AuthService] ${message}`, data || '');
        }
    }

    // Helper method to make authenticated requests
    async makeRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        const requestOptions = {
            timeout: 30000, // 30 second timeout
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            this.log(`Making request to: ${url}`);
            this.log('Request options:', {
                method: requestOptions.method,
                headers: requestOptions.headers,
                bodyType: typeof requestOptions.body,
                bodyLength: requestOptions.body ? requestOptions.body.length : 0
            });
            
            const response = await fetch(url, requestOptions);
            
            this.log('Response status:', response.status);
            this.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                }
                
                this.log('Error response data:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const jsonResponse = await response.json();
                this.log('Response data:', jsonResponse);
                return jsonResponse;
            }
            
            return response;
        } catch (error) {
            this.log('Request Error:', {
                message: error.message,
                name: error.name,
                url: url,
                method: requestOptions.method
            });
            throw error;
        }
    }

    // ===================== TOKEN MANAGEMENT =====================

    // Get stored auth token
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('authToken');
            this.log('Retrieved auth token:', token ? 'Token exists' : 'No token found');
            return token;
        } catch (error) {
            this.log('Error getting auth token:', error);
            return null;
        }
    }

    // Store auth token
    async setAuthToken(token) {
        try {
            await AsyncStorage.setItem('authToken', token);
            this.log('Auth token stored successfully');
        } catch (error) {
            this.log('Error storing auth token:', error);
            throw error;
        }
    }

    // Remove auth token
    async removeAuthToken() {
        try {
            await AsyncStorage.removeItem('authToken');
            this.log('Auth token removed');
        } catch (error) {
            this.log('Error removing auth token:', error);
            throw error;
        }
    }

    // ===================== USER DATA MANAGEMENT =====================

    // Get stored user data
    async getUserData() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                this.log('Retrieved user data:', { id: user.id, email: user.email });
                return user;
            }
            this.log('No user data found');
            return null;
        } catch (error) {
            this.log('Error getting user data:', error);
            return null;
        }
    }

    // Store user data
    async setUserData(userData) {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            this.log('User data stored successfully:', { id: userData.id, email: userData.email });
        } catch (error) {
            this.log('Error storing user data:', error);
            throw error;
        }
    }

    // Remove user data
    async removeUserData() {
        try {
            await AsyncStorage.removeItem('userData');
            this.log('User data removed');
        } catch (error) {
            this.log('Error removing user data:', error);
            throw error;
        }
    }

    // ===================== AUTHENTICATION OPERATIONS =====================

    // Login user - Updated to handle both formats
    async login(emailOrCredentials, passwordParam = null) {
        try {
            let credentials;
            
            // Handle both old format (email, password) and new format ({email, password})
            if (typeof emailOrCredentials === 'string' && passwordParam) {
                // Old format: login(email, password)
                credentials = {
                    email: emailOrCredentials,
                    password: passwordParam
                };
            } else if (typeof emailOrCredentials === 'object') {
                // New format: login({email, password})
                credentials = emailOrCredentials;
            } else {
                throw new Error('Invalid login parameters');
            }

            // Validate credentials
            if (!credentials.email || !credentials.password) {
                throw new Error('Email và password là bắt buộc');
            }

            this.log('Attempting login:', { email: credentials.email });

            // Construct URL properly
            const url = buildUrl(ENDPOINTS.AUTH.LOGIN);
            this.log('Login URL:', url);
            this.log('Login credentials:', { email: credentials.email, passwordLength: credentials.password.length });

            const requestBody = JSON.stringify(credentials);
            this.log('Request body:', requestBody);

            const response = await this.makeRequest(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: requestBody
            });

            this.log('Login response received:', response);

            // Handle the actual response format from server
            let authData = response;
            if (response.authentication) {
                // Server returns data nested under 'authentication' key
                authData = response.authentication;
            }

            if (authData.token && authData.user) {
                // Store auth data
                await this.setAuthToken(authData.token);
                await this.setUserData(authData.user);
                
                // Store refresh token if available
                if (authData.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', authData.refreshToken);
                }
                
                this.log('Login successful:', { 
                    userId: authData.user.id, 
                    email: authData.user.email,
                    fullName: authData.user.fullName,
                    tokenType: authData.tokenType,
                    expiresIn: authData.expiresIn
                });
                
                return {
                    success: true,
                    user: authData.user,
                    token: authData.token,
                    refreshToken: authData.refreshToken,
                    tokenType: authData.tokenType,
                    expiresIn: authData.expiresIn
                };
            } else {
                this.log('Response structure:', {
                    hasAuthentication: !!response.authentication,
                    hasToken: !!(authData && authData.token),
                    hasUser: !!(authData && authData.user),
                    responseKeys: Object.keys(response)
                });
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            this.log('Login error:', error);
            throw error;
        }
    }

    // Register user
    async register(userData) {
        try {
            this.log('Attempting registration:', { email: userData.email });

            const url = `${this.baseUrl}${ENDPOINTS.AUTH.REGISTER}`;
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.token && response.user) {
                // Store auth data
                await this.setAuthToken(response.token);
                await this.setUserData(response.user);
                
                this.log('Registration successful:', { 
                    userId: response.user.id, 
                    email: response.user.email 
                });
                
                return {
                    success: true,
                    user: response.user,
                    token: response.token
                };
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            this.log('Registration error:', error);
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            this.log('Attempting logout...');

            const token = await this.getAuthToken();
            
            if (token) {
                try {
                    // Try to notify server about logout
                    const url = `${this.baseUrl}${ENDPOINTS.AUTH.LOGOUT}`;
                    await this.makeRequest(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    this.log('Server logout successful');
                } catch (error) {
                    // If server logout fails, still proceed with local logout
                    this.log('Server logout failed, proceeding with local logout:', error.message);
                }
            }

            // Clear local storage
            await this.removeAuthToken();
            await this.removeUserData();

            // Clear any cached data
            await this.clearCachedData();

            this.log('Logout completed successfully');
            
            return {
                success: true,
                message: 'Đăng xuất thành công'
            };
        } catch (error) {
            this.log('Logout error:', error);
            
            // Even if there's an error, try to clear local data
            try {
                await this.removeAuthToken();
                await this.removeUserData();
                await this.clearCachedData();
            } catch (cleanupError) {
                this.log('Cleanup error during logout:', cleanupError);
            }
            
            // Still return success for logout since local cleanup is done
            return {
                success: true,
                message: 'Đăng xuất thành công',
                warning: 'Một số dữ liệu có thể chưa được xóa hoàn toàn'
            };
        }
    }

    // ===================== SESSION MANAGEMENT =====================

    // Check if user is authenticated
    async isAuthenticated() {
        try {
            const token = await this.getAuthToken();
            const userData = await this.getUserData();
            
            const isAuth = !!(token && userData);
            this.log('Authentication check:', isAuth ? 'Authenticated' : 'Not authenticated');
            
            return isAuth;
        } catch (error) {
            this.log('Authentication check error:', error);
            return false;
        }
    }

    // Refresh auth token
    async refreshToken() {
        try {
            this.log('Attempting token refresh...');

            const currentToken = await this.getAuthToken();
            if (!currentToken) {
                throw new Error('No token to refresh');
            }

            const url = `${this.baseUrl}${ENDPOINTS.AUTH.REFRESH}`;
            const response = await this.makeRequest(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (response.token) {
                await this.setAuthToken(response.token);
                this.log('Token refresh successful');
                return response.token;
            } else {
                throw new Error('Invalid refresh response');
            }
        } catch (error) {
            this.log('Token refresh error:', error);
            // If refresh fails, user needs to login again
            await this.logout();
            throw error;
        }
    }

    // ===================== UTILITY METHODS =====================

    // Clear all cached data
    async clearCachedData() {
        try {
            // Remove other cached data that might contain user-specific info
            const keysToRemove = [
                'cachedFavorites',
                'cachedMovies',
                'userPreferences',
                'watchHistory',
                'searchHistory',
                'refreshToken'
            ];

            await Promise.all(
                keysToRemove.map(key => AsyncStorage.removeItem(key).catch(() => {}))
            );

            this.log('Cached data cleared');
        } catch (error) {
            this.log('Error clearing cached data:', error);
        }
    }

    // Get current user ID
    async getCurrentUserId() {
        try {
            const userData = await this.getUserData();
            return userData?.id || null;
        } catch (error) {
            this.log('Error getting current user ID:', error);
            return null;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            this.log('Updating profile...');

            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const currentUser = await this.getUserData();
            if (!currentUser) {
                throw new Error('No user data found');
            }

            const url = `${this.baseUrl}/users/${currentUser.id}`;
            const response = await this.makeRequest(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            if (response.user) {
                await this.setUserData(response.user);
                this.log('Profile updated successfully');
                return response.user;
            }

            throw new Error('Invalid profile update response');
        } catch (error) {
            this.log('Profile update error:', error);
            throw error;
        }
    }

    // Validate token with server
    async validateToken() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                return false;
            }

            // This would be a server endpoint to validate token
            const url = `${this.baseUrl}/auth/validate`;
            await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            this.log('Token validation successful');
            return true;
        } catch (error) {
            this.log('Token validation failed:', error);
            return false;
        }
    }

    // ===================== LEGACY METHODS FOR BACKWARD COMPATIBILITY =====================

    // Legacy method for getting token (backward compatibility)
    async getToken() {
        return await this.getAuthToken();
    }

    // Legacy method for saving tokens (backward compatibility)
    async saveTokens(token, refreshToken = null) {
        try {
            await this.setAuthToken(token);
            if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
            }
            this.log('Tokens saved successfully');
        } catch (error) {
            this.log('Error saving tokens:', error);
            throw error;
        }
    }

    // Legacy method for saving user info (backward compatibility)
    async saveUserInfo(userInfo) {
        return await this.setUserData(userInfo);
    }

    // Legacy method for removing token (backward compatibility)
    async removeToken() {
        return await this.removeAuthToken();
    }

    // Check if token is valid (basic validation)
    isTokenValid(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        try {
            // Basic JWT format check (header.payload.signature)
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // Try to decode and check expiration
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            return payload.exp && payload.exp > currentTime;
        } catch (error) {
            this.log('Token validation error:', error);
            return false;
        }
    }

    // Test server connection
    async testConnection() {
        try {
            this.log('Testing server connection...');
            
            const url = `${this.baseUrl}/health`;
            const response = await fetch(url, {
                method: 'GET',
                timeout: 5000
            });
            
            const isConnected = response.ok;
            this.log('Server connection test:', isConnected ? 'Success' : 'Failed');
            
            return isConnected;
        } catch (error) {
            this.log('Server connection test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export default new AuthService();