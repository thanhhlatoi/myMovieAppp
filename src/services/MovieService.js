const API_BASE_URL = "http://172.20.10.7:8082/api/movieProduct";

const MovieService = {
  getAllMovies: async (page = 0, size = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log("✅ Kết nối thành công tới API movieProduct!");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi tải movieProduct:", error);
      return null;
    }
  },
  getMovieById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy thành công movieProduct với ID: ${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy movieProduct với ID ${id}:`, error);
      return null;
    }
  },
  getMoviesByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/category/${categoryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy thành công phim theo category ID: ${categoryId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy phim theo category ${categoryId}:`, error);
      return null;
    }
  },
  getPopularMoviesByCategory: async (categoryId, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/category/${categoryId}/popular?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy thành công phim phổ biến theo category ID: ${categoryId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy phim phổ biến theo category ${categoryId}:`, error);
      return null;
    }
  },
  searchMoviesBasic: async (searchParams) => {
    try {
      const params = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== null && searchParams[key] !== undefined && searchParams[key] !== '') {
          params.append(key, searchParams[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/search/basic?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Tìm kiếm cơ bản thành công với params:`, searchParams);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi tìm kiếm cơ bản:", error);
      return null;
    }
  },
  searchMoviesAdvanced: async (searchParams) => {
    try {
      const params = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== null && searchParams[key] !== undefined && searchParams[key] !== '') {
          params.append(key, searchParams[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/search/advanced?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Tìm kiếm nâng cao thành công với params:`, searchParams);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi tìm kiếm nâng cao:", error);
      return null;
    }
  },
  searchMoviesByTitle: async (title) => {
    try {
      const response = await fetch(`${API_BASE_URL}/search?title=${encodeURIComponent(title)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Tìm kiếm theo title thành công: ${title}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi tìm kiếm theo title ${title}:`, error);
      return null;
    }
  },
  getSearchSuggestions: async (keyword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/suggestions?keyword=${encodeURIComponent(keyword)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy gợi ý tìm kiếm thành công cho: ${keyword}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy gợi ý tìm kiếm cho ${keyword}:`, error);
      return null;
    }
  },
  getTrendingKeywords: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/trending-keywords?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy từ khóa trending thành công với limit: ${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi lấy từ khóa trending:", error);
      return null;
    }
  },
  watchMovie: async (movieId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/watch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Đánh dấu xem phim thành công cho ID: ${movieId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi đánh dấu xem phim ${movieId}:`, error);
      return null;
    }
  },
  likeMovie: async (movieId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Like phim thành công cho ID: ${movieId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi like phim ${movieId}:`, error);
      return null;
    }
  },
  dislikeMovie: async (movieId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/disklike`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Dislike phim thành công cho ID: ${movieId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Lỗi khi dislike phim ${movieId}:`, error);
      return null;
    }
  },
  getFileFromMinio: async (bucketName, path) => {
    try {
      const response = await fetch(`${API_BASE_URL}/view?bucketName=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(path)}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log(`✅ Lấy file thành công từ bucket: ${bucketName}, path: ${path}`);
      return response;
    } catch (error) {
      console.error(`❌ Lỗi khi lấy file từ MinIO bucket ${bucketName}, path ${path}:`, error);
      return null;
    }
  },
  // NEW: Check if user has liked a movie
  checkUserLikeStatus: async (movieId, userId = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/like-status?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist, return default status
        console.warn(`⚠️ Like status endpoint not available for movie ${movieId}`);
        return { liked: false, disliked: false };
      }

      console.log(`✅ Retrieved like status for movie ${movieId} and user ${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error checking like status for movie ${movieId}:`, error);
      // Return default status on error
      return { liked: false, disliked: false };
    }
  },
  
  // NEW: Enhanced like movie that handles one-like-per-user logic
  likeMovieEnhanced: async (movieId, userId = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/like-enhanced?userId=${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Fallback to regular like endpoint
        console.warn(`⚠️ Enhanced like endpoint not available, using regular like for movie ${movieId}`);
        return await MovieService.likeMovie(movieId);
      }

      console.log(`✅ Enhanced like successful for movie ${movieId} and user ${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error with enhanced like for movie ${movieId}:`, error);
      // Fallback to regular like
      return await MovieService.likeMovie(movieId);
    }
  },
  
  // NEW: Enhanced dislike movie that handles one-dislike-per-user logic
  dislikeMovieEnhanced: async (movieId, userId = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${movieId}/dislike-enhanced?userId=${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Fallback to regular dislike endpoint
        console.warn(`⚠️ Enhanced dislike endpoint not available, using regular dislike for movie ${movieId}`);
        return await MovieService.dislikeMovie(movieId);
      }

      console.log(`✅ Enhanced dislike successful for movie ${movieId} and user ${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error with enhanced dislike for movie ${movieId}:`, error);
      // Fallback to regular dislike
      return await MovieService.dislikeMovie(movieId);
    }
  },
};

export default MovieService;
