import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AuthService from '../services/AuthService';
import { jwtDecode } from 'jwt-decode';

// Tạo UserContext
const UserContext = createContext();

// Hook để sử dụng UserContext
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// UserProvider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Kiểm tra auth status khi app khởi động
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Kiểm tra trạng thái authentication
    const checkAuthStatus = async () => {
        setIsLoading(true);

        try {
            const savedToken = await AuthService.getToken();
            const savedRefreshToken = await AuthService.getRefreshToken();
            const savedUser = await AuthService.getUserInfo();

            console.log('Checking auth status...');
            console.log('Saved token exists:', !!savedToken);
            console.log('Saved user exists:', !!savedUser);

            if (savedToken && AuthService.isTokenValid(savedToken)) {
                const decoded = jwtDecode(savedToken);

                if (decoded?.scope?.includes('ROLE_USERS')) {
                    console.log('User authenticated successfully');
                    setToken(savedToken);
                    setRefreshToken(savedRefreshToken);
                    setUser(savedUser);
                    setIsAuthenticated(true);
                } else {
                    console.log('User does not have required role');
                    await logout();
                }
            } else {
                console.log('No valid token found');
                await logout();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng nhập
    const login = async (loginData) => {
        try {
            const { token: newToken, refreshToken: newRefreshToken, user: newUser } = loginData;

            if (!newToken) {
                throw new Error('Token không hợp lệ');
            }

            // Lưu tokens và user info
            await AuthService.saveTokens(newToken, newRefreshToken);
            if (newUser) {
                await AuthService.saveUserInfo(newUser);
            }

            // Cập nhật state
            setToken(newToken);
            setRefreshToken(newRefreshToken);
            setUser(newUser);
            setIsAuthenticated(true);

            console.log('Login successful in context');
            return true;
        } catch (error) {
            console.error('Login context error:', error);
            Alert.alert('Lỗi đăng nhập', error.message || 'Không thể đăng nhập');
            return false;
        }
    };

    // Đăng xuất
    const logout = async () => {
        try {
            console.log('Logging out...');

            // Xóa dữ liệu từ storage
            await AuthService.removeToken();

            // Reset state
            setToken(null);
            setRefreshToken(null);
            setUser(null);
            setIsAuthenticated(false);

            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Cập nhật thông tin user
    const updateUser = async (updatedUser) => {
        try {
            await AuthService.saveUserInfo(updatedUser);
            setUser(updatedUser);
            console.log('User info updated');
        } catch (error) {
            console.error('Update user error:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin người dùng');
        }
    };

    // Refresh token (nếu cần thiết)
    const refreshAuthToken = async () => {
        try {
            if (!refreshToken) {
                throw new Error('Không có refresh token');
            }

            // TODO: Implement refresh token API call
            // const response = await AuthService.refreshToken(refreshToken);
            // if (response.token) {
            //   await AuthService.saveTokens(response.token, response.refreshToken);
            //   setToken(response.token);
            //   if (response.refreshToken) {
            //     setRefreshToken(response.refreshToken);
            //   }
            //   return true;
            // }

            console.log('Refresh token not implemented yet');
            return false;
        } catch (error) {
            console.error('Refresh token error:', error);
            await logout();
            return false;
        }
    };

    // Kiểm tra xem user có quyền cụ thể không
    const hasRole = (roleName) => {
        if (!user || !user.roles) return false;
        return user.roles.some(role => role.name === roleName);
    };

    // Kiểm tra xem user có phải admin không
    const isAdmin = () => {
        return hasRole('ADMIN') || hasRole('ROLE_ADMIN');
    };

    // Lấy thông tin user từ token
    const getUserFromToken = () => {
        if (!token) return null;

        try {
            const decoded = jwtDecode(token);
            return {
                id: decoded.userId,
                email: decoded.sub,
                name: decoded.name,
                scope: decoded.scope,
                exp: decoded.exp,
                iat: decoded.iat,
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    // Value object chứa tất cả state và functions
    const value = {
        // State
        user,
        token,
        refreshToken,
        isLoading,
        isAuthenticated,

        // Functions
        login,
        logout,
        updateUser,
        checkAuthStatus,
        refreshAuthToken,
        hasRole,
        isAdmin,
        getUserFromToken,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
