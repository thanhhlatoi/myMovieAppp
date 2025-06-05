# 🚪 Logout Integration Guide - HomeScreen

## Overview
Hướng dẫn này giải thích cách tích hợp và sử dụng chức năng logout trong HomeScreen với thiết kế Netflix-style.

## 📁 Files Created/Modified

### New Files:
- `src/services/AuthService.js` - Service quản lý authentication
- `src/utils/authUtils.js` - Utilities cho authentication
- `LOGOUT_INTEGRATION_GUIDE.md` - Hướng dẫn này

### Modified Files:
- `src/screens/HomeScreen.js` - Thêm logic logout
- `src/components /home/MenuOverlay.js` - Enhanced Netflix-style menu

## 🚀 Features Implemented

### 1. AuthService Features:
- ✅ `login()` - Đăng nhập user
- ✅ `register()` - Đăng ký user mới  
- ✅ `logout()` - Đăng xuất với cleanup hoàn toàn
- ✅ `isAuthenticated()` - Kiểm tra trạng thái đăng nhập
- ✅ `refreshToken()` - Refresh JWT token
- ✅ Token management với AsyncStorage
- ✅ User data management
- ✅ Session validation

### 2. Enhanced HomeScreen Features:
- ✅ Netflix-style logout confirmation
- ✅ Loading states during logout
- ✅ Proper navigation reset after logout
- ✅ Local state cleanup
- ✅ Error handling
- ✅ Enhanced settings menu

### 3. Netflix-Style MenuOverlay:
- ✅ User profile header với avatar
- ✅ Real-time user information
- ✅ Premium membership badge
- ✅ Online status indicator
- ✅ Gradient background design
- ✅ Icon-based menu items
- ✅ Enhanced logout styling
- ✅ App version footer

## 🔧 How It Works

### Logout Flow:
```
1. User taps menu button in HomeScreen
2. MenuOverlay shows with user info
3. User taps "Đăng xuất"
4. Confirmation dialog appears
5. If confirmed:
   - Show loading state
   - Call AuthService.logout()
   - Clear local storage (token, user data, cache)
   - Clear HomeScreen state
   - Navigate to Login screen
   - Show success message
```

### Error Handling:
```
- If server logout fails: Still clear local data and proceed
- If network error: Still clear local data and proceed  
- If cleanup fails: Still navigate to login for safety
- Always ensure user is logged out locally
```

## 🎮 Testing Instructions

### 1. Test Menu Display:
1. Mở HomeScreen
2. Tap vào avatar/menu icon (góc trên phải)
3. Menu overlay sẽ hiển thị với:
   - User profile header
   - Avatar/default icon
   - User name và email
   - Premium badge
   - Menu items với icons
   - Logout item màu đỏ

### 2. Test Logout Flow:
1. Trong menu, tap "Đăng xuất"
2. Confirmation dialog xuất hiện
3. Tap "Đăng xuất" để confirm
4. Loading state hiển thị
5. Success message xuất hiện
6. App navigate về Login screen
7. Kiểm tra AsyncStorage đã được clear

### 3. Test Error Scenarios:
```javascript
// Test với network error
// Disable WiFi trước khi logout
// App vẫn phải logout local và navigate về Login

// Test với invalid token
// Set invalid token trong AsyncStorage
// Logout vẫn phải hoạt động
```

## 🔧 Configuration

### 1. Backend URL Setup:
```javascript
// Trong src/config/apiConfig.js
BASE_URL: Platform.OS === 'android' ? 'http://192.168.100.193:8082/api' : 'http://localhost:8080/api'
```

### 2. Authentication Data Structure:
```javascript
// AsyncStorage keys:
'authToken' - JWT token string
'userData' - JSON object với user info

// Expected user data format:
{
    id: number,
    email: string,
    name?: string,
    fullName?: string,
    avatar?: string,
    roles?: string[]
}

// Server response format (your backend):
{
    "authentication": {
        "token": "JWT_TOKEN",
        "refreshToken": "REFRESH_TOKEN", 
        "tokenType": "Bearer",
        "expiresIn": 3600,
        "user": {
            "id": 2,
            "email": "user@example.com",
            "fullName": "Full Name",
            "active": true,
            "verified": true,
            "roles": [...]
        }
    }
}
```

## 🎨 UI/UX Features

### Netflix-Style Design:
- **Dark Theme**: Black/gray gradient backgrounds
- **Red Accents**: Netflix signature red (#E50914)
- **Smooth Animations**: Fade effects and transitions
- **Modern Typography**: Clean, readable fonts
- **Visual Hierarchy**: Clear importance levels
- **Consistent Spacing**: Proper padding/margins

### User Experience:
- **Clear Feedback**: Loading states and success messages
- **Intuitive Navigation**: Easy access to logout
- **Safety Confirmations**: Prevent accidental logout
- **Graceful Errors**: Handle failures elegantly
- **Quick Access**: Menu readily available

## 🛠️ Advanced Features

### 1. Auto-Logout on Token Expiry:
```javascript
// AuthService tự động check token validity
// Nếu expired, auto logout và redirect về Login
```

### 2. Session Management:
```javascript
// Validate session khi app start
const isValid = await AuthUtils.validateSession();
if (!isValid) {
    // Auto redirect to login
}
```

### 3. User Profile Integration:
```javascript
// MenuOverlay tự động load user data
// Hiển thị real-time user information
// Support avatar URLs và fallback
```

## 🔐 Security Considerations

### 1. Token Security:
- Tokens stored in AsyncStorage (có thể upgrade lên Keychain)
- Auto-clear tokens on logout
- Proper Authorization headers

### 2. Data Cleanup:
- Clear all user-specific cached data
- Remove sensitive information
- Reset app state completely

### 3. Navigation Security:
- Use reset navigation to prevent back navigation
- Clear navigation stack completely
- Ensure no sensitive data remains

## 🐛 Troubleshooting

### Common Issues:

1. **Menu không hiển thị:**
   ```
   - Kiểm tra import statements
   - Verify navigation prop
   - Check MenuOverlay visibility state
   ```

2. **Logout không hoạt động:**
   ```
   - Kiểm tra AuthService import
   - Verify AsyncStorage permissions
   - Check network connectivity
   ```

3. **Navigation error:**
   ```
   - Ensure Login screen exists trong navigation
   - Verify navigation.reset syntax
   - Check navigation stack structure
   ```

4. **User data không hiển thị:**
   ```
   - Kiểm tra AsyncStorage data format
   - Verify AuthUtils functions
   - Check loading states
   ```

## 📱 Usage Examples

### Basic Usage:
```javascript
// Trong HomeScreen
import AuthService from '../services/AuthService';

// Logout function
const handleLogout = async () => {
    const result = await AuthService.logout();
    if (result.success) {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    }
};
```

### Check Authentication:
```javascript
// Check if user is logged in
const isAuth = await AuthService.isAuthenticated();
if (!isAuth) {
    // Redirect to login
}
```

### Get User Info:
```javascript
// Get current user data
const user = await AuthService.getUserData();
console.log('Current user:', user);
```

## 🎯 Next Steps

1. **Add Biometric Authentication**: Touch/Face ID for login
2. **Implement Remember Me**: Option to stay logged in
3. **Add Session Timeout**: Auto-logout after inactivity
4. **Social Login**: Google, Facebook integration
5. **Multi-Device Logout**: Logout from all devices

## 💡 Tips

1. **Always test logout in different scenarios** (network on/off, invalid tokens)
2. **Use development tools** để monitor AsyncStorage
3. **Test navigation flow** thoroughly
4. **Verify data cleanup** after logout
5. **Check memory leaks** trong navigation

Happy coding! 🚀

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Console logs để debug
2. AsyncStorage data
3. Network requests
4. Navigation stack
5. Import statements 

## ✅ Recent Fixes

### Login Error Resolution:
**Problem**: `Request body is invalid or malformed JSON` và `Invalid response format from server`

**Solution**: 
1. ✅ Fixed AuthService.login() để handle cả 2 formats: `login(email, password)` và `login({email, password})`
2. ✅ Updated response parsing để handle server response structure với `authentication` object
3. ✅ Added proper request headers và body formatting
4. ✅ Enhanced error logging và debugging

### Changes Made:
```javascript
// Before: Expected flat response
{ token: "...", user: {...} }

// After: Handles nested response
{ authentication: { token: "...", user: {...}, refreshToken: "...", expiresIn: 3600 } }
``` 