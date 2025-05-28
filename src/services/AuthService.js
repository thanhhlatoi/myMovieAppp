import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Thêm import này

const API_URL = 'http://192.168.1.73:8082/api/auth/login';

const AuthService = {
    login: async (email, password) => {
        try {
            console.log('=== DEBUG LOGIN ===');
            console.log('API URL:', API_URL);
            console.log('Email:', email);
            console.log('Password length:', password?.length);

            const requestBody = { email, password };
            console.log('Request body:', JSON.stringify(requestBody));

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Login failed'}`);
            }

            const responseData = await response.json();
            console.log('Success response:', responseData);

            // Kiểm tra token theo cấu trúc thực tế từ server
            let token = null;
            let refreshToken = null;
            let user = null;

            // Cấu trúc: { authentication: { token, refreshToken, user } }
            if (responseData.authentication) {
                token = responseData.authentication.token;
                refreshToken = responseData.authentication.refreshToken;
                user = responseData.authentication.user;
                console.log('Token found in authentication object');
            }
            // Fallback: kiểm tra các field khác có thể có
            else {
                const possibleTokenFields = ['token', 'accessToken', 'access_token', 'authToken', 'jwt'];
                for (const field of possibleTokenFields) {
                    if (responseData[field]) {
                        token = responseData[field];
                        console.log(`Token found in field: ${field}`);
                        break;
                    }
                }
            }

            if (!token) {
                console.log('Available fields in response:', Object.keys(responseData));
                console.log('Full response data:', JSON.stringify(responseData, null, 2));
            }

            return {
                token,
                refreshToken,
                user,
                ...responseData
            };

        } catch (error) {
            console.error('Login error details:', error);
            throw error;
        }
    },

    // Test connection
    testConnection: async () => {
        try {
            console.log('Testing connection to:', API_URL);
            const response = await fetch(API_URL.replace('/login', '/health'), {
                method: 'GET',
            });
            console.log('Health check status:', response.status);
            return response.status;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    },

    // Lưu cả access token và refresh token
    saveTokens: async (token, refreshToken) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
            }
            console.log('Tokens saved successfully');
        } catch (error) {
            console.error('Error saving tokens:', error);
        }
    },

    // Lưu thông tin user
    saveUserInfo: async (user) => {
        try {
            await AsyncStorage.setItem('userInfo', JSON.stringify(user));
            console.log('User info saved successfully');
        } catch (error) {
            console.error('Error saving user info:', error);
        }
    },

    // Lấy thông tin user
    getUserInfo: async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    },

    // Lấy refresh token
    getRefreshToken: async () => {
        try {
            return await AsyncStorage.getItem('refreshToken');
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    getToken: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            console.log('Token retrieved:', token ? 'Found' : 'Not found');
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    removeToken: async () => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userInfo']);
            console.log('All tokens and user info removed successfully');
        } catch (error) {
            console.error('Error removing tokens:', error);
        }
    },

    isTokenValid: (token) => {
        if (!token) return false;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp && decoded.exp < currentTime) {
                console.log('Token expired');
                return false;
            }

            console.log('Token is valid');
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
};

export default AuthService;
