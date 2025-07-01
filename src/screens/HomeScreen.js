// 📄 src/screens/HomeScreen.js - Netflix-Style Enhanced Version
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

// Import constants
import { FONTS } from '../constants/Fonts';
// Import services
import CategoryService from '../services/CategoryService';
import VideoService from '../services/VideoService';
import MovieService from '../services/MovieService';
import AuthService from '../services/AuthService';

// ⭐ FIXED: Đường dẫn import (bỏ khoảng trắng)
import LoadingSpinner from '../components /common/LoadingSpinner';
import SectionContainer from '../components /common/SectionContainer';
import SectionTitle from '../components /common/SectionTitle';
import ItemSeparator from '../components /common/ItemSeparator';

import HeaderBar from '../components /home/HeaderBar';
import HeroSection from '../components /home/HeroSection';
import GenreList from '../components /home/GenreList';
import MovieList from '../components /home/MovieList';
import MenuOverlay from '../components /home/MenuOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // Netflix-style State management
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  // Enhanced data states
  const [videos, setVideos] = useState([]);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  // Netflix-style content sections
  const [heroMovies, setHeroMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newAndPopular, setNewAndPopular] = useState([]);
  const [myList, setMyList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // ✨ NEW: Category-based content sections
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [popularMoviesByCategory, setPopularMoviesByCategory] = useState({});
  const [loadingGenreMovies, setLoadingGenreMovies] = useState(false);

  // UI states
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  
  // ✨ NEW: Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroSlideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Netflix-style auto-rotation for hero
  const heroRotationRef = useRef(null);
  
  // ✨ NEW: Search debounce ref
  const searchTimeoutRef = useRef(null);

  // ✨ ENHANCED: Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkInfo(state);
      console.log('📶 Network changed:', state.type, state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // ✨ ENHANCED: Smart data fetching
  useEffect(() => {
    fetchData();
    startHeroRotation();

    return () => {
      if (heroRotationRef.current) {
        clearInterval(heroRotationRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ✨ ENHANCED: Optimized data processing
  useEffect(() => {
    processVideosData();
  }, [videos]);

  useEffect(() => {
    filterMoviesByGenre();
  }, [activeGenre, movies, moviesByCategory]);

  // ✨ NEW: Fetch category movies when genres are loaded
  useEffect(() => {
    if (genres.length > 0 && movies.length > 0) {
      fetchMoviesByCategories();
    }
  }, [genres]);

  // ✨ NEW: Handle favorites changes
  const handleFavoritesChange = useCallback((movieId, isFavorite) => {
    console.log(`💖 HomeScreen: Movie ${movieId} favorite status changed to ${isFavorite}`);
    
    // Optional: Update local state or refresh data
    // For now, just log the change
    // In the future, you could update myList state or trigger a refresh
    
    if (isFavorite) {
      console.log('🎬 Movie added to favorites, consider refreshing My List section');
    } else {
      console.log('🗑️ Movie removed from favorites, consider updating My List section');
    }
  }, []);

  // ✨ NETFLIX FEATURE: Auto-rotating hero section
  const startHeroRotation = () => {
    heroRotationRef.current = setInterval(() => {
      setCurrentHeroIndex(prev => {
        const nextIndex = (prev + 1) % Math.max(1, heroMovies.length);

        // Smooth transition animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();

        return nextIndex;
      });
    }, 6000); // Change every 6 seconds (Netflix style)
  };

  // ✨ ENHANCED: Smart data processing with Netflix categorization
  const processVideosData = useCallback(() => {
    if (videos.length === 0) {
      console.log("⚠️ No videos to process");
      return;
    }

    console.log("🔄 Processing videos data...");
    console.log("📊 Raw videos count:", videos.length);

    // Convert videos to movies
    const processedMovies = videos.map(convertVideoToMovie).filter(Boolean);
    setMovies(processedMovies);

    // ✨ NETFLIX SECTIONS: Categorize content
    categorizeContent(processedMovies, videos);

  }, [videos]);

  // ✨ NETFLIX FEATURE: Smart content categorization
  const categorizeContent = (processedMovies, rawVideos) => {
    // Hero section - Top 5 most popular
    const heroContent = processedMovies
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    setHeroMovies(heroContent);

    // Continue Watching - Videos with watch progress
    const continueWatchingContent = processedMovies
      .filter(movie => movie._watchedAt && movie._duration)
      .slice(0, 10);
    setContinueWatching(continueWatchingContent);

    // Trending - Recent and popular
    const trendingContent = processedMovies
      .sort((a, b) => {
        const aScore = (a.views || 0) + (new Date(a._watchedAt || 0).getTime() / 1000000);
        const bScore = (b.views || 0) + (new Date(b._watchedAt || 0).getTime() / 1000000);
        return bScore - aScore;
      })
      .slice(0, 15);
    setTrending(trendingContent);

    // New & Popular - Recent uploads
    const newContent = processedMovies
      .filter(movie => {
        const uploadDate = new Date(movie._watchedAt || movie.createdAt);
        const daysDiff = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Last 30 days
      })
      .slice(0, 12);
    setNewAndPopular(newContent);

    // Recommendations - Similar to watched content
    const recommendedContent = processedMovies
      .filter(movie => Math.random() > 0.5) // Simulated recommendation algorithm
      .slice(0, 10);
    setRecommendations(recommendedContent);

    console.log("📊 Content categorized:");
    console.log("🦸 Hero:", heroContent.length);
    console.log("▶️ Continue Watching:", continueWatchingContent.length);
    console.log("🔥 Trending:", trendingContent.length);
    console.log("🆕 New & Popular:", newContent.length);
    console.log("💡 Recommendations:", recommendedContent.length);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting data fetch...");

      // ✨ ENHANCED: Fetch both videos and movies from API
      const [genresResponse, videosResponse, moviesResponse] = await Promise.all([
        CategoryService.getAllCategories(),
        VideoService.getVideosWithMovieProduct(0, 20), // ✨ FILTERED: Only videos with movieProduct
        MovieService.getAllMovies(0, 50) // Fetch more movies for better categorization
      ]);

      console.log("✅ API responses received");
      handleGenresData(genresResponse);
      handleVideosData(videosResponse);
      await handleMoviesData(moviesResponse);

    } catch (error) {
      handleFetchError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenresData = (response) => {
    const genresData = response?.data?.content || [];
    console.log("📁 Genres loaded:", genresData.length);
    setGenres(genresData);
  };

  const handleVideosData = (response) => {
    const videosData = response?.data?.content || [];
    console.log("📦 Videos loaded:", videosData.length);
    setVideos(videosData);
  };

  // ✨ NEW: Handle movies data and fetch category-based content
  const handleMoviesData = async (response) => {
    const moviesData = response?.data?.content || [];
    console.log("🎬 Movies loaded:", moviesData.length);
    
    // Set movies data
    const processedMovies = moviesData.filter(Boolean);
    setMovies(prevMovies => [...prevMovies, ...processedMovies]);

    // ✨ ENHANCED: Fetch movies by category for each available genre
    if (genres.length > 0) {
      await fetchMoviesByCategories();
    }
  };

  // ✨ NEW: Fetch movies by categories
  const fetchMoviesByCategories = async () => {
    try {
      console.log("🎭 Fetching movies by categories...");
      
      const categoryPromises = genres.slice(0, 5).map(async (genre) => {
        try {
          // Fetch regular movies by category
          const categoryMovies = await MovieService.getMoviesByCategory(genre.id);
          
          // Fetch popular movies by category
          const popularMovies = await MovieService.getPopularMoviesByCategory(genre.id, 10);
          
          return {
            categoryId: genre.id,
            categoryName: genre.name,
            movies: categoryMovies?.data || [],
            popularMovies: popularMovies?.data || []
          };
        } catch (error) {
          console.error(`❌ Error fetching movies for category ${genre.name}:`, error);
          return {
            categoryId: genre.id,
            categoryName: genre.name,
            movies: [],
            popularMovies: []
          };
        }
      });

      const categoryResults = await Promise.all(categoryPromises);
      
      // Organize data by category
      const moviesByCat = {};
      const popularMoviesByCat = {};
      
      categoryResults.forEach(result => {
        if (result.movies.length > 0) {
          moviesByCat[result.categoryName] = result.movies;
        }
        if (result.popularMovies.length > 0) {
          popularMoviesByCat[result.categoryName] = result.popularMovies;
        }
      });
      
      setMoviesByCategory(moviesByCat);
      setPopularMoviesByCategory(popularMoviesByCat);
      
      console.log("✅ Category-based movies loaded:");
      console.log("📊 Categories with movies:", Object.keys(moviesByCat).length);
      console.log("📊 Categories with popular movies:", Object.keys(popularMoviesByCat).length);
      
    } catch (error) {
      console.error("❌ Error fetching movies by categories:", error);
    }
  };

  const handleFetchError = (error) => {
    console.error("❌ Lỗi khi tải dữ liệu:", error);
    Alert.alert(
        "Lỗi tải dữ liệu",
        "Không thể tải dữ liệu. Vui lòng thử lại sau.",
        [
          { text: "Thử lại", onPress: () => fetchData() },
          { text: "Hủy", style: "cancel" }
        ]
    );
  };

  // ✨ ENHANCED: Convert function với strict movieProduct requirement
  const convertVideoToMovie = (video) => {
    if (!video) {
      console.warn("⚠️ Video is null/undefined in convertVideoToMovie");
      return null;
    }

    // ✨ STRICT FILTER: Only process videos with movieProduct
    if (!video.movieProduct) {
      console.warn(`⚠️ Video ID ${video.id} has no movieProduct - skipping conversion`);
      return null;
    }

    console.log("🔄 Converting video:", video.id, "with movieProduct:", video.movieProduct.title);

    // Convert với movieProduct data
    const converted = {
      ...video.movieProduct,
      // Thêm thông tin từ video
      _videoData: video,
      _hasVideo: true,
      _videoFilm: video.videoFilm,
      _fileSize: video.fileSize,
      _status: video.status,
      _qualities: video.availableQualities,
      _watchedAt: video.watchedAt
    };
    
    console.log("✅ Converted with movieProduct:", converted.id, converted.title);
    return converted;
  };

  // ✨ ENHANCED: Filter movies by genre using both API data and local data
  const filterMoviesByGenre = async () => {
    if (activeGenre && activeGenre !== 'Tất cả') {
      console.log("🔍 Genre filter applied:", activeGenre);
      setLoadingGenreMovies(true);
      
      // ✨ NEW: First try to get movies from API by category
      let filteredFromAPI = [];
      
      // Find the genre ID from genres list
      const selectedGenre = genres.find(genre => 
        genre.name?.toLowerCase() === activeGenre.toLowerCase()
      );
      
      if (selectedGenre) {
        try {
          console.log(`🔍 Fetching movies for genre ID: ${selectedGenre.id}`);
          const apiResponse = await MovieService.getMoviesByCategory(selectedGenre.id);
          filteredFromAPI = apiResponse?.data || [];
          console.log(`🔍 API returned ${filteredFromAPI.length} movies for ${activeGenre}`);
        } catch (error) {
          console.error("❌ Error fetching movies by category:", error);
        }
      }
      
      // ✨ FALLBACK: If API doesn't return results, filter from local movies
      let filteredFromLocal = [];
      if (filteredFromAPI.length === 0) {
        filteredFromLocal = movies.filter(movie => {
          const movieCategories = movie.categories || [];
          return movieCategories.some(cat =>
            cat.name?.toLowerCase().includes(activeGenre.toLowerCase())
          );
        });
        console.log(`🔍 Local filter returned ${filteredFromLocal.length} movies for ${activeGenre}`);
      }
      
      // ✨ ENHANCED: Also check moviesByCategory state
      let filteredFromCategoryState = [];
      if (moviesByCategory[activeGenre]) {
        filteredFromCategoryState = moviesByCategory[activeGenre];
        console.log(`🔍 Category state has ${filteredFromCategoryState.length} movies for ${activeGenre}`);
      }
      
      // ✨ SMART MERGE: Combine results and remove duplicates
      const allFilteredMovies = [
        ...filteredFromAPI,
        ...filteredFromLocal,
        ...filteredFromCategoryState
      ];
      
      // Remove duplicates based on movie ID
      const uniqueMovies = allFilteredMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );
      
      console.log(`🔍 Final filtered result: ${uniqueMovies.length} unique movies for ${activeGenre}`);
      setFilteredMovies(uniqueMovies);
      setLoadingGenreMovies(false);
      
    } else {
      console.log("🔍 No genre filter, showing all movies");
      
      // ✨ ENHANCED: Show all movies from all sources
      const allMoviesFromCategories = Object.values(moviesByCategory).flat();
      const allMovies = [
        ...movies,
        ...allMoviesFromCategories
      ];
      
      // Remove duplicates
      const uniqueAllMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );
      
      setFilteredMovies(uniqueAllMovies);
      setLoadingGenreMovies(false);
    }
  };

  // Event handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGenreSelect = async (genreName) => {
    console.log("🎭 Genre selected:", genreName);
    
    // ✨ ENHANCED: Toggle logic - if same genre selected, show all movies
    if (activeGenre === genreName) {
      console.log("🎭 Deselecting genre, showing all movies");
      setActiveGenre(null);
    } else {
      console.log(`🎭 Selecting new genre: ${genreName}`);
      setActiveGenre(genreName);
    }
  };

  const handleMoviePress = async (movieId) => {
    try {
      console.log("🎬 Opening movie/video with ID:", movieId);

      // ✨ ENHANCED: Track movie view
      await MovieService.watchMovie(movieId);

      // Tìm movie từ multiple sources
      let movie = movies.find(m => m.id === movieId);
      
      // ✨ NEW: Also search in category-based movies
      if (!movie) {
        Object.values(moviesByCategory).forEach(categoryMovies => {
          if (!movie) {
            movie = categoryMovies.find(m => m.id === movieId);
          }
        });
      }
      
      // ✨ NEW: Also search in popular movies by category
      if (!movie) {
        Object.values(popularMoviesByCategory).forEach(popularMovies => {
          if (!movie) {
            movie = popularMovies.find(m => m.id === movieId);
          }
        });
      }

      const video = movie?._videoData;

      console.log("🎬 Found movie:", movie?.title);
      console.log("🎬 Found video:", video?.id);

      if (movie) {
        if (video) {
          if (movie._isVideoOnly) {
            console.log("🎬 Navigating to VideoPlayerScreen");
            navigation.navigate("VideoPlayerScreen", {
              videoId: video.id,
              movie: movie,
              movieTitle: movie.title
            });
          } else {
            console.log("🎬 Navigating to MovieScreen");
            navigation.navigate("movie", {
              movie: movie,
              video: video
            });
          }
        } else {
          // Movie without video data - navigate to movie details
          console.log("🎬 Navigating to MovieScreen (no video)");
          navigation.navigate("movie", {
            movie: movie
          });
        }
      } else {
        console.warn("Movie not found for ID:", movieId);
        Alert.alert("Lỗi", "Không tìm thấy phim này.");
      }
    } catch (error) {
      console.error("❌ Lỗi khi mở video:", error);
      Alert.alert("Lỗi", "Không thể mở video này. Vui lòng thử lại.");
    }
  };

  // ✨ NETFLIX FEATURE: Enhanced event handlers
  const handleSearchPress = () => {
    setSearchVisible(true);
    console.log("🔍 Search activated");
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    
    // ✨ ENHANCED: Restore original filtered movies
    if (!activeGenre) {
      const allMoviesFromCategories = Object.values(moviesByCategory).flat();
      const allMovies = [
        ...movies,
        ...allMoviesFromCategories
      ];
      
      const uniqueAllMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );
      
      setFilteredMovies(uniqueAllMovies);
    }
    
    console.log("🔍 Search deactivated and cleared");
  };

  // ✨ ENHANCED: Comprehensive search function with debounce
  const handleSearchChange = async (query) => {
    console.log("🔍 Search query:", query);
    setSearchQuery(query);
    
    // ✨ NEW: Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.trim()) {
      // ✨ NEW: Debounce search to avoid too many API calls
      searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // ✨ ENHANCED: Search in multiple sources
        
        // 1. Search from API
        let apiResults = [];
        try {
          const apiResponse = await MovieService.searchMoviesByTitle(query);
          apiResults = apiResponse?.data || [];
          console.log(`🔍 API search returned ${apiResults.length} results`);
        } catch (error) {
          console.error("❌ API search error:", error);
        }
        
        // 2. Search in local movies (from videos)
        const localResults = movies.filter(movie =>
          movie.title?.toLowerCase().includes(query.toLowerCase()) ||
          movie.description?.toLowerCase().includes(query.toLowerCase())
        );
        console.log(`🔍 Local search returned ${localResults.length} results`);
        
        // 3. Search in moviesByCategory
        const categoryResults = [];
        Object.values(moviesByCategory).forEach(categoryMovies => {
          const filtered = categoryMovies.filter(movie =>
            movie.title?.toLowerCase().includes(query.toLowerCase()) ||
            movie.description?.toLowerCase().includes(query.toLowerCase())
          );
          categoryResults.push(...filtered);
        });
        console.log(`🔍 Category search returned ${categoryResults.length} results`);
        
        // 4. Search in popularMoviesByCategory
        const popularResults = [];
        Object.values(popularMoviesByCategory).forEach(popularMovies => {
          const filtered = popularMovies.filter(movie =>
            movie.title?.toLowerCase().includes(query.toLowerCase()) ||
            movie.description?.toLowerCase().includes(query.toLowerCase())
          );
          popularResults.push(...filtered);
        });
        console.log(`🔍 Popular search returned ${popularResults.length} results`);
        
        // ✨ SMART MERGE: Combine all results and remove duplicates
        const allResults = [
          ...apiResults,
          ...localResults,
          ...categoryResults,
          ...popularResults
        ];
        
        // Remove duplicates based on movie ID
        const uniqueResults = allResults.filter((movie, index, self) =>
          index === self.findIndex(m => m.id === movie.id)
        );
        
        console.log(`🔍 Final search results: ${uniqueResults.length} unique movies`);
        
        setSearchResults(uniqueResults);
        setFilteredMovies(uniqueResults);
        
        // ✨ NEW: Clear active genre when searching
        if (activeGenre) {
          setActiveGenre(null);
        }
        
      } catch (error) {
        console.error("❌ Search error:", error);
        setSearchResults([]);
        setFilteredMovies([]);
             } finally {
         setIsSearching(false);
       }
      }, 500); // Debounce 500ms
    } else {
      // ✨ ENHANCED: Clear search - restore original state
      console.log("🔍 Clearing search, restoring original state");
      setSearchResults([]);
      setIsSearching(false);
      
      // Restore to all movies from all sources
      const allMoviesFromCategories = Object.values(moviesByCategory).flat();
      const allMovies = [
        ...movies,
        ...allMoviesFromCategories
      ];
      
      // Remove duplicates
      const uniqueAllMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );
      
      setFilteredMovies(uniqueAllMovies);
    }
  };

  const handleNotificationPress = () => {
    console.log("🔔 Notifications pressed");
    Alert.alert("Thông báo", "Bạn có 3 thông báo mới!");
  };

  const handleMenuSelect = async (action) => {
    setMenuVisible(false);
    console.log("Menu action:", action);

    try {
      switch (action) {
        case 'Logout':
          await handleLogout();
          break;
        case 'Settings':
          handleSettings();
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        case 'Favorites':
          navigation.navigate('Favorites');
          break;
        default:
          console.log('Unknown menu action:', action);
      }
    } catch (error) {
      console.error('Menu action error:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện hành động này');
    }
  };

  // ✨ NETFLIX FEATURE: Enhanced logout functionality
  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              setLoading(true);

              // Perform logout
              const result = await AuthService.logout();

              if (result.success) {
                // Clear any local state
                setVideos([]);
                setMovies([]);
                setFilteredMovies([]);
                setHeroMovies([]);
                setContinueWatching([]);
                setTrending([]);
                setNewAndPopular([]);
                setRecommendations([]);
                setMyList([]);

                // Show success message
                Alert.alert(
                  'Thành công',
                  result.message,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate to Login screen
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'login' }],
                        });
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Logout error:', error);

              // Even if logout fails, still navigate to login
              Alert.alert(
                'Đăng xuất thành công',
                'Đã xóa thông tin đăng nhập khỏi thiết bị',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    }
                  }
                ]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // ✨ NETFLIX FEATURE: Settings handler
  const handleSettings = () => {
    Alert.alert(
      'Cài đặt',
      'Chọn cài đặt bạn muốn thay đổi:',
      [
        {
          text: 'Thông báo',
          onPress: () => {
            Alert.alert('Thông báo', 'Tính năng quản lý thông báo đang được phát triển');
          }
        },
        {
          text: 'Chất lượng video',
          onPress: () => {
            Alert.alert('Chất lượng video', 'Tính năng cài đặt chất lượng đang được phát triển');
          }
        },
        {
          text: 'Đổi mật khẩu',
          onPress: () => {
            Alert.alert('Đổi mật khẩu', 'Vui lòng vào Profile để đổi mật khẩu');
          }
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
      ]
    );
  };

  // Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ✨ ENHANCED: Debug logs trước khi render
  console.log("🎬 Rendering HomeScreen:");
  console.log("📊 Videos:", videos.length);
  console.log("📊 Movies:", movies.length);
  console.log("📊 Filtered Movies:", filteredMovies.length);
  console.log("📊 Hero Movies:", heroMovies.length);
  console.log("📊 Active Genre:", activeGenre);
  console.log("📊 Loading:", loading);
  console.log("📊 Loading Genre Movies:", loadingGenreMovies);
  console.log("📊 Search Query:", searchQuery);
  console.log("📊 Search Results:", searchResults.length);
  console.log("📊 Is Searching:", isSearching);
  console.log("📊 Movies by Category:", Object.keys(moviesByCategory).length);
  console.log("📊 Popular Movies by Category:", Object.keys(popularMoviesByCategory).length);

  // ✨ NETFLIX FEATURE: Enhanced loading screen
  if (loading) {
    return (
      <View style={styles.netflixLoadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LinearGradient
          colors={['#000', '#1a1a1a', '#000']}
          style={styles.loadingGradient}
        >
          <View style={styles.netflixLoadingContent}>
            <View style={styles.netflixLoadingLogo}>
              <Text style={styles.netflixLoadingText}>N</Text>
            </View>
            <LoadingSpinner message="Đang tải nội dung..." />
            <Text style={styles.loadingSubtext}>Chuẩn bị trải nghiệm tuyệt vời...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* ✨ NETFLIX FEATURE: Enhanced animated header */}
        <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'transparent']}
            style={styles.headerGradient}
          >
            <HeaderBar
                setMenuVisible={setMenuVisible}
                onSearchPress={handleSearchPress}
                onNotificationPress={handleNotificationPress}
                searchVisible={searchVisible}
                onSearchClose={handleSearchClose}
                onSearchChange={handleSearchChange}
                notificationCount={3}
                userProfile={{
                  name: "User",
                  avatar: null
                }}
            />
          </LinearGradient>
        </Animated.View>

        {/* ✨ NETFLIX FEATURE: Enhanced menu overlay */}
        <MenuOverlay
            visible={menuVisible}
            onSelect={handleMenuSelect}
            onClose={() => setMenuVisible(false)}
            navigation={navigation}
        />

        {/* ✨ NETFLIX FEATURE: Enhanced scroll view */}
        <Animated.ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#E50914"
                  colors={["#E50914"]}
                  progressBackgroundColor="#000"
              />
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
          {/* ✨ NETFLIX FEATURE: Enhanced Hero Section with auto-rotation */}
          {heroMovies.length > 0 && (
              <HeroSection
                  movie={heroMovies[currentHeroIndex]}
                  onPress={handleMoviePress}
                  onAddToWatchlist={handleMoviePress}
                  isAutoPlaying={true}
              />
          )}

          

          {/* ✨ NETFLIX FEATURE: Continue Watching Section */}
          {continueWatching.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="▶️ Tiếp tục xem"
                    subtitle={`${continueWatching.length} video`}
                    icon="play-circle-filled"
                />
                <MovieList
                    movies={continueWatching}
                    handleMoviePress={handleMoviePress}
                    onFavoritesChange={handleFavoritesChange}
                    horizontal={true}
                    showProgress={true}
                />
              </SectionContainer>
          )}

          {/* ✨ NETFLIX FEATURE: Genres Section */}
          <SectionContainer>
            <View style={styles.sectionTitleWithButton}>
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Ionicons name="library-music" size={24} color="#E50914" style={styles.titleIcon} />
                  <Text style={styles.mainTitle}>🎭 Thể loại</Text>
                </View>
                <Text style={styles.subtitle}>{genres.length} thể loại</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('AllMoviesScreen', { 
                  title: 'Tất cả phim',
                  initialGenre: null 
                })}
              >
                <Text style={styles.seeAllButtonText}>Tất cả phim</Text>
                <Ionicons name="chevron-forward" size={16} color="#E50914" />
              </TouchableOpacity>
            </View>
            <GenreList
                genres={genres}
                activeGenre={activeGenre}
                setActiveGenre={handleGenreSelect}
            />
          </SectionContainer>

          {/* ✨ ENHANCED: Main Content Section - Shows search results, filtered movies, or popular content */}
          <SectionContainer>
            <View style={styles.sectionTitleWithButton}>
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Ionicons 
                    name={
                      searchQuery 
                        ? "search" 
                        : activeGenre 
                          ? "film" 
                          : "flame"
                    } 
                    size={24} 
                    color="#E50914" 
                    style={styles.titleIcon} 
                  />
                  <Text style={styles.mainTitle}>
                    {searchQuery 
                      ? `🔍 Kết quả tìm kiếm: "${searchQuery}"` 
                      : activeGenre 
                        ? `🎬 Phim ${activeGenre}` 
                        : "🔥 Nội dung phổ biến"
                    }
                  </Text>
                </View>
                <Text style={styles.subtitle}>
                  {searchQuery 
                    ? `${filteredMovies.length} kết quả tìm thấy`
                    : activeGenre 
                      ? `${filteredMovies.length} phim ${activeGenre.toLowerCase()}` 
                      : `${filteredMovies.length} video`
                  }
                </Text>
              </View>
              {/* ✨ NEW: See All Button */}
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => navigation.navigate('AllMoviesScreen', { 
                    title: activeGenre ? `Phim ${activeGenre}` : 'Tất cả phim',
                    initialGenre: activeGenre 
                  })}
                >
                  <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                  <Ionicons name="chevron-forward" size={16} color="#E50914" />
                </TouchableOpacity>
              )}
            </View>
            {isSearching || loadingGenreMovies ? (
              <View style={styles.emptyState}>
                <LoadingSpinner 
                  message={
                    isSearching 
                      ? `Đang tìm kiếm "${searchQuery}"...` 
                      : `Đang tải phim ${activeGenre}...`
                  } 
                />
              </View>
            ) : filteredMovies.length > 0 ? (
              <MovieList
                  movies={filteredMovies}
                  handleMoviePress={handleMoviePress}
                  onFavoritesChange={handleFavoritesChange}
                  layout="grid"
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery 
                    ? `Không tìm thấy phim nào với từ khóa "${searchQuery}"` 
                    : activeGenre 
                      ? `Không có phim nào trong thể loại "${activeGenre}"` 
                      : "Đang tải nội dung..."
                  }
                </Text>
                {searchQuery && (
                  <Text style={styles.emptyStateSubtext}>
                    Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả
                  </Text>
                )}
              </View>
            )}
          </SectionContainer>

          {/* ✨ ENHANCED: Show trending only when not searching */}
          {!searchQuery && trending.length > 0 && (
              <SectionContainer>
                <View style={styles.sectionTitleWithButton}>
                  <View style={styles.titleSection}>
                    <View style={styles.titleContainer}>
                      <Ionicons name="trending-up" size={24} color="#E50914" style={styles.titleIcon} />
                      <Text style={styles.mainTitle}>🔥 Trending ngay bây giờ</Text>
                    </View>
                    <Text style={styles.subtitle}>{trending.length} video</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate('AllMoviesScreen', { 
                      title: 'Phim Trending',
                      initialGenre: null 
                    })}
                  >
                    <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                    <Ionicons name="chevron-forward" size={16} color="#E50914" />
                  </TouchableOpacity>
                </View>
                <MovieList
                    movies={trending}
                    handleMoviePress={handleMoviePress}
                    onFavoritesChange={handleFavoritesChange}
                    horizontal={true}
                    showRanking={true}
                />
              </SectionContainer>
          )}

          {/* ✨ NETFLIX FEATURE: New & Popular Section */}
          {/* {newAndPopular.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="🆕 Mới & Phổ biến"
                    subtitle={`${newAndPopular.length} video`}
                    icon="new-releases"
                />
                <MovieList
                    movies={newAndPopular}
                    handleMoviePress={handleMoviePress}
                    onFavoritesChange={handleFavoritesChange}
                    horizontal={true}
                    showDateAdded={true}
                />
              </SectionContainer>
          )} */}

          {/* ✨ ENHANCED: Show recommendations only when not searching */}
          {!searchQuery && recommendations.length > 0 && (
              <SectionContainer>
                <View style={styles.sectionTitleWithButton}>
                  <View style={styles.titleSection}>
                    <View style={styles.titleContainer}>
                      <Ionicons name="bulb" size={24} color="#E50914" style={styles.titleIcon} />
                      <Text style={styles.mainTitle}>💡 Đề xuất cho bạn</Text>
                    </View>
                    <Text style={styles.subtitle}>{recommendations.length} video</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate('AllMoviesScreen', { 
                      title: 'Phim đề xuất',
                      initialGenre: null 
                    })}
                  >
                    <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                    <Ionicons name="chevron-forward" size={16} color="#E50914" />
                  </TouchableOpacity>
                </View>
                <MovieList
                    movies={recommendations}
                    handleMoviePress={handleMoviePress}
                    onFavoritesChange={handleFavoritesChange}
                    horizontal={true}
                />
              </SectionContainer>
          )}

          {/* ✨ ENHANCED: Show category sections only when no specific genre is selected and not searching */}
          {!activeGenre && !searchQuery && (
            <>
              {/* ✨ NEW: Movies by Category Sections */}
              {Object.entries(moviesByCategory).map(([categoryName, categoryMovies]) => (
                  <SectionContainer key={`category-${categoryName}`}>
                    <View style={styles.sectionTitleWithButton}>
                      <View style={styles.titleSection}>
                        <View style={styles.titleContainer}>
                          <Ionicons name="library-music" size={24} color="#E50914" style={styles.titleIcon} />
                          <Text style={styles.mainTitle}>🎭 {categoryName}</Text>
                        </View>
                        <Text style={styles.subtitle}>{categoryMovies.length} phim</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => navigation.navigate('AllMoviesScreen', { 
                          title: `Phim ${categoryName}`,
                          initialGenre: categoryName 
                        })}
                      >
                        <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                        <Ionicons name="chevron-forward" size={16} color="#E50914" />
                      </TouchableOpacity>
                    </View>
                    <MovieList
                        movies={categoryMovies}
                        handleMoviePress={handleMoviePress}
                        onFavoritesChange={handleFavoritesChange}
                        horizontal={true}
                    />
                  </SectionContainer>
              ))}

              {/* ✨ NEW: Popular Movies by Category Sections */}
              {Object.entries(popularMoviesByCategory).map(([categoryName, popularMovies]) => (
                  <SectionContainer key={`popular-${categoryName}`}>
                    <View style={styles.sectionTitleWithButton}>
                      <View style={styles.titleSection}>
                        <View style={styles.titleContainer}>
                          <Ionicons name="trending-up" size={24} color="#E50914" style={styles.titleIcon} />
                          <Text style={styles.mainTitle}>🔥 {categoryName} Phổ biến</Text>
                        </View>
                        <Text style={styles.subtitle}>{popularMovies.length} phim hot</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => navigation.navigate('AllMoviesScreen', { 
                          title: `${categoryName} Phổ biến`,
                          initialGenre: categoryName 
                        })}
                      >
                        <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                        <Ionicons name="chevron-forward" size={16} color="#E50914" />
                      </TouchableOpacity>
                    </View>
                    <MovieList
                        movies={popularMovies}
                        handleMoviePress={handleMoviePress}
                        onFavoritesChange={handleFavoritesChange}
                        horizontal={true}
                        showRanking={true}
                    />
                  </SectionContainer>
              ))}
            </>
          )}

          <ItemSeparator height={100} />
        </Animated.ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ✨ NETFLIX FEATURE: Enhanced loading screen
  netflixLoadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingGradient: {
    flex: 1,
  },
  netflixLoadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  netflixLoadingLogo: {
    backgroundColor: '#E50914',
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  netflixLoadingText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  loadingSubtext: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: FONTS.REGULAR,
  },

  // Enhanced header
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerGradient: {
    paddingTop: 40,
  },
  scrollContainer: {
    paddingTop: 0,
  },

  // ✨ NEW: Empty state styles
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    lineHeight: 24,
  },
  emptyStateSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    lineHeight: 20,
    marginTop: 8,
  },

  // ✨ NEW: Section title with button styles
  sectionTitleWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleIcon: {
    marginRight: 10,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: FONTS.BOLD,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: FONTS.REGULAR,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  seeAllButtonText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.MEDIUM,
    marginRight: 4,
  },
});

export default HomeScreen;
