// 📄 src/screens/FavoritesScreen.js - Phim yêu thích (Hoàn chỉnh)
import React, { useState, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../constants/Fonts';
import { COLORS } from '../constants/Colors';

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

    // Mock data - Replace with real API call
    const mockFavorites = [
        {
            id: 1,
            title: 'Avengers: Endgame',
            year: '2019',
            rating: 8.4,
            duration: 181,
            genre: 'Action, Adventure',
            addedDate: '2024-01-15',
            poster: 'https://images.unsplash.com/photo-1534809027769-b00d750a6463?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Cuộc chiến cuối cùng của các siêu anh hùng...'
        },
        {
            id: 2,
            title: 'Inception',
            year: '2010',
            rating: 8.8,
            duration: 148,
            genre: 'Sci-Fi, Thriller',
            addedDate: '2024-01-10',
            poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Thế giới của những giấc mơ và thực tại...'
        },
        {
            id: 3,
            title: 'The Dark Knight',
            year: '2008',
            rating: 9.0,
            duration: 152,
            genre: 'Action, Crime',
            addedDate: '2024-01-05',
            poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Batman đối đầu với Joker trong cuộc chiến tâm lý...'
        },
        {
            id: 4,
            title: 'Interstellar',
            year: '2014',
            rating: 8.6,
            duration: 169,
            genre: 'Sci-Fi, Drama',
            addedDate: '2024-01-20',
            poster: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Hành trình khám phá vũ trụ để cứu nhân loại...'
        },
        {
            id: 5,
            title: 'Spider-Man: No Way Home',
            year: '2021',
            rating: 8.2,
            duration: 148,
            genre: 'Action, Adventure',
            addedDate: '2024-01-08',
            poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Peter Parker đối mặt với đa vũ trụ...'
        },
        {
            id: 6,
            title: 'Dune',
            year: '2021',
            rating: 8.0,
            duration: 155,
            genre: 'Sci-Fi, Adventure',
            addedDate: '2024-01-12',
            poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: 'Hành tinh sa mạc và gia tộc Atreides...'
        }
    ];

    useEffect(() => {
        fetchFavorites();
    }, []);

    useEffect(() => {
        filterAndSortMovies();
    }, [favorites, searchText, sortBy]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setFavorites(mockFavorites);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách yêu thích');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterAndSortMovies = () => {
        let filtered = favorites;

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
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFavorites();
    };

    const handleMoviePress = (movie) => {
        if (isSelectionMode) {
            toggleSelection(movie.id);
        } else {
            navigation.navigate('movie', { movie });
        }
    };

    const handleLongPress = (movieId) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedItems([movieId]);
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

    const removeFromFavorites = (movieIds) => {
        Alert.alert(
            'Xóa khỏi yêu thích',
            `Bạn có chắc muốn xóa ${movieIds.length} phim khỏi danh sách yêu thích?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        setFavorites(prev => prev.filter(movie => !movieIds.includes(movie.id)));
                        setSelectedItems([]);
                        setIsSelectionMode(false);
                        Alert.alert('Thành công', 'Đã xóa khỏi danh sách yêu thích');
                    }
                }
            ]
        );
    };

    const cancelSelection = () => {
        setSelectedItems([]);
        setIsSelectionMode(false);
    };

    const getSortTitle = () => {
        switch (sortBy) {
            case 'recent': return 'Mới nhất';
            case 'name': return 'Tên A-Z';
            case 'year': return 'Năm mới nhất';
            case 'rating': return 'Điểm cao nhất';
            default: return 'Sắp xếp';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Title and Stats */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>Phim yêu thích</Text>
                <Text style={styles.subtitle}>
                    {filteredFavorites.length} phim • Tổng {Math.round(filteredFavorites.reduce((sum, movie) => sum + movie.duration, 0) / 60)} giờ
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={COLORS.GRAY} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm phim yêu thích..."
                    placeholderTextColor={COLORS.GRAY}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Icon name="close" size={20} color={COLORS.GRAY} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filter and Sort */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => {
                        const sortOptions = ['recent', 'name', 'year', 'rating'];
                        const currentIndex = sortOptions.indexOf(sortBy);
                        const nextIndex = (currentIndex + 1) % sortOptions.length;
                        setSortBy(sortOptions[nextIndex]);
                    }}
                >
                    <Icon name="sort" size={20} color={COLORS.WHITE} />
                    <Text style={styles.filterText}>{getSortTitle()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                    <Icon
                        name={viewMode === 'grid' ? 'view-list' : 'view-module'}
                        size={20}
                        color={COLORS.WHITE}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMovieItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        if (viewMode === 'list') {
            return (
                <MovieListItem
                    movie={item}
                    isSelected={isSelected}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleMoviePress(item)}
                    onLongPress={() => handleLongPress(item.id)}
                />
            );
        } else {
            return (
                <MovieGridItem
                    movie={item}
                    isSelected={isSelected}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleMoviePress(item)}
                    onLongPress={() => handleLongPress(item.id)}
                />
            );
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="favorite-border" size={80} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Chưa có phim yêu thích</Text>
            <Text style={styles.emptySubtitle}>
                Thêm phim vào danh sách yêu thích để xem lại sau
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.exploreButtonText}>Khám phá phim</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.ACTIVE} />
                <Text style={styles.loadingText}>Đang tải phim yêu thích...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                {isSelectionMode ? (
                    // Selection Mode Header
                    <View style={styles.selectionHeader}>
                        <TouchableOpacity onPress={cancelSelection}>
                            <Icon name="close" size={24} color={COLORS.WHITE} />
                        </TouchableOpacity>
                        <Text style={styles.selectionTitle}>
                            {selectedItems.length} đã chọn
                        </Text>
                        <View style={styles.selectionActions}>
                            <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
                                <Icon name={selectedItems.length === filteredFavorites.length ? "deselect" : "select-all"} size={20} color={COLORS.WHITE} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => removeFromFavorites(selectedItems)}
                                style={styles.selectionButton}
                            >
                                <Icon name="delete" size={20} color={COLORS.ACTIVE} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Normal Header
                    <View style={styles.normalHeader}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Icon name="arrow-back" size={24} color={COLORS.WHITE} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Yêu thích</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                                <Icon name="more-vert" size={24} color={COLORS.WHITE} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Content */}
            {filteredFavorites.length === 0 && !searchText ? (
                renderEmpty()
            ) : (
                <FlatList
                    data={filteredFavorites}
                    renderItem={renderMovieItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode} // Force re-render when view mode changes
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.ACTIVE}
                        />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={searchText ? (
                        <View style={styles.noResultsContainer}>
                            <Icon name="search-off" size={60} color={COLORS.GRAY} />
                            <Text style={styles.noResultsText}>
                                Không tìm thấy phim nào với từ khóa "{searchText}"
                            </Text>
                        </View>
                    ) : null}
                />
            )}
        </View>
    );
};

// Sub Components
const MovieGridItem = ({ movie, isSelected, isSelectionMode, onPress, onLongPress }) => (
    <TouchableOpacity
        style={[
            styles.gridItem,
            isSelected && styles.selectedItem
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
    >
        <View style={styles.posterContainer}>
            <Image
                source={{ uri: movie.poster }}
                style={styles.poster}
                resizeMode="cover"
            />

            {/* Selection Overlay */}
            {isSelectionMode && (
                <View style={styles.selectionOverlay}>
                    <View style={[
                        styles.selectionCheckbox,
                        isSelected && styles.selectedCheckbox
                    ]}>
                        {isSelected && (
                            <Icon name="check" size={16} color={COLORS.WHITE} />
                        )}
                    </View>
                </View>
            )}

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
                <Icon name="star" size={12} color={COLORS.YELLOW} />
                <Text style={styles.ratingText}>{movie.rating}</Text>
            </View>

            {/* Duration Badge */}
            <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{movie.duration}p</Text>
            </View>
        </View>

        <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
            <Text style={styles.movieYear}>{movie.year} • {movie.genre}</Text>
            <Text style={styles.addedDate}>Thêm {formatDate(movie.addedDate)}</Text>
        </View>
    </TouchableOpacity>
);

const MovieListItem = ({ movie, isSelected, isSelectionMode, onPress, onLongPress }) => (
    <TouchableOpacity
        style={[
            styles.listItem,
            isSelected && styles.selectedItem
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
    >
        <View style={styles.listPosterContainer}>
            <Image
                source={{ uri: movie.poster }}
                style={styles.listPoster}
                resizeMode="cover"
            />

            {/* Selection Checkbox */}
            {isSelectionMode && (
                <View style={styles.listSelectionCheckbox}>
                    <View style={[
                        styles.selectionCheckbox,
                        isSelected && styles.selectedCheckbox
                    ]}>
                        {isSelected && (
                            <Icon name="check" size={16} color={COLORS.WHITE} />
                        )}
                    </View>
                </View>
            )}
        </View>

        <View style={styles.listMovieInfo}>
            <Text style={styles.listMovieTitle} numberOfLines={1}>{movie.title}</Text>
            <Text style={styles.listMovieSubtitle}>{movie.year} • {movie.genre} • {movie.duration}p</Text>
            <Text style={styles.listMovieDescription} numberOfLines={2}>
                {movie.description}
            </Text>

            <View style={styles.listMovieMeta}>
                <View style={styles.listRating}>
                    <Icon name="star" size={14} color={COLORS.YELLOW} />
                    <Text style={styles.listRatingText}>{movie.rating}</Text>
                </View>
                <Text style={styles.listAddedDate}>Thêm {formatDate(movie.addedDate)}</Text>
            </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
            <Icon name="more-vert" size={20} color={COLORS.GRAY} />
        </TouchableOpacity>
    </TouchableOpacity>
);

// Utility function
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BASIC_BACKGROUND,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.BASIC_BACKGROUND,
    },
    loadingText: {
        color: COLORS.WHITE,
        fontSize: 16,
        marginTop: 16,
        fontFamily: FONTS.REGULAR,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    normalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    headerRight: {
        flexDirection: 'row',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    selectionActions: {
        flexDirection: 'row',
    },
    selectionButton: {
        marginLeft: 20,
        padding: 5,
    },
    listContainer: {
        padding: 20,
    },
    headerContainer: {
        marginBottom: 20,
    },
    titleSection: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.GRAY,
        marginTop: 5,
        fontFamily: FONTS.REGULAR,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.WHITE,
        marginLeft: 10,
        fontFamily: FONTS.REGULAR,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 14,
        color: COLORS.WHITE,
        marginLeft: 8,
        fontFamily: FONTS.REGULAR,
    },
    // Grid Item Styles
    gridItem: {
        flex: 1,
        margin: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    selectedItem: {
        borderWidth: 2,
        borderColor: COLORS.ACTIVE,
    },
    posterContainer: {
        position: 'relative',
        aspectRatio: 2/3,
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    selectionOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    selectionCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    selectedCheckbox: {
        backgroundColor: COLORS.ACTIVE,
        borderColor: COLORS.ACTIVE,
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        color: COLORS.WHITE,
        marginLeft: 2,
        fontFamily: FONTS.REGULAR,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    durationText: {
        fontSize: 10,
        color: COLORS.WHITE,
        fontFamily: FONTS.REGULAR,
    },
    movieInfo: {
        padding: 12,
    },
    movieTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 4,
        fontFamily: FONTS.BOLD,
    },
    movieYear: {
        fontSize: 12,
        color: COLORS.GRAY,
        marginBottom: 4,
        fontFamily: FONTS.REGULAR,
    },
    addedDate: {
        fontSize: 10,
        color: COLORS.GRAY,
        fontFamily: FONTS.REGULAR,
    },
    // List Item Styles
    listItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    listPosterContainer: {
        position: 'relative',
        width: 80,
        height: 120,
    },
    listPoster: {
        width: '100%',
        height: '100%',
    },
    listSelectionCheckbox: {
        position: 'absolute',
        top: 8,
        left: 8,
    },
    listMovieInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    listMovieTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 4,
        fontFamily: FONTS.BOLD,
    },
    listMovieSubtitle: {
        fontSize: 12,
        color: COLORS.GRAY,
        marginBottom: 6,
        fontFamily: FONTS.REGULAR,
    },
    listMovieDescription: {
        fontSize: 13,
        color: COLORS.GRAY,
        lineHeight: 18,
        marginBottom: 8,
        fontFamily: FONTS.REGULAR,
    },
    listMovieMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listRatingText: {
        fontSize: 12,
        color: COLORS.WHITE,
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
    listAddedDate: {
        fontSize: 10,
        color: COLORS.GRAY,
        fontFamily: FONTS.REGULAR,
    },
    moreButton: {
        padding: 12,
        justifyContent: 'center',
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginTop: 20,
        marginBottom: 8,
        fontFamily: FONTS.BOLD,
    },
    emptySubtitle: {
        fontSize: 16,
        color: COLORS.GRAY,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        fontFamily: FONTS.REGULAR,
    },
    exploreButton: {
        backgroundColor: COLORS.ACTIVE,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    // No Results
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 50,
    },
    noResultsText: {
        fontSize: 16,
        color: COLORS.GRAY,
        textAlign: 'center',
        marginTop: 20,
        fontFamily: FONTS.REGULAR,
    },
});

export default FavoritesScreen;
