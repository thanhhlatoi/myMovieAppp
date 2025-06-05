// 📄 src/utils/authUtils.js - Authentication Utilities
import AuthService from '../services/AuthService';

export const AuthUtils = {
    // Check if user is authenticated and redirect if needed
    checkAuthAndRedirect: async (navigation) => {
        try {
            const isAuthenticated = await AuthService.isAuthenticated();
            
            if (!isAuthenticated) {
                // Clear any stale data
                await AuthService.logout();
                
                // Redirect to login
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
                
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            
            // On error, redirect to login for safety
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
            
            return false;
        }
    },

    // Get current user info
    getCurrentUser: async () => {
        try {
            return await AuthService.getUserData();
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    // Validate session and refresh if needed
    validateSession: async () => {
        try {
            const isAuthenticated = await AuthService.isAuthenticated();
            
            if (!isAuthenticated) {
                return false;
            }

            // Try to validate token with server (if endpoint exists)
            try {
                const isValid = await AuthService.validateToken();
                return isValid;
            } catch (validationError) {
                // If validation fails, try to refresh token
                try {
                    await AuthService.refreshToken();
                    return true;
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    return false;
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    },

    // Format user display name
    formatUserDisplayName: (user) => {
        if (!user) return 'Người dùng';
        
        if (user.fullName) return user.fullName;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.name) return user.name;
        if (user.email) return user.email.split('@')[0];
        
        return 'Người dùng';
    },

    // Get user avatar URL or fallback
    getUserAvatar: (user) => {
        if (!user) return null;
        
        return user.avatar || user.avatarUrl || user.profilePicture || null;
    },

    // Check if user has specific role/permission
    hasRole: (user, role) => {
        if (!user || !user.roles) return false;
        
        if (Array.isArray(user.roles)) {
            return user.roles.includes(role);
        }
        
        if (typeof user.roles === 'string') {
            return user.roles === role;
        }
        
        return false;
    },

    // Logout with cleanup
    performLogout: async (navigation, showAlert = true) => {
        try {
            const result = await AuthService.logout();
            
            if (showAlert) {
                // You might want to show a toast instead of alert
                console.log('Logout successful:', result.message);
            }
            
            // Navigate to login
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            
            // Even if logout fails, still navigate to login
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
            
            return true; // Still return true as we've cleared the session
        }
    }
};

export default AuthUtils; 