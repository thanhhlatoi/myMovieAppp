// 📄 src/screens/MovieReviewsScreen.js - Netflix-Style Movie Reviews Screen
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Animated,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/Colors';
import { FONTS } from '../constants/Fonts';
import ReviewService from '../services/ReviewService';
import ReviewCard from '../components/review/ReviewCard';

const MovieReviewsScreen = ({ route, navigation }) => {
    const { movie } = route.params;

    // State
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [ratingDistribution, setRatingDistribution] = useState({});
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    
    // Filters
    const [selectedRating, setSelectedRating] = useState(0); // 0 = all
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [searchText, setSearchText] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Animations
    const headerOpacity = useRef(new Animated.Value(1)).current;
    const searchAnim = useRef(new Animated.Value(0)).current;

    const sortOptions = [
        { value: 'createdAt', label: 'Mới nhất', icon: 'schedule' },
        { value: 'rating', label: 'Điểm cao nhất', icon: 'star' },
        { value: 'rating', label: 'Điểm thấp nhất', icon: 'star-border', dir: 'asc' }
    ];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedRating || searchText || sortBy !== 'createdAt') {
            handleRefresh();
        }
    }, [selectedRating, sortBy, sortDir, searchText]);

    const loadInitialData = async () => {
        await Promise.all([
            loadReviews(true),
            loadReviewStats(),
            loadRatingDistribution()
        ]);
    };

    const loadReviews = async (reset = false) => {
        if (loading && !reset) return;

        try {
            if (reset) {
                setLoading(true);
                setPage(0);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            const currentPage = reset ? 0 : page;
            let response;

            if (searchText.trim()) {
                response = await ReviewService.searchReviews(movie.id, searchText.trim(), currentPage, 10);
            } else if (selectedRating > 0) {
                response = await ReviewService.getReviewsByRating(movie.id, selectedRating, currentPage, 10);
            } else {
                response = await ReviewService.getMovieReviews(movie.id, currentPage, 10, [sortBy], sortDir);
            }

            const newReviews = await Promise.all(
                (response.content || []).map(async review => {
                    const formatted = await ReviewService.formatReviewResponse(review);
                    return formatted;
                })
            );

            if (reset) {
                setReviews(newReviews);
            } else {
                setReviews(prev => [...prev, ...newReviews]);
            }

            setHasMore(!response.last);
            setPage(currentPage + 1);

        } catch (error) {
            console.error('Error loading reviews:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const loadReviewStats = async () => {
        try {
            const stats = await ReviewService.getMovieReviewStats(movie.id);
            setReviewStats(stats);
            console.log('✅ Review stats loaded successfully:', stats);
        } catch (error) {
            console.error('Error loading review stats:', error);
            
            // ✨ FALLBACK: Set default stats if API fails
            setReviewStats({
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                lastUpdated: new Date().toISOString()
            });
        }
    };

    const loadRatingDistribution = async () => {
        try {
            const distribution = await ReviewService.getRatingDistribution(movie.id);
            setRatingDistribution(distribution);
            console.log('✅ Rating distribution loaded successfully:', distribution);
        } catch (error) {
            console.error('Error loading rating distribution:', error);
            
            // ✨ FALLBACK: Set default distribution if API fails
            setRatingDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadReviews(true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadReviews(false);
        }
    };

    const toggleSearch = () => {
        if (showSearch) {
            Animated.timing(searchAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShowSearch(false);
                setSearchText('');
            });
        } else {
            setShowSearch(true);
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleWriteReview = () => {
        navigation.navigate('WriteReviewScreen', { movie });
    };

    const handleEditReview = (review) => {
        navigation.navigate('WriteReviewScreen', {
            movie,
            existingReview: review
        });
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await ReviewService.deleteReview(reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            loadReviewStats();
            loadRatingDistribution();
            Alert.alert('Thành công', 'Đã xóa đánh giá');
        } catch (error) {
            console.error('Error deleting review:', error);
            Alert.alert('Lỗi', 'Không thể xóa đánh giá');
        }
    };

    const handleRatingFilter = (rating) => {
        setSelectedRating(rating);
    };

    const handleSortChange = (option) => {
        setSortBy(option.value);
        setSortDir(option.dir || 'desc');
        setShowFilters(false);
    };

    const renderHeader = () => {
        const imageUri = movie?.imgMovie
            ? (movie.imgMovie.startsWith('http')
                ? movie.imgMovie
                : `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`)
            : 'https://via.placeholder.com/200x300/333/FFF?text=Movie';

        return (
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                    style={styles.headerGradient}
                >
                    {/* Navigation */}
                    <View style={styles.navigation}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.navActions}>
                            <TouchableOpacity
                                style={styles.navButton}
                                onPress={toggleSearch}
                            >
                                <Icon name="search" size={24} color="#fff" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={styles.navButton}
                                onPress={() => setShowFilters(true)}
                            >
                                <Icon name="filter-list" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Movie Info */}
                    <View style={styles.movieInfo}>
                        <Image source={{ uri: imageUri }} style={styles.moviePoster} />
                        <View style={styles.movieDetails}>
                            <Text style={styles.movieTitle}>{movie?.title}</Text>
                            <Text style={styles.movieMeta}>
                                {movie?.year} • {movie?.time || 120} phút
                            </Text>
                            
                            {/* Review Stats */}
                            {reviewStats && (
                                <View style={styles.statsRow}>
                                    <View style={styles.avgRating}>
                                        <Icon name="star" size={16} color="#FFD700" />
                                        <Text style={styles.avgRatingText}>
                                            {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'}
                                        </Text>
                                        <Text style={styles.totalReviews}>
                                            ({reviewStats.totalReviews} đánh giá)
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Search Bar */}
                    {showSearch && (
                        <Animated.View 
                            style={[
                                styles.searchContainer,
                                { opacity: searchAnim, transform: [{ scale: searchAnim }] }
                            ]}
                        >
                            <Icon name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm trong đánh giá..."
                                placeholderTextColor="#999"
                                value={searchText}
                                onChangeText={setSearchText}
                                autoFocus={true}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')}>
                                    <Icon name="clear" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            {/* Rating Filters */}
            <View style={styles.ratingFilters}>
                <TouchableOpacity
                    style={[
                        styles.ratingFilterButton,
                        selectedRating === 0 && styles.ratingFilterActive
                    ]}
                    onPress={() => handleRatingFilter(0)}
                >
                    <Text style={[
                        styles.ratingFilterText,
                        selectedRating === 0 && styles.ratingFilterTextActive
                    ]}>
                        Tất cả
                    </Text>
                </TouchableOpacity>

                {[5, 4, 3, 2, 1].map(rating => (
                    <TouchableOpacity
                        key={rating}
                        style={[
                            styles.ratingFilterButton,
                            selectedRating === rating && styles.ratingFilterActive
                        ]}
                        onPress={() => handleRatingFilter(rating)}
                    >
                        <Icon name="star" size={16} color="#FFD700" />
                        <Text style={[
                            styles.ratingFilterText,
                            selectedRating === rating && styles.ratingFilterTextActive
                        ]}>
                            {rating}
                        </Text>
                        {ratingDistribution[rating] && (
                            <Text style={styles.ratingCount}>
                                ({ratingDistribution[rating]})
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Write Review Button */}
            <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={handleWriteReview}
            >
                <Icon name="rate-review" size={20} color="#E50914" />
                <Text style={styles.writeReviewText}>Viết đánh giá</Text>
            </TouchableOpacity>
        </View>
    );

    const renderReviewItem = ({ item, index }) => (
        <ReviewCard
            review={item}
            isCurrentUser={item.isCurrentUser}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
            style={{ marginHorizontal: 0 }}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="rate-review" size={60} color="#666" />
            <Text style={styles.emptyTitle}>
                {searchText ? 'Không tìm thấy đánh giá nào' : 'Chưa có đánh giá'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchText 
                    ? `Không có đánh giá nào phù hợp với "${searchText}"`
                    : 'Hãy là người đầu tiên chia sẻ cảm nhận về bộ phim này!'
                }
            </Text>
            {!searchText && (
                <TouchableOpacity
                    style={styles.writeFirstReviewButton}
                    onPress={handleWriteReview}
                >
                    <Text style={styles.writeFirstReviewText}>Viết đánh giá đầu tiên</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E50914" />
                <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {renderHeader()}
            {renderFilters()}

            <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#E50914"
                        colors={["#E50914"]}
                        progressBackgroundColor="#000"
                    />
                }
                ListEmptyComponent={!loading ? renderEmpty : null}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: headerOpacity } } }],
                    { useNativeDriver: false }
                )}
            />

            {/* Loading Overlay */}
            {loading && reviews.length === 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                </View>
            )}

            {/* Sort Modal */}
            <Modal
                visible={showFilters}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sắp xếp theo</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Icon name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        
                        {sortOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.sortOption}
                                onPress={() => handleSortChange(option)}
                            >
                                <Icon name={option.icon} size={24} color="#E50914" />
                                <Text style={styles.sortOptionText}>{option.label}</Text>
                                {sortBy === option.value && sortDir === (option.dir || 'desc') && (
                                    <Icon name="check" size={20} color="#E50914" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 40,
    },
    headerGradient: {
        paddingBottom: 20,
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 20,
    },
    navActions: {
        flexDirection: 'row',
    },
    navButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 20,
        marginLeft: 10,
    },
    movieInfo: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    moviePoster: {
        width: 80,
        height: 120,
        borderRadius: 8,
        marginRight: 16,
    },
    movieDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    movieTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    movieMeta: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avgRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avgRatingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
        marginRight: 8,
        fontFamily: FONTS.BOLD,
    },
    totalReviews: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 20,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginLeft: 10,
    },
    filtersContainer: {
        backgroundColor: '#111',
        paddingVertical: 15,
    },
    ratingFilters: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    ratingFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    ratingFilterActive: {
        backgroundColor: '#E50914',
    },
    ratingFilterText: {
        color: '#999',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 4,
    },
    ratingFilterTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    ratingCount: {
        color: '#666',
        fontSize: 12,
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(229, 9, 20, 0.2)',
        paddingVertical: 12,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E50914',
    },
    writeReviewText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 8,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    writeFirstReviewButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    writeFirstReviewText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    footerLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    footerLoaderText: {
        color: '#999',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 8,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginTop: 16,
    },
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    sortOptionText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginLeft: 15,
    },
});

export default MovieReviewsScreen; 