// 📄 src/screens/HomeScreen.js - Đã được refactor và clean
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import constants
import { COLORS } from '../constants/Colors';
// Import services
import CategoryService from '../services/CategoryService';
import MovieService from '../services/MovieService';

// Import components
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

const HomeScreen = ({ navigation }) => {
  // State management
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMoviesByGenre();
  }, [activeGenre, movies]);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);

      const [genresResponse, moviesResponse] = await Promise.all([
        CategoryService.getAllCategories(),
        MovieService.getAllMovies()
      ]);

      handleGenresData(genresResponse);
      handleMoviesData(moviesResponse);

    } catch (error) {
      handleFetchError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenresData = (response) => {
    const genresData = response?.data?.content || [];
    setGenres(genresData);
  };

  const handleMoviesData = (response) => {
    const moviesData = response?.data?.content || [];

    setMovies(moviesData);
    setFilteredMovies(moviesData);

    // Set featured movie (highest views)
    if (moviesData.length > 0) {
      const featured = moviesData.reduce((prev, current) =>
          (prev.views > current.views) ? prev : current
      );
      setFeaturedMovie(featured);
    }

    // Set coming soon movies
    const comingSoon = moviesData
        .filter(movie => movie.year === "2025" || movie.year === "2024")
        .slice(0, 5);
    setComingSoonMovies(comingSoon.length > 0 ? comingSoon : moviesData.slice(-5));
  };

  const handleFetchError = (error) => {
    console.error("❌ Lỗi khi tải dữ liệu:", error);

    // Show user-friendly error
    Alert.alert(
        "Lỗi tải dữ liệu",
        "Không thể tải dữ liệu phim. Vui lòng thử lại sau.",
        [
          { text: "Thử lại", onPress: () => fetchData() },
          { text: "Hủy", style: "cancel" }
        ]
    );

    // Mock data for testing
    const mockMovies = [
      {
        id: 1,
        title: "Test Movie 1",
        description: "Test description",
        likes: 100,
        views: 1000,
        year: "2024",
        time: "120",
        imgMovie: "",
        genres: [{ name: "Action" }],
        category: { name: "Popular" }
      }
    ];
    setMovies(mockMovies);
    setFilteredMovies(mockMovies);
    setFeaturedMovie(mockMovies[0]);
  };

  // Filter logic
  const filterMoviesByGenre = () => {
    if (activeGenre && movies.length > 0) {
      const filtered = movies.filter(movie =>
          movie.genres?.some(genre => genre.name === activeGenre)
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  };

  // Event handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGenreSelect = (genreName) => {
    setActiveGenre(activeGenre === genreName ? null : genreName);
  };

  const handleMoviePress = async (movieId) => {
    try {
      console.log("🎬 Opening movie:", movieId);
      const response = await MovieService.getMovieById(movieId);
      navigation.navigate("movie", { movie: response });
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết phim:", error);
      const movie = movies.find(m => m.id === movieId);
      if (movie) {
        navigation.navigate("movie", { movie });
      }
    }
  };

  const handleMenuSelect = (action) => {
    setMenuVisible(false);
    console.log("Menu action:", action);

    switch(action) {
      case 'Profile':
        // navigation.navigate('Profile');
        break;
      case 'Favorites':
        // navigation.navigate('Favorites');
        break;
      case 'Settings':
        // navigation.navigate('Settings');
        break;
      case 'Logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
        "Đăng xuất",
        "Bạn có chắc chắn muốn đăng xuất?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng xuất", onPress: () => {
              // Handle logout logic
              console.log("User logged out");
            }}
        ]
    );
  };

  // Quick access handlers
  const handleTrending = () => {
    console.log("Navigate to trending");
    // navigation.navigate('Trending');
  };

  const handleTopRated = () => {
    console.log("Navigate to top rated");
    // navigation.navigate('TopRated');
  };

  const handleFavorites = () => {
    console.log("Navigate to favorites");
    // navigation.navigate('Favorites');
  };

  const handleHistory = () => {
    console.log("Navigate to watch history");
    // navigation.navigate('History');
  };

  const handleSearch = () => {
    console.log("Navigate to search");
    // navigation.navigate('Search');
  };

  const handleNotification = () => {
    console.log("Navigate to notifications");
    // navigation.navigate('Notifications');
  };

  const handleAddToWatchlist = () => {
    console.log("Add to watchlist");
    Alert.alert("Thành công", "Đã thêm vào danh sách xem sau");
  };

  // Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Đang tải phim..." />;
  }

  return (
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        {/* Animated Header */}
        <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
          <View style={styles.headerGradient}>
            <HeaderBar
                setMenuVisible={setMenuVisible}
                onSearchPress={handleSearch}
                onNotificationPress={handleNotification}
            />
          </View>
        </Animated.View>

        {/* Menu Overlay */}
        <MenuOverlay
            visible={menuVisible}
            onSelect={handleMenuSelect}
            onClose={() => setMenuVisible(false)}
        />

        {/* Main Content */}
        <Animated.ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.ACTIVE}
              />
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
          {/* Hero Section */}
          {featuredMovie && (
              <HeroSection
                  movie={featuredMovie}
                  onPress={handleMoviePress}
                  onAddToWatchlist={handleAddToWatchlist}
              />
          )}

          {/* Quick Access Menu */}
          <QuickAccessMenu
              navigation={navigation}
              onTrendingPress={handleTrending}
              onTopRatedPress={handleTopRated}
              onFavoritesPress={handleFavorites}
              onHistoryPress={handleHistory}
          />

          {/* Genres Section */}
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

          {/* Current Movies Section */}
          <SectionContainer>
            <SectionTitle
                title={activeGenre ? `🎬 ${activeGenre}` : "🔥 Tất cả phim"}
                subtitle={`${filteredMovies.length} phim`}
                icon="play-circle-filled"
            />
            <MovieList
                movies={filteredMovies}
                handleMoviePress={handleMoviePress}
            />
          </SectionContainer>

          {/* Coming Soon Section */}
          {comingSoonMovies.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="⏰ Sắp chiếu"
                    subtitle={`${comingSoonMovies.length} phim`}
                    icon="schedule"
                />
                <MovieList
                    movies={comingSoonMovies}
                    handleMoviePress={handleMoviePress}
                />
              </SectionContainer>
          )}

          {/* Stats Section */}
          <StatsSection movies={movies} />

          {/* Bottom Padding */}
          <ItemSeparator height={100} />
        </Animated.ScrollView>
      </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BASIC_BACKGROUND,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerGradient: {
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scrollContainer: {
    paddingTop: 0,
  },
});

export default HomeScreen;
