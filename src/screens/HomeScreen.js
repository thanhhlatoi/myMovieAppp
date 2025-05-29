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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

// Import constants
import { COLORS } from '../constants/Colors';
import { FONTS } from '../constants/Fonts';
// Import services
import CategoryService from '../services/CategoryService';
import VideoService from '../services/VideoService';
import AuthService from '../services/AuthService';

// ⭐ FIXED: Đường dẫn import (bỏ khoảng trắng)
import LoadingSpinner from '../components /common/LoadingSpinner';
import SectionContainer from '../components /common/SectionContainer';
import SectionTitle from '../components /common/SectionTitle';
import ItemSeparator from '../components /common/ItemSeparator';

import HeaderBar from '../components /home/HeaderBar';
import HeroSection from '../components /home/HeroSection';
import QuickAccessMenu from '../components /home/QuickAccessMenu';
import GenreList from '../components /home/GenreList';
import MovieList from '../components /home/MovieList';
import StatsSection from '../components /home/StatsSection';
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

  // UI states
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroSlideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Netflix-style auto-rotation for hero
  const heroRotationRef = useRef(null);

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
    };
  }, []);

  // ✨ ENHANCED: Optimized data processing
  useEffect(() => {
    processVideosData();
  }, [videos]);

  useEffect(() => {
    filterMoviesByGenre();
  }, [activeGenre, movies]);

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

      const [genresResponse, videosResponse] = await Promise.all([
        CategoryService.getAllCategories(),
        VideoService.getAllVideos(0, 20)
      ]);

      console.log("✅ API responses received");
      handleGenresData(genresResponse);
      handleVideosData(videosResponse);

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

  // ✨ ENHANCED: Convert function với optimization
  const convertVideoToMovie = (video) => {
    if (!video) {
      console.warn("⚠️ Video is null/undefined in convertVideoToMovie");
      return null;
    }

    console.log("🔄 Converting video:", video.id, video.movieProduct ? "has movieProduct" : "video-only");

    // Nếu có movieProduct, ưu tiên sử dụng
    if (video.movieProduct) {
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
    }

    // Fallback: Tạo movie object từ video data
    const fallbackMovie = {
      id: video.id,
      title: `Video ${video.id}`,
      description: `Video được upload vào ${new Date(video.watchedAt).toLocaleDateString()}`,
      imgMovie: null,
      views: 0,
      likes: 0,
      time: 0,
      year: new Date(video.watchedAt).getFullYear(),
      // Video-specific data
      _videoData: video,
      _hasVideo: true,
      _isVideoOnly: true,
      _videoFilm: video.videoFilm,
      _fileSize: video.fileSize,
      _status: video.status,
      _qualities: video.availableQualities,
      _watchedAt: video.watchedAt
    };

    console.log("⚠️ Created fallback movie for video-only:", fallbackMovie.id, fallbackMovie.title);
    return fallbackMovie;
  };

  // Filter movies by genre
  const filterMoviesByGenre = () => {
    if (activeGenre && activeGenre !== 'Tất cả') {
      const filtered = movies.filter(movie => {
        const movieCategories = movie.categories || [];
        return movieCategories.some(cat =>
          cat.name?.toLowerCase().includes(activeGenre.toLowerCase())
        );
      });
      console.log("🔍 Genre filter applied:", activeGenre);
      console.log("🔍 Filtered movies:", filtered.length);
      setFilteredMovies(filtered);
    } else {
      console.log("🔍 No genre filter, showing all movies");
      setFilteredMovies(movies);
    }
  };

  // Event handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGenreSelect = (genreName) => {
    console.log("🎭 Genre selected:", genreName);
    setActiveGenre(activeGenre === genreName ? null : genreName);
  };

  const handleMoviePress = async (movieId) => {
    try {
      console.log("🎬 Opening movie/video with ID:", movieId);

      // Tìm movie và video tương ứng
      const movie = movies.find(m => m.id === movieId);
      const video = movie?._videoData;

      console.log("🎬 Found movie:", movie?.title);
      console.log("🎬 Found video:", video?.id);

      if (movie && video) {
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
        console.warn("Movie or video not found for ID:", movieId);
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
    console.log("🔍 Search deactivated");
  };

  const handleSearchChange = (query) => {
    console.log("🔍 Search query:", query);
    // Implement search logic here
    if (query.trim()) {
      const searchResults = movies.filter(movie =>
        movie.title?.toLowerCase().includes(query.toLowerCase()) ||
        movie.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMovies(searchResults);
      console.log("🔍 Search results:", searchResults.length);
    } else {
      setFilteredMovies(movies);
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
  console.log("📊 Loading:", loading);

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

          {/* ✨ NETFLIX FEATURE: Quick Access Menu */}
          <QuickAccessMenu
              navigation={navigation}
              onTrendingPress={() => console.log("Trending")}
              onTopRatedPress={() => console.log("Top Rated")}
              onFavoritesPress={() => {
                console.log("🎬 Navigating to Favorites");
                navigation.navigate('FavoritesScreen');
              }}
              onHistoryPress={() => console.log("History")}
          />

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
            <SectionTitle
                title="🎭 Thể loại"
                subtitle={`${genres.length} thể loại`}
                icon="category"
            />
            <GenreList
                genres={genres}
                activeGenre={activeGenre}
                setActiveGenre={handleGenreSelect}
            />
          </SectionContainer>

          {/* ✨ NETFLIX FEATURE: Main Content Section */}
          <SectionContainer>
            <SectionTitle
                title={activeGenre ? `🎬 ${activeGenre}` : "🔥 Nội dung phổ biến"}
                subtitle={`${filteredMovies.length} video`}
                icon="play-circle-filled"
            />
            <MovieList
                movies={filteredMovies}
                handleMoviePress={handleMoviePress}
                onFavoritesChange={handleFavoritesChange}
                layout="grid"
            />
          </SectionContainer>

          {/* ✨ NETFLIX FEATURE: Trending Section */}
          {trending.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="🔥 Trending ngay bây giờ"
                    subtitle={`${trending.length} video`}
                    icon="trending-up"
                />
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
          {newAndPopular.length > 0 && (
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
          )}

          {/* ✨ NETFLIX FEATURE: Recommendations Section */}
          {recommendations.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="💡 Đề xuất cho bạn"
                    subtitle={`${recommendations.length} video`}
                    icon="recommend"
                />
                <MovieList
                    movies={recommendations}
                    handleMoviePress={handleMoviePress}
                    onFavoritesChange={handleFavoritesChange}
                    horizontal={true}
                />
              </SectionContainer>
          )}

          {/* ✨ NETFLIX FEATURE: Enhanced Stats Section */}
          <StatsSection
            movies={movies}
            videos={videos}
            networkInfo={networkInfo}
          />

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
});

export default HomeScreen;
