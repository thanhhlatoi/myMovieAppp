# 🎬 API Integration Guide - FavoritesScreen

## Overview
Hướng dẫn này sẽ giúp bạn tích hợp FavoritesScreen với Spring Boot Backend API để quản lý danh sách phim yêu thích của người dùng.

## 📁 Files Created/Modified

### New Files:
- `src/services/FavoriteService.js` - API service để gọi backend
- `src/config/apiConfig.js` - Cấu hình API và endpoints
- `API_INTEGRATION_GUIDE.md` - Hướng dẫn này

### Modified Files:
- `src/screens/FavoritesScreen.js` - Cập nhật để sử dụng real API

## 🔧 Setup Instructions

### 1. Cài đặt Dependencies

```bash
npm install @react-native-async-storage/async-storage
```

### 2. Cấu hình Backend URL

Mở file `src/config/apiConfig.js` và cập nhật:

```javascript
const DEVELOPMENT_CONFIG = {
    // Thay đổi URL này theo backend server của bạn
    BASE_URL: Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api',
    // ...
};

const PRODUCTION_CONFIG = {
    BASE_URL: 'https://your-production-api.com/api', // URL production của bạn
    // ...
};
```

### 3. Authentication Setup

FavoriteService sử dụng AsyncStorage để lưu trữ:
- `authToken` - JWT token từ backend
- `userData` - Thông tin user (bao gồm user ID)

Bạn cần đảm bảo sau khi login thành công:

```javascript
// Sau khi login thành công
await AsyncStorage.setItem('authToken', response.token);
await AsyncStorage.setItem('userData', JSON.stringify({
    id: response.user.id,
    name: response.user.name,
    email: response.user.email
}));
```

## 🚀 API Endpoints Supported

### Basic CRUD Operations

```javascript
// Lấy danh sách favorites của user
const favorites = await FavoriteService.getUserFavorites();

// Lấy favorites với pagination
const paginatedFavorites = await FavoriteService.getUserFavoritesPaginated(
    userId, page, size, sortBy, sortDir
);

// Thêm phim vào favorites
const result = await FavoriteService.addToFavorites(movieProductId);

// Xóa favorite
await FavoriteService.removeFavorite(favoriteId);
await FavoriteService.removeFavoriteByUserAndMovie(movieId);
```

### Toggle & Check Operations

```javascript
// Toggle favorite status
const result = await FavoriteService.toggleFavorite(movieProductId);

// Kiểm tra phim có phải favorite không
const isFavorite = await FavoriteService.checkIsFavorite(movieId);
```

### Batch Operations

```javascript
// Thêm nhiều phim cùng lúc
const results = await FavoriteService.addMultipleFavorites([movieId1, movieId2, movieId3]);

// Xóa tất cả favorites của user
await FavoriteService.removeAllUserFavorites();
```

### Statistics & Analytics

```javascript
// Thống kê favorite của user
const userStats = await FavoriteService.getUserFavoriteStats();

// Thống kê favorite của phim
const movieStats = await FavoriteService.getMovieFavoriteStats(movieId);

// Phim được yêu thích nhiều nhất
const trending = await FavoriteService.getMostFavoritedMovies(limit);
```

## 🔄 Data Transformation

FavoriteService tự động transform data từ backend API response thành format mà app sử dụng:

### Backend Response Format:
```javascript
{
    id: 1,
    userId: 123,
    movieProduct: {
        id: 456,
        title: "Avengers: Endgame",
        releaseYear: 2019,
        rating: 8.4,
        duration: 181,
        genre: "Action, Adventure",
        posterUrl: "https://...",
        backdropUrl: "https://...",
        description: "...",
        quality: "HD",
        maturityRating: "PG-13",
        category: "MOVIE"
    },
    createdAt: "2024-01-15T10:30:00Z"
}
```

### App Format (After Transformation):
```javascript
{
    id: 1,
    title: "Avengers: Endgame",
    year: "2019",
    rating: 8.4,
    duration: 181,
    genre: "Action, Adventure",
    addedDate: "2024-01-15T10:30:00Z",
    poster: "https://...",
    backdrop: "https://...",
    description: "...",
    isNew: false,
    isHD: true,
    progress: 0,
    maturityRating: "PG-13",
    category: "Phim lẻ"
}
```

## 📱 FavoritesScreen Features

### Netflix-Style Features:
1. **Real-time Stats**: Tổng số favorites, đang hiển thị, điểm trung bình
2. **Category Filtering**: Tất cả, Phim lẻ, Phim bộ, Hoạt hình
3. **Search**: Tìm kiếm theo tên phim, thể loại
4. **Sorting**: Gần đây, tên A-Z, năm sản xuất, đánh giá
5. **View Modes**: Grid view và List view
6. **Selection Mode**: Multi-select để xóa nhiều phim
7. **Toggle Favorites**: Heart icon để toggle favorite status
8. **Pull to Refresh**: Refresh để cập nhật data từ server
9. **Error Handling**: Hiển thị lỗi và retry options

### User Interactions:
- Tap: Xem chi tiết phim
- Long press: Vào selection mode
- Heart icon: Toggle favorite status
- Pull down: Refresh data
- Search: Tìm kiếm real-time

## 🔐 Security Considerations

### Authentication:
- Tất cả API calls đều có Authorization header với JWT token
- Token được lưu trong AsyncStorage (có thể upgrade lên Keychain/Keystore)
- Auto-retry với token refresh nếu cần

### Error Handling:
```javascript
try {
    const favorites = await FavoriteService.getUserFavorites();
    // Handle success
} catch (error) {
    if (error.message.includes('401')) {
        // Token expired - redirect to login
    } else if (error.message.includes('Network')) {
        // Network error - show retry option
    } else {
        // Other errors - show user-friendly message
    }
}
```

## 🚦 Testing API Integration

### 1. Test Backend Connection:
```javascript
// Test health check endpoint
const health = await FavoriteService.healthCheck();
console.log('Backend status:', health);
```

### 2. Test with Mock Data:
Nếu backend chưa sẵn sàng, bạn có thể comment out API calls và sử dụng mock data trong FavoritesScreen.

### 3. Debug Network Calls:
Set `DEBUG_CONFIG.ENABLE_NETWORK_LOGGING = true` trong apiConfig.js để xem network logs.

## 🔄 Fallback Strategy

Nếu API call thất bại, app sẽ:
1. Hiển thị error message cho user
2. Cung cấp retry button
3. Fallback về cache data nếu có
4. Redirect về Home screen nếu cần

## 📈 Performance Optimizations

1. **Pagination**: Sử dụng pagination để load data theo chunks
2. **Caching**: AsyncStorage để cache recent data
3. **Debouncing**: Search queries được debounce
4. **Lazy Loading**: Images được lazy load
5. **Error Boundaries**: Prevent app crashes từ API errors

## 🎯 Next Steps

1. **Implement Auth Service**: Tạo AuthService tương tự cho login/register
2. **Add Offline Support**: Cache favorites for offline viewing
3. **Add Push Notifications**: Notify users về new movies trong favorites
4. **Add Analytics**: Track user behavior với favorites
5. **Add Testing**: Unit tests và integration tests

## 🆘 Troubleshooting

### Common Issues:

1. **Network Error**: Kiểm tra backend server có đang chạy không
2. **401 Unauthorized**: Token expired, cần login lại
3. **404 Not Found**: Endpoint URL không đúng
4. **CORS Error**: Backend cần cấu hình CORS cho mobile app

### Debug Commands:
```bash
# Check if backend is running
curl http://localhost:8080/api/favorites/health

# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 💡 Tips

1. Đảm bảo backend Spring Boot app đang chạy trên port 8080
2. Kiểm tra CORS configuration trong backend
3. Test API endpoints với Postman trước khi integrate
4. Sử dụng Android emulator với IP 10.0.2.2 thay vì localhost
5. Enable network logs để debug API calls

Happy coding! 🚀 