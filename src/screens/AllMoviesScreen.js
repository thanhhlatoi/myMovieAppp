import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Import constants
import { FONTS } from '../constants/Fonts';

// Import services
import MovieService from '../services/MovieService';
import CategoryService from '../services/CategoryService';
import VideoService from '../services/VideoService';

// Import components
import LoadingSpinner from '../components /common/LoadingSpinner';
import MovieCard from '../components /MovieCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ITEM_WIDTH = (screenWidth - 60) / 2; // 2 columns with padding

const AllMoviesScreen = ({ navigation, route }) => {
  // Get initial filter from route params
  const { initialGenre, title = "Tất cả phim" } = route.params || {};

  // State management
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre || null);
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, title, year
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);
  const PAGE_SIZE = 20;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [movies, searchQuery, selectedGenre, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGenres(),
        loadMovies(0, true)
      ]);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const response = await CategoryService.getAllCategories();
      const genresData = response?.data?.content || [];
      setGenres([
        { id: 'all', name: 'Tất cả' },
        ...genresData
      ]);
    } catch (error) {
      console.error('❌ Error loading genres:', error);
    }
  };

  const loadMovies = async (page = 0, reset = false) => {
    try {
      if (reset) {
        setCurrentPage(0);
        setHasMorePages(true);
      }

      // Load from multiple sources
      const [moviesResponse, videosResponse] = await Promise.all([
        MovieService.getAllMovies(page, PAGE_SIZE),
                  page === 0 ? VideoService.getVideosWithMovieProduct(0, PAGE_SIZE) : Promise.resolve(null) // ✨ FILTERED: Only videos with movieProduct
      ]);

      // Process movies from API
      const apiMovies = moviesResponse?.data?.content || [];
      
      // Process videos and convert to movies if needed
      let videoMovies = [];
      if (videosResponse) {
        const videos = videosResponse?.data?.content || [];
        videoMovies = videos.map(convertVideoToMovie).filter(Boolean);
      }

      // Combine all movies
      const allNewMovies = [...apiMovies, ...(page === 0 ? videoMovies : [])];
      
      // Remove duplicates based on ID
      const uniqueMovies = allNewMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );

      if (reset) {
        setMovies(uniqueMovies);
      } else {
        setMovies(prev => {
          const combined = [...prev, ...uniqueMovies];
          return combined.filter((movie, index, self) =>
            index === self.findIndex(m => m.id === movie.id)
          );
        });
      }

      // Update pagination
      setCurrentPage(page);
      setHasMorePages(apiMovies.length >= PAGE_SIZE);

      console.log(`📊 Loaded ${uniqueMovies.length} movies (page ${page})`);
      
    } catch (error) {
      console.error('❌ Error loading movies:', error);
      throw error;
    }
  };

  const convertVideoToMovie = (video) => {
    if (!video) return null;

    if (video.movieProduct) {
      return {
        ...video.movieProduct,
        _videoData: video,
        _hasVideo: true,
        _isFromVideo: true
      };
    }

    return {
      id: video.id,
      title: `Video ${video.id}`,
      description: `Video được upload vào ${new Date(video.watchedAt || Date.now()).toLocaleDateString()}`,
      imgMovie: null,
      views: 0,
      likes: 0,
      time: 0,
      year: new Date(video.watchedAt || Date.now()).getFullYear(),
      _videoData: video,
      _hasVideo: true,
      _isVideoOnly: true,
      _isFromVideo: true
    };
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...movies];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(movie =>
        movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply genre filter
    if (selectedGenre && selectedGenre !== 'all') {
      filtered = filtered.filter(movie => {
        const movieCategories = movie.categories || [];
        return movieCategories.some(cat =>
          cat.name?.toLowerCase().includes(selectedGenre.toLowerCase())
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'latest':
        default:
          const aDate = new Date(a.createdAt || a._videoData?.watchedAt || 0);
          const bDate = new Date(b.createdAt || b._videoData?.watchedAt || 0);
          return bDate - aDate;
      }
    });

    setFilteredMovies(filtered);
  }, [movies, searchQuery, selectedGenre, sortBy]);

  const handleMoviePress = async (movieId) => {
    try {
      console.log('🎬 Opening movie with ID:', movieId);

      const movie = movies.find(m => m.id === movieId);
      const video = movie?._videoData;

      if (movie) {
        // Track movie view
        try {
          await MovieService.watchMovie(movieId);
        } catch (error) {
          console.warn('Could not track movie view:', error);
        }

        if (video) {
          if (movie._isVideoOnly) {
            navigation.navigate('VideoPlayerScreen', {
              videoId: video.id,
              movie: movie,
              movieTitle: movie.title
            });
          } else {
            navigation.navigate('movie', {
              movie: movie,
              video: video
            });
          }
        } else {
          navigation.navigate('movie', {
            movie: movie
          });
        }
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy phim này.');
      }
    } catch (error) {
      console.error('❌ Error opening movie:', error);
      Alert.alert('Lỗi', 'Không thể mở phim này. Vui lòng thử lại.');
    }
  };

  const handleFavoritesChange = useCallback((movieId, isFavorite) => {
    console.log(`💖 AllMoviesScreen: Movie ${movieId} favorite status changed to ${isFavorite}`);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePages) {
      setLoadingMore(true);
      loadMovies(currentPage + 1, false)
        .finally(() => setLoadingMore(false));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMovies(0, true)
      .finally(() => setRefreshing(false));
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleGenreSelect = (genreId, genreName) => {
    setSelectedGenre(genreId === 'all' ? null : genreName);
    setShowFilterModal(false);
  };

  const handleSortSelect = (sortOption) => {
    setSortBy(sortOption);
    setShowFilterModal(false);
  };

  const renderMovie = ({ item, index }) => (
    <View style={styles.movieItem}>
      <MovieCard
        movie={item}
        onPress={() => handleMoviePress(item.id)}
        heartLess={false}
        style={{ width: ITEM_WIDTH }}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phim..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter and Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="funnel" size={16} color="#fff" />
          <Text style={styles.filterButtonText}>
            {selectedGenre || 'Tất cả'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="swap-vertical" size={16} color="#fff" />
          <Text style={styles.sortButtonText}>
            {sortBy === 'latest' ? 'Mới nhất' :
             sortBy === 'popular' ? 'Phổ biến' :
             sortBy === 'title' ? 'Tên A-Z' : 'Năm'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredMovies.length} phim
        {searchQuery ? ` cho "${searchQuery}"` : ''}
        {selectedGenre ? ` trong thể loại ${selectedGenre}` : ''}
      </Text>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lọc và sắp xếp</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Genre Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Thể loại</Text>
            <FlatList
              data={genres}
              numColumns={2}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.genreChip,
                    (selectedGenre === item.name || (!selectedGenre && item.id === 'all')) && styles.genreChipActive
                  ]}
                  onPress={() => handleGenreSelect(item.id, item.name)}
                >
                  <Text style={[
                    styles.genreChipText,
                    (selectedGenre === item.name || (!selectedGenre && item.id === 'all')) && styles.genreChipTextActive
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
            {[
              { key: 'latest', label: 'Mới nhất' },
              { key: 'popular', label: 'Phổ biến nhất' },
              { key: 'title', label: 'Tên A-Z' },
              { key: 'year', label: 'Năm phát hành' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => handleSortSelect(option.key)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={16} color="#E50914" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <LoadingSpinner message="Đang tải thêm phim..." />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="film-outline" size={64} color="#666" />
      <Text style={styles.emptyStateTitle}>Không tìm thấy phim nào</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? `Không có phim nào khớp với "${searchQuery}"`
          : selectedGenre
          ? `Không có phim nào trong thể loại "${selectedGenre}"`
          : 'Chưa có phim nào được tải lên'
        }
      </Text>
      {(searchQuery || selectedGenre) && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedGenre(null);
          }}
        >
          <Text style={styles.clearFiltersButtonText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LinearGradient colors={['#000', '#1a1a1a']} style={styles.loadingGradient}>
          <LoadingSpinner message="Đang tải danh sách phim..." />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with back button */}
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'transparent']}
        style={styles.headerContainer}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <FlatList
        data={filteredMovies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.moviesList}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
            colors={["#E50914"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 10,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  screenTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.48,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: FONTS.MEDIUM,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.48,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: FONTS.MEDIUM,
  },
  resultsCount: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    marginBottom: 10,
  },
  moviesList: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  movieItem: {
    flex: 0.5,
    paddingHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.MEDIUM,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginBottom: 15,
  },
  genreChip: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    margin: 5,
    flex: 0.48,
  },
  genreChipActive: {
    backgroundColor: '#E50914',
  },
  genreChipText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    textAlign: 'center',
  },
  genreChipTextActive: {
    color: '#fff',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  sortOptionActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
  },
  sortOptionText: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
  },
  sortOptionTextActive: {
    color: '#E50914',
    fontWeight: '600',
  },
});

export default AllMoviesScreen; 