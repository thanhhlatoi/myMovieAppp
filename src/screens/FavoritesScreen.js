// 📄 src/screens/FavoritesScreen.js - Netflix-Style Enhanced Favorites with Real API
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    TextInput,
    Animated,
    Image,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    ImageBackground,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONTS } from '../constants/Fonts';
import { COLORS } from '../constants/Colors';
import FavoriteService from '../services/FavoriteService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
    const [favorites, setFavorites] = useState([]);
    const [filteredFavorites, setFilteredFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // recent, name, year, rating
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [selectedItems, setSelectedItems] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [error, setError] = useState(null);
    
    // ✨ NETFLIX FEATURES
    const [searchVisible, setSearchVisible] = useState(false);
    const [categories, setCategories] = useState(['Tất cả', 'Phim lẻ', 'Phim bộ', 'Hoạt hình']);
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [stats, setStats] = useState({ total: 0, shown: 0, averageRating: 0 });
    
    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const searchAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    // Header animation
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.8],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        fetchFavorites();
    }, []);

    useEffect(() => {
        filterAndSortMovies();
    }, [favorites, searchText, sortBy, activeCategory]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get user favorites from paginated API
            const favoritesResponse = await FavoriteService.getUserFavoritesPaginated(null, 0, 50);
            
            // Transform API response to match app data structure
            const transformedFavorites = favoritesResponse.map(item => 
                FavoriteService.transformFavoriteResponse(item)
            );
            
            setFavorites(transformedFavorites);
            
            // Update stats
            setStats({
                total: transformedFavorites.length,
                shown: transformedFavorites.length,
                averageRating: transformedFavorites.length > 0 
                    ? Math.round(transformedFavorites.reduce((sum, movie) => sum + movie.rating, 0) / transformedFavorites.length * 10) / 10
                    : 0
            });
            
            console.log('✅ Favorites loaded successfully:', transformedFavorites.length, 'items');
            
        } catch (error) {
            console.error('❌ Error fetching favorites:', error);
            setError(error.message);
            Alert.alert('Lỗi', `Không thể tải danh sách yêu thích: ${error.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterAndSortMovies = () => {
        let filtered = favorites;

        // Filter by category
        if (activeCategory !== 'Tất cả') {
            filtered = filtered.filter(movie => movie.category === activeCategory);
        }

        // Filter by search text
        if (searchText) {
            filtered = filtered.filter(movie =>
                movie.title.toLowerCase().includes(searchText.toLowerCase()) ||
                movie.genre.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Sort movies
        switch (sortBy) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
            case 'name':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'year':
                filtered.sort((a, b) => parseInt(b.year) - parseInt(a.year));
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
        }

        setFilteredFavorites(filtered);
        setStats(prev => ({ ...prev, shown: filtered.length }));
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFavorites();
    };

    const handleMoviePress = (movie) => {
        if (isSelectionMode) {
            toggleSelection(movie.id);
        } else {
            // Navigate to MovieScreen with the movie data
            navigation.navigate('MovieScreen', { 
                movie: {
                    id: movie.id,
                    title: movie.title,
                    year: movie.year,
                    description: movie.description,
                    imgMovie: movie.poster,
                    time: movie.duration,
                    views: 1000, // Default views
                    likes: 100, // Default likes
                    dislikes: 10 // Default dislikes
                }
            });
        }
    };

    const handleLongPress = (movieId) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedItems([movieId]);
            
            // Haptic feedback animation
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.8,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
        }
    };

    const toggleSelection = (movieId) => {
        setSelectedItems(prev => {
            if (prev.includes(movieId)) {
                const newSelection = prev.filter(id => id !== movieId);
                if (newSelection.length === 0) {
                    setIsSelectionMode(false);
                }
                return newSelection;
            } else {
                return [...prev, movieId];
            }
        });
    };

    const selectAll = () => {
        if (selectedItems.length === filteredFavorites.length) {
            setSelectedItems([]);
            setIsSelectionMode(false);
        } else {
            setSelectedItems(filteredFavorites.map(movie => movie.id));
        }
    };

    const removeFromFavorites = async (movieIds) => {
        Alert.alert(
            'Xóa khỏi yêu thích',
            `Bạn có chắc chắn muốn xóa ${movieIds.length} bộ phim khỏi danh sách yêu thích?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Remove each favorite using favoriteId
                            for (const movieId of movieIds) {
                                const movie = favorites.find(f => f.id === movieId);
                                if (movie && movie.favoriteId) {
                                    await FavoriteService.removeFavorite(movie.favoriteId);
                                }
                            }

                            // Update local state
                            setFavorites(prev => prev.filter(movie => !movieIds.includes(movie.id)));
                            setSelectedItems([]);
                            setIsSelectionMode(false);

                            Alert.alert('Thành công', `Đã xóa ${movieIds.length} phim khỏi danh sách yêu thích`);
                        } catch (error) {
                            console.error('Error removing favorites:', error);
                            Alert.alert('Lỗi', 'Không thể xóa phim khỏi danh sách yêu thích');
                        }
                    }
                }
            ]
        );
    };

    const cancelSelection = () => {
        setSelectedItems([]);
        setIsSelectionMode(false);
    };

    // ✨ NETFLIX FEATURE: Enhanced search animation
    const toggleSearch = () => {
        if (searchVisible) {
            Animated.timing(searchAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setSearchVisible(false);
                setSearchText('');
            });
        } else {
            setSearchVisible(true);
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const getSortTitle = () => {
        switch (sortBy) {
            case 'recent': return 'Gần đây';
            case 'name': return 'Tên A-Z';
            case 'year': return 'Năm sản xuất';
            case 'rating': return 'Đánh giá';
            default: return 'Sắp xếp';
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Hôm qua';
            if (diffDays <= 7) return `${diffDays} ngày trước`;
            if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} tuần trước`;
            return `${Math.ceil(diffDays / 30)} tháng trước`;
        } catch {
            return 'Không xác định';
        }
    };

    // ✨ NETFLIX FEATURE: Toggle favorite function for heart icon
    const toggleMovieFavorite = async (movie) => {
        try {
            await FavoriteService.toggleFavorite(movie.movieProductId || movie.id);
            
            // Refresh the favorites list
            fetchFavorites();
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Lỗi', `Không thể cập nhật: ${error.message}`);
        }
    };

    // ✨ NETFLIX FEATURE: Enhanced header with real stats
    const renderNetflixHeader = () => (
        <Animated.View style={[styles.netflixHeader, { opacity: headerOpacity }]}>
            {/* Background gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'transparent']}
                style={styles.headerGradient}
            >
                {/* Top controls */}
                <View style={styles.headerControls}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.headerButton}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Danh sách yêu thích</Text>
                    
                    <TouchableOpacity
                        onPress={toggleSearch}
                        style={styles.headerButton}
                    >
                        <Icon name="search" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                {searchVisible && (
                    <Animated.View style={[styles.searchContainer, { opacity: searchAnim }]}>
                        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm phim, thể loại..."
                            placeholderTextColor="#999"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus={true}
                        />
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Icon name="clear" size={20} color="#999" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Real-time Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Tổng số</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.shown}</Text>
                        <Text style={styles.statLabel}>Đang hiển thị</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.averageRating}</Text>
                        <Text style={styles.statLabel}>Điểm TB</Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    // ✨ NETFLIX FEATURE: Enhanced controls with error state
    const renderControls = () => (
        <View style={styles.controlsContainer}>
            {/* Category tabs */}
            <View style={styles.categoryContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.categoryTab,
                                activeCategory === item && styles.categoryTabActive
                            ]}
                            onPress={() => setActiveCategory(item)}
                        >
                            <Text style={[
                                styles.categoryText,
                                activeCategory === item && styles.categoryTextActive
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Action controls */}
            <View style={styles.actionControls}>
                {isSelectionMode ? (
                    <View style={styles.selectionControls}>
                        <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
                            <Icon name="select-all" size={20} color="#E50914" />
                            <Text style={styles.selectionText}>
                                {selectedItems.length === filteredFavorites.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => removeFromFavorites(selectedItems)}
                            style={styles.selectionButton}
                            disabled={selectedItems.length === 0}
                        >
                            <Icon name="delete" size={20} color="#E50914" />
                            <Text style={styles.selectionText}>Xóa ({selectedItems.length})</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={cancelSelection} style={styles.selectionButton}>
                            <Icon name="close" size={20} color="#999" />
                            <Text style={[styles.selectionText, { color: '#999' }]}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.normalControls}>
                        <TouchableOpacity 
                            onPress={() => setShowSortModal(true)}
                            style={styles.controlButton}
                        >
                            <Icon name="sort" size={20} color="#E50914" />
                            <Text style={styles.controlText}>{getSortTitle()}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            style={styles.controlButton}
                        >
                            <Icon 
                                name={viewMode === 'grid' ? 'view-list' : 'view-module'} 
                                size={20} 
                                color="#E50914" 
                            />
                            <Text style={styles.controlText}>
                                {viewMode === 'grid' ? 'Danh sách' : 'Lưới'}
                            </Text>
                        </TouchableOpacity>

                        {/* Refresh button */}
                        <TouchableOpacity 
                            onPress={fetchFavorites}
                            style={styles.controlButton}
                            disabled={loading}
                        >
                            <Icon name="refresh" size={20} color="#E50914" />
                            <Text style={styles.controlText}>Làm mới</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    const renderMovieItem = ({ item }) => {
        if (viewMode === 'grid') {
            return (
                <NetflixMovieGridItem
                    movie={item}
                    isSelected={selectedItems.includes(item.id)}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleMoviePress(item)}
                    onLongPress={() => handleLongPress(item.id)}
                    onToggleFavorite={() => toggleMovieFavorite(item)}
                />
            );
        } else {
            return (
                <NetflixMovieListItem
                    movie={item}
                    isSelected={selectedItems.includes(item.id)}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleMoviePress(item)}
                    onLongPress={() => handleLongPress(item.id)}
                    onToggleFavorite={() => toggleMovieFavorite(item)}
                />
            );
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['#1a1a1a', '#000']}
                style={styles.emptyGradient}
            >
                {error ? (
                    <>
                        <Icon name="error-outline" size={80} color="#E50914" />
                        <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
                        <Text style={styles.emptySubtitle}>{error}</Text>
                        <TouchableOpacity 
                            style={styles.exploreButton}
                            onPress={fetchFavorites}
                        >
                            <LinearGradient
                                colors={['#E50914', '#B20710']}
                                style={styles.exploreGradient}
                            >
                                <Icon name="refresh" size={20} color="#fff" />
                                <Text style={styles.exploreText}>Thử lại</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Icon name="favorite-border" size={80} color="#333" />
                        <Text style={styles.emptyTitle}>
                            {searchText ? 'Không tìm thấy kết quả' : 'Chưa có phim yêu thích'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchText 
                                ? `Không có phim nào phù hợp với "${searchText}"`
                                : 'Thêm phim vào danh sách yêu thích để xem tại đây'
                            }
                        </Text>
                        {!searchText && (
                            <TouchableOpacity 
                                style={styles.exploreButton}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <LinearGradient
                                    colors={['#E50914', '#B20710']}
                                    style={styles.exploreGradient}
                                >
                                    <Icon name="explore" size={20} color="#fff" />
                                    <Text style={styles.exploreText}>Khám phá ngay</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </LinearGradient>
        </View>
    );

    // Netflix-style loading
    if (loading && favorites.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
                <LinearGradient
                    colors={['#000', '#1a1a1a', '#000']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            {renderNetflixHeader()}
            {renderControls()}

            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                <FlatList
                    data={filteredFavorites}
                    renderItem={renderMovieItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode}
                    contentContainerStyle={styles.listContainer}
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
                    ListEmptyComponent={renderEmpty}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            </Animated.View>

            {/* Sort Modal */}
            <SortModal
                visible={showSortModal}
                currentSort={sortBy}
                onSelect={(sort) => {
                    setSortBy(sort);
                    setShowSortModal(false);
                }}
                onClose={() => setShowSortModal(false)}
            />

            {/* Loading overlay */}
            {loading && favorites.length > 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E50914" />
                </View>
            )}
        </View>
    );
};

// Sub Components with enhanced favorite toggle
const NetflixMovieGridItem = ({ movie, isSelected, isSelectionMode, onPress, onLongPress, onToggleFavorite }) => (
    <TouchableOpacity
        style={[
            styles.netflixGridItem,
            isSelected && styles.selectedItem
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
    >
        <View style={styles.netflixPosterContainer}>
            <Image source={{ uri: movie.poster }} style={styles.netflixPoster} />
            
            {/* Netflix-style badges */}
            <View style={styles.netflixBadges}>
                {movie.isNew && (
                    <View style={styles.newBadge}>
                        <Text style={styles.badgeText}>MỚI</Text>
                    </View>
                )}
                {movie.isHD && (
                    <View style={styles.hdBadge}>
                        <Text style={styles.badgeText}>HD</Text>
                    </View>
                )}
            </View>

            {/* Favorite heart icon */}
            <TouchableOpacity 
                style={styles.favoriteIcon}
                onPress={onToggleFavorite}
            >
                <Icon name="favorite" size={20} color="#E50914" />
            </TouchableOpacity>

            {/* Progress bar */}
            {movie.progress > 0 && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${movie.progress}%` }]} />
                </View>
            )}

            {/* Selection overlay */}
            {isSelectionMode && (
                <View style={styles.selectionOverlay}>
                    <View style={[styles.selectionCheckbox, isSelected && styles.selectedCheckbox]}>
                        {isSelected && <Icon name="check" size={16} color="#fff" />}
                    </View>
                </View>
            )}

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.netflixGradientOverlay}
            >
                <View style={styles.netflixItemInfo}>
                    <Text style={styles.netflixItemTitle} numberOfLines={2}>
                        {movie.title}
                    </Text>
                    <View style={styles.netflixItemMeta}>
                        <Text style={styles.netflixItemYear}>{movie.year}</Text>
                        <View style={styles.netflixRating}>
                            <Icon name="star" size={12} color="#FFD700" />
                            <Text style={styles.netflixRatingText}>{movie.rating}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    </TouchableOpacity>
);

const NetflixMovieListItem = ({ movie, isSelected, isSelectionMode, onPress, onLongPress, onToggleFavorite }) => (
    <TouchableOpacity
        style={[
            styles.netflixListItem,
            isSelected && styles.selectedListItem
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
    >
        <ImageBackground
            source={{ uri: movie.backdrop }}
            style={styles.netflixListBackdrop}
            imageStyle={styles.netflixListBackdropImage}
        >
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.netflixListGradient}
            >
                <View style={styles.netflixListContent}>
                    <Image source={{ uri: movie.poster }} style={styles.netflixListPoster} />
                    
                    <View style={styles.netflixListInfo}>
                        <View style={styles.netflixListHeader}>
                            <Text style={styles.netflixListTitle} numberOfLines={2}>
                                {movie.title}
                            </Text>
                            <View style={styles.netflixListBadges}>
                                {movie.isNew && (
                                    <View style={styles.newBadgeSmall}>
                                        <Text style={styles.badgeTextSmall}>MỚI</Text>
                                    </View>
                                )}
                                <View style={styles.maturityBadge}>
                                    <Text style={styles.maturityText}>{movie.maturityRating}</Text>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.netflixListMeta}>
                            <Text style={styles.netflixListYear}>{movie.year}</Text>
                            <Text style={styles.netflixListDot}>•</Text>
                            <Text style={styles.netflixListGenre}>{movie.genre}</Text>
                            <Text style={styles.netflixListDot}>•</Text>
                            <View style={styles.netflixListRating}>
                                <Icon name="star" size={14} color="#FFD700" />
                                <Text style={styles.netflixListRatingText}>{movie.rating}</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.netflixListDescription} numberOfLines={2}>
                            {movie.description}
                        </Text>
                        
                        {/* Progress bar for list view */}
                        {movie.progress > 0 && (
                            <View style={styles.netflixListProgressContainer}>
                                <View style={styles.netflixListProgressBar}>
                                    <View style={[styles.netflixListProgress, { width: `${movie.progress}%` }]} />
                                </View>
                                <Text style={styles.netflixListProgressText}>{movie.progress}% hoàn thành</Text>
                            </View>
                        )}
                        
                        <Text style={styles.netflixListAddedDate}>
                            Đã thêm {formatDate(movie.addedDate)}
                        </Text>
                    </View>

                    {/* Favorite heart icon for list view */}
                    <TouchableOpacity 
                        style={styles.listFavoriteIcon}
                        onPress={onToggleFavorite}
                    >
                        <Icon name="favorite" size={24} color="#E50914" />
                    </TouchableOpacity>
                </View>

                {/* Selection indicator for list view */}
                {isSelectionMode && (
                    <View style={styles.netflixListSelection}>
                        <View style={[styles.selectionCheckbox, isSelected && styles.selectedCheckbox]}>
                            {isSelected && <Icon name="check" size={16} color="#fff" />}
                        </View>
                    </View>
                )}
            </LinearGradient>
        </ImageBackground>
    </TouchableOpacity>
);

// Sort Modal Component
const SortModal = ({ visible, currentSort, onSelect, onClose }) => {
    const sortOptions = [
        { value: 'recent', label: 'Gần đây nhất', icon: 'schedule' },
        { value: 'name', label: 'Tên A-Z', icon: 'sort-by-alpha' },
        { value: 'year', label: 'Năm sản xuất', icon: 'date-range' },
        { value: 'rating', label: 'Đánh giá cao', icon: 'star' }
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.netflixModalOverlay}>
                <View style={styles.netflixModalContent}>
                    <View style={styles.netflixModalHeader}>
                        <Text style={styles.netflixModalTitle}>Sắp xếp theo</Text>
                        <TouchableOpacity style={styles.netflixModalClose} onPress={onClose}>
                            <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.sortOptionsContainer}>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.sortOption,
                                    currentSort === option.value && styles.selectedSortOption
                                ]}
                                onPress={() => onSelect(option.value)}
                            >
                                <Icon 
                                    name={option.icon} 
                                    size={24} 
                                    color={currentSort === option.value ? '#E50914' : '#999'} 
                                />
                                <Text style={[
                                    styles.sortOptionText,
                                    currentSort === option.value && styles.selectedSortOptionText
                                ]}>
                                    {option.label}
                                </Text>
                                {currentSort === option.value && (
                                    <Icon name="check" size={20} color="#E50914" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // ✨ NETFLIX HEADER STYLES
    netflixHeader: {
        position: 'relative',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#000',
    },
    headerGradient: {
        paddingVertical: 20,
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 20,
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        paddingVertical: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // ✨ NETFLIX CONTROLS STYLES
    controlsContainer: {
        backgroundColor: '#111',
        paddingVertical: 15,
    },
    categoryContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    categoryTabActive: {
        backgroundColor: '#E50914',
    },
    categoryText: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    actionControls: {
        paddingHorizontal: 20,
    },
    normalControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    controlText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 8,
    },
    selectionControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    selectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    selectionText: {
        color: '#E50914',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 8,
    },

    // ✨ NETFLIX CONTENT STYLES
    contentContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    listContainer: {
        padding: 10,
    },

    // ✨ NETFLIX GRID ITEM STYLES
    netflixGridItem: {
        flex: 1,
        margin: 8,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    netflixPosterContainer: {
        position: 'relative',
        aspectRatio: 2/3,
    },
    netflixPoster: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    netflixBadges: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'column',
    },
    newBadge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
    },
    hdBadge: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    progressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#E50914',
    },
    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCheckbox: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    netflixGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 8,
    },
    netflixItemInfo: {
        alignItems: 'flex-start',
    },
    netflixItemTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 4,
    },
    netflixItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    netflixItemYear: {
        color: '#ccc',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
    },
    netflixRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    netflixRatingText: {
        color: '#FFD700',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        marginLeft: 2,
    },
    selectedItem: {
        borderWidth: 2,
        borderColor: '#E50914',
    },

    // ✨ NETFLIX LIST ITEM STYLES
    netflixListItem: {
        marginHorizontal: 10,
        marginVertical: 8,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    netflixListBackdrop: {
        height: 200,
    },
    netflixListBackdropImage: {
        borderRadius: 10,
    },
    netflixListGradient: {
        flex: 1,
        flexDirection: 'row',
        padding: 15,
    },
    netflixListContent: {
        flex: 1,
        flexDirection: 'row',
    },
    netflixListPoster: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginRight: 15,
    },
    netflixListInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    netflixListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    netflixListTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginRight: 10,
    },
    netflixListBadges: {
        flexDirection: 'row',
    },
    newBadgeSmall: {
        backgroundColor: '#E50914',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
        marginRight: 5,
    },
    badgeTextSmall: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    maturityBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
    },
    maturityText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    netflixListMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    netflixListYear: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
    },
    netflixListDot: {
        color: '#ccc',
        fontSize: 14,
        marginHorizontal: 6,
    },
    netflixListGenre: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
    },
    netflixListRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    netflixListRatingText: {
        color: '#FFD700',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 4,
    },
    netflixListDescription: {
        color: '#999',
        fontSize: 13,
        fontFamily: FONTS.REGULAR,
        lineHeight: 18,
        marginVertical: 8,
    },
    netflixListProgressContainer: {
        marginVertical: 8,
    },
    netflixListProgressBar: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 4,
    },
    netflixListProgress: {
        height: '100%',
        backgroundColor: '#E50914',
        borderRadius: 2,
    },
    netflixListProgressText: {
        color: '#E50914',
        fontSize: 11,
        fontFamily: FONTS.REGULAR,
    },
    netflixListAddedDate: {
        color: '#666',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
    },
    netflixListSelection: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    selectedListItem: {
        borderWidth: 2,
        borderColor: '#E50914',
    },

    // ✨ NETFLIX EMPTY STATE STYLES
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    exploreButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    exploreGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 12,
    },
    exploreText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 8,
    },

    // ✨ NETFLIX LOADING STYLES
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginTop: 20,
    },

    // ✨ NETFLIX SORT MODAL STYLES
    netflixModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    netflixModalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    netflixModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    netflixModalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    netflixModalClose: {
        padding: 5,
    },
    sortOptionsContainer: {
        padding: 20,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 5,
    },
    selectedSortOption: {
        backgroundColor: 'rgba(229,9,20,0.1)',
    },
    sortOptionText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginLeft: 15,
    },
    selectedSortOptionText: {
        color: '#E50914',
        fontWeight: 'bold',
    },

    // ✨ ADDITIONAL STYLES FOR API INTEGRATION
    favoriteIcon: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 6,
        borderRadius: 15,
    },
    listFavoriteIcon: {
        padding: 10,
        marginLeft: 10,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});

export default FavoritesScreen;
