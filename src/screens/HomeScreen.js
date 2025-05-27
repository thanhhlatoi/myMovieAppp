import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MovieCard from "../components /MovieCard"; // Import component MovieCard

// Import constants
const COLORS = {
  BASIC_BACKGROUND: '#000000',
  ACTIVE: '#E50914',
  WHITE: '#FFFFFF',
  GRAY: '#808080',
  YELLOW: '#F5C518',
  HEART: '#FF6B6B',
  BLACK: '#000000',
};

const FONTS = {
  REGULAR: 'System',
  BOLD: 'System',
};

// Import services
import CategoryService from "../services/CategoryService";
import MovieService from "../services/MovieService";

// Simple components
const GenreCard = ({ genreName, active, onPress }) => (
    <TouchableOpacity
        style={[
          styles.genreCard,
          active && styles.genreCardActive
        ]}
        onPress={() => onPress(genreName)}
    >
      <Text style={[
        styles.genreText,
        active && styles.genreTextActive
      ]}>
        {genreName}
      </Text>
    </TouchableOpacity>
);

const ItemSeparator = ({ width = 10 }) => (
    <View style={{ width }} />
);

const SearchBar = () => (
    <TouchableOpacity style={styles.searchBar}>
      <Icon name="search" size={20} color={COLORS.GRAY} />
      <Text style={styles.searchText}>Tìm kiếm phim...</Text>
    </TouchableOpacity>
);

const MenuOverlay = ({ visible, onSelect, onClose }) => {
  if (!visible) return null;

  const menuItems = [
    { id: 1, title: '👤 Thông tin cá nhân', action: 'Profile' },
    { id: 2, title: '❤️ Yêu thích', action: 'Favorites' },
    { id: 3, title: '⚙️ Cài đặt', action: 'Settings' },
    { id: 4, title: '🚪 Đăng xuất', action: 'Logout' },
  ];

  return (
      <View style={styles.menuOverlay}>
        <TouchableOpacity style={styles.menuBackdrop} onPress={onClose} />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Menu</Text>
          {menuItems.map(item => (
              <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => onSelect(item.action)}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
          ))}
        </View>
      </View>
  );
};

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter movies based on active genre
    if (activeGenre && movies.length > 0) {
      const filtered = movies.filter(movie =>
          movie.genres?.some(genre => genre.name === activeGenre)
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  }, [activeGenre, movies]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories/genres
      const genresResponse = await CategoryService.getAllCategories();
      const genresData = genresResponse?.data?.content || [];
      setGenres(genresData);

      // Fetch movies
      const moviesResponse = await MovieService.getAllMovies();
      const moviesData = moviesResponse?.data?.content || [];

      console.log("🎬 Movies data:", moviesData); // Debug log

      setMovies(moviesData);
      setFilteredMovies(moviesData);

      // Set featured movie (movie có views cao nhất hoặc phim đầu tiên)
      if (moviesData.length > 0) {
        const featuredMovie = moviesData.reduce((prev, current) =>
            (prev.views > current.views) ? prev : current
        );
        setFeaturedMovie(featuredMovie);
      }

      // Set coming soon movies (có thể filter theo năm hoặc lấy ngẫu nhiên)
      const comingSoon = moviesData.filter(movie =>
          movie.year === "2025" || movie.year === "2024"
      ).slice(0, 5);
      setComingSoonMovies(comingSoon.length > 0 ? comingSoon : moviesData.slice(-5));

    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);

      // Mock data để test nếu API lỗi
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSelectMenuItem = (item) => {
    setMenuVisible(false);
    console.log("Bạn chọn:", item);

    switch(item) {
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
        // Handle logout
        break;
      default:
        break;
    }
  };

  const handleMoviePress = async (movieId) => {
    try {
      console.log("🎬 Opening movie:", movieId);
      const response = await MovieService.getMovieById(movieId);
      navigation.navigate("movie", { movie: response });
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết phim:", error);
      // Fallback: navigate với movie data hiện có
      const movie = movies.find(m => m.id === movieId);
      if (movie) {
        navigation.navigate("movie", { movie });
      }
    }
  };

  const handleGenreSelect = (genreName) => {
    if (activeGenre === genreName) {
      setActiveGenre(null); // Deselect if same genre
    } else {
      setActiveGenre(genreName);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.ACTIVE} />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        {/* Animated Header */}
        <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
          <View style={styles.headerGradient}>
            <HeaderBar setMenuVisible={setMenuVisible} />
          </View>
        </Animated.View>

        {/* Menu Overlay */}
        <MenuOverlay
            visible={menuVisible}
            onSelect={handleSelectMenuItem}
            onClose={() => setMenuVisible(false)}
        />

        <Animated.ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        >
          {/* Hero Section */}
          {featuredMovie && <HeroSection movie={featuredMovie} onPress={handleMoviePress} />}

          {/* Quick Access Menu */}
          <QuickAccessMenu navigation={navigation} />

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
            <MovieList movies={filteredMovies} handleMoviePress={handleMoviePress} />
          </SectionContainer>

          {/* Coming Soon Section */}
          {comingSoonMovies.length > 0 && (
              <SectionContainer>
                <SectionTitle
                    title="⏰ Sắp chiếu"
                    subtitle={`${comingSoonMovies.length} phim`}
                    icon="schedule"
                />
                <MovieList movies={comingSoonMovies} handleMoviePress={handleMoviePress} />
              </SectionContainer>
          )}

          {/* Stats Section */}
          <StatsSection movies={movies} />

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </Animated.ScrollView>
      </View>
  );
};

// Components
const HeaderBar = ({ setMenuVisible }) => (
    <View style={styles.headerBar}>
      <View style={styles.headerLeft}>
        <Text style={styles.appTitle}>🎬 MovieApp</Text>
        <Text style={styles.greeting}>Khám phá điện ảnh</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="notifications" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
        >
          <Icon name="account-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
);

const HeroSection = ({ movie, onPress }) => {
  const imageUri = movie.imgMovie
      ? `http://192.168.0.125:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

  return (
      <View style={styles.heroContainer}>
        <ImageBackground
            source={{ uri: imageUri }}
            style={styles.heroBackground}
            resizeMode="cover"
        >
          <View style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{movie.title}</Text>
              <Text style={styles.heroDescription} numberOfLines={3}>
                {movie.description || "Một bộ phim tuyệt vời đang chờ bạn khám phá..."}
              </Text>

              {/* Movie Stats */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Icon name="visibility" size={16} color="#fff" />
                  <Text style={styles.heroStatText}>{movie.views} lượt xem</Text>
                </View>
                <View style={styles.heroStat}>
                  <Icon name="favorite" size={16} color={COLORS.HEART} />
                  <Text style={styles.heroStatText}>{movie.likes} lượt thích</Text>
                </View>
                <View style={styles.heroStat}>
                  <Icon name="access-time" size={16} color="#fff" />
                  <Text style={styles.heroStatText}>{movie.time} phút</Text>
                </View>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => onPress(movie.id)}
                >
                  <Icon name="play-arrow" size={24} color="#fff" />
                  <Text style={styles.playButtonText}>Xem ngay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton}>
                  <Icon name="add" size={24} color="#fff" />
                  <Text style={styles.addButtonText}>Danh sách</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
  );
};

const QuickAccessMenu = ({ navigation }) => (
    <View style={styles.quickAccessContainer}>
      <TouchableOpacity style={styles.quickAccessItem}>
        <Icon name="trending-up" size={30} color={COLORS.ACTIVE} />
        <Text style={styles.quickAccessText}>Thịnh hành</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAccessItem}>
        <Icon name="star" size={30} color={COLORS.YELLOW} />
        <Text style={styles.quickAccessText}>Đánh giá cao</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAccessItem}>
        <Icon name="favorite" size={30} color={COLORS.HEART} />
        <Text style={styles.quickAccessText}>Yêu thích</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAccessItem}>
        <Icon name="history" size={30} color="#4ECDC4" />
        <Text style={styles.quickAccessText}>Đã xem</Text>
      </TouchableOpacity>
    </View>
);

const SectionContainer = ({ children }) => (
    <View style={styles.sectionContainer}>
      {children}
    </View>
);

const SectionTitle = ({ title, subtitle, icon, onPress }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {icon && <Icon name={icon} size={24} color={COLORS.ACTIVE} style={styles.sectionIcon} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {subtitle && (
          <TouchableOpacity onPress={onPress} style={styles.sectionSubtitleContainer}>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            <Icon name="chevron-right" size={20} color={COLORS.ACTIVE} />
          </TouchableOpacity>
      )}
    </View>
);

const GenreList = ({ genres, activeGenre, setActiveGenre }) => (
    <View style={styles.genreListContainer}>
      <FlatList
          data={genres}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.name}-${index}-${item.id}`}
          ItemSeparatorComponent={() => <ItemSeparator width={12} />}
          ListHeaderComponent={() => <ItemSeparator width={20} />}
          ListFooterComponent={() => <ItemSeparator width={20} />}
          renderItem={({ item }) => (
              <GenreCard
                  genreName={item.name}
                  active={item.name === activeGenre}
                  onPress={setActiveGenre}
              />
          )}
      />
    </View>
);

const MovieList = ({ movies, handleMoviePress }) => (
    <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ItemSeparatorComponent={() => <ItemSeparator width={15} />}
        ListHeaderComponent={() => <ItemSeparator width={20} />}
        ListFooterComponent={() => <ItemSeparator width={20} />}
        renderItem={({ item }) => (
            <MovieCard
                movie={item}
                onPress={() => handleMoviePress(item.id)}
                heartLess={false}
            />
        )}
    />
);

const StatsSection = ({ movies }) => {
  const totalViews = movies.reduce((sum, movie) => sum + (movie.views || 0), 0);
  const totalLikes = movies.reduce((sum, movie) => sum + (movie.likes || 0), 0);

  return (
      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>📊 Thống kê</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{movies.length}</Text>
            <Text style={styles.statLabel}>Tổng phim</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalViews}</Text>
            <Text style={styles.statLabel}>Lượt xem</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalLikes}</Text>
            <Text style={styles.statLabel}>Lượt thích</Text>
          </View>
        </View>
      </View>
  );
};

// Styles (giữ nguyên từ phiên bản trước và thêm styles mới)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontFamily: FONTS.REGULAR,
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: FONTS.BOLD,
  },
  greeting: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
    padding: 5,
  },
  menuButton: {
    marginLeft: 10,
  },
  heroContainer: {
    height: height * 0.6,
    marginBottom: 20,
  },
  heroBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    fontFamily: FONTS.BOLD,
  },
  heroDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 15,
    fontFamily: FONTS.REGULAR,
  },
  heroStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  heroStatText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
    fontFamily: FONTS.REGULAR,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ACTIVE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 15,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    fontFamily: FONTS.BOLD,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
    fontFamily: FONTS.REGULAR,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  quickAccessItem: {
    alignItems: 'center',
  },
  quickAccessText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONTS.REGULAR,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: FONTS.BOLD,
  },
  sectionSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.ACTIVE,
    marginRight: 5,
    fontFamily: FONTS.BOLD,
  },
  genreListContainer: {
    paddingVertical: 5,
  },
  bottomPadding: {
    height: 100,
  },
  // Genre Card Styles
  genreCard: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genreCardActive: {
    backgroundColor: COLORS.ACTIVE,
    borderColor: COLORS.ACTIVE,
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
  },
  genreTextActive: {
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  // Search Bar Styles
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10,
  },
  searchText: {
    color: COLORS.GRAY,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
  },
  // Menu Overlay Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContent: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontFamily: FONTS.BOLD,
  },
  menuItem: {
    padding: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: FONTS.REGULAR,
  },
  // Stats Section
  statsSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.ACTIVE,
    fontFamily: FONTS.BOLD,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    fontFamily: FONTS.REGULAR,
  },
});

export default HomeScreen;
