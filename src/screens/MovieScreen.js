import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import favoriteService from '../services/FavoriteService';
import ReviewService from '../services/ReviewService';
import ReviewCard from '../components/review/ReviewCard';

const { width, height } = Dimensions.get('window');

const MovieScreen = ({ route, navigation }) => {
  const movie = route.params?.movie?.data || route.params?.movie;
  const [liked, setLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [canUserReview, setCanUserReview] = useState(true);

  console.log("📦 Dữ liệu phim:", movie);

  useEffect(() => {
    if (movie?.id) {
      checkFavoriteStatus();
      loadReviews();
      loadReviewStats();
      checkUserReviewStatus();
    }
  }, [movie?.id]);

  const checkFavoriteStatus = async () => {
    try {
      setIsLoadingFavorite(true);
      const response = await favoriteService.checkIsFavorite(movie.id);
      setIsFavorite(response.isFavorite);
      console.log('✅ Favorite status checked:', response.isFavorite);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleToggleFavorites = async () => {
    if (isLoadingFavorite) return;

    try {
      setIsLoadingFavorite(true);
      
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      const response = await favoriteService.toggleFavorite(movie.id);
      
      setIsFavorite(response.isFavorite);
      
      const message = response.isFavorite 
        ? `✅ Đã thêm "${movie.title}" vào danh sách yêu thích`
        : `❌ Đã xóa "${movie.title}" khỏi danh sách yêu thích`;
        
      Alert.alert(
        response.isFavorite ? '💖 Thêm vào danh sách' : '🗑️ Xóa khỏi danh sách', 
        message,
        [{ text: 'OK' }]
      );
      
      console.log('✅ Favorite toggled successfully:', response);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      
      setIsFavorite(!isFavorite);
      
      Alert.alert(
        '❌ Lỗi',
        'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  if (!movie) {
    return (
        <View style={styles.errorContainer}>
          <Icon name="movie" size={80} color="#666" />
          <Text style={styles.errorText}>Không tìm thấy thông tin phim</Text>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const handleWatchMovie = () => {
    console.log("🎬 Bắt đầu xem phim:", movie.title);

    const videoId = movie.id || movie.videoId || movie.movieId;

    if (!videoId) {
      Alert.alert(
          '⚠️ Lỗi',
          'Không tìm thấy ID video để phát. Vui lòng thử lại.',
          [{ text: 'OK' }]
      );
      return;
    }

    console.log("🆔 Video ID:", videoId);
    console.log("📦 Movie data:", {
      id: movie.id,
      title: movie.title,
      videoId: videoId
    });

    navigation.navigate('VideoPlayerScreen', {
      videoId: videoId,
      movie: movie,
      movieTitle: movie.title,
      movieData: movie
    });
  };

  const handleLike = () => {
    setLiked(!liked);
    // TODO: Call API to update like status
  };

  // ===================== REVIEW FUNCTIONS =====================

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await ReviewService.getMovieReviews(movie.id, 0, 5);
      const formattedReviews = await Promise.all(
        (response.content || []).map(review => 
          ReviewService.formatReviewResponse(review)
        )
      );
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      const stats = await ReviewService.getMovieReviewStats(movie.id);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const checkUserReviewStatus = async () => {
    try {
      const canReview = await ReviewService.canUserReviewMovie(null, movie.id);
      setCanUserReview(canReview);
      
      if (!canReview) {
        // User already has a review, load it
        const userReviewData = await ReviewService.getUserReviewForMovie(null, movie.id);
        if (userReviewData) {
          setUserReview(await ReviewService.formatReviewResponse(userReviewData));
        }
      }
    } catch (error) {
      console.error('Error checking user review status:', error);
    }
  };

  const handleWriteReview = () => {
    navigation.navigate('WriteReviewScreen', {
      movie: movie,
      existingReview: userReview
    });
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await ReviewService.deleteReview(reviewId);
      setUserReview(null);
      setCanUserReview(true);
      loadReviews();
      loadReviewStats();
      Alert.alert('Thành công', 'Đã xóa đánh giá của bạn');
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Lỗi', 'Không thể xóa đánh giá');
    }
  };

  const handleEditReview = (review) => {
    navigation.navigate('WriteReviewScreen', {
      movie: movie,
      existingReview: review
    });
  };

  const imageUri = movie.imgMovie
      ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`
      : 'https://via.placeholder.com/400x600/333/FFF?text=No+Image';

  return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <ImageBackground
                source={{ uri: imageUri }}
                style={styles.heroBackground}
                resizeMode="cover"
            >
              <View style={styles.heroOverlay}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backIcon}
                    onPress={() => navigation.goBack()}
                >
                  <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareIcon}>
                  <Icon name="share" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Movie Info Overlay */}
              <View style={styles.movieInfoOverlay}>
                <Text style={styles.movieTitle}>{movie.title}</Text>

                <View style={styles.movieMeta}>
                  <View style={styles.metaItem}>
                    <Icon name="calendar-today" size={16} color="#ccc" />
                    <Text style={styles.metaText}>{movie.year || "2024"}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="access-time" size={16} color="#ccc" />
                    <Text style={styles.metaText}>{movie.time || "N/A"} phút</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="visibility" size={16} color="#ccc" />
                    <Text style={styles.metaText}>{movie.views} lượt xem</Text>
                  </View>
                </View>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={20} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {movie.rating || (movie.likes > movie.dislikes ? "8.5" : "7.2")}
                  </Text>
                  <Text style={styles.ratingSubtext}>
                    ({movie.likes + movie.dislikes} đánh giá)
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.playButton} onPress={handleWatchMovie}>
              <Icon name="play-arrow" size={24} color="#fff" />
              <Text style={styles.playButtonText}>Xem Phim</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                  style={[styles.actionButton, liked && styles.actionButtonActive]}
                  onPress={handleLike}
              >
                <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={24}
                    color={liked ? "#E50914" : "#fff"}
                />
                <Text style={styles.actionButtonText}>
                  {movie.likes || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    styles.myListButton,
                    isFavorite && styles.myListButtonActive,
                    isLoadingFavorite && styles.actionButtonLoading
                  ]}
                  onPress={handleToggleFavorites}
                  disabled={isLoadingFavorite}
              >
                <Ionicons
                    name={isFavorite ? "checkmark" : "add"}
                    size={24}
                    color={isFavorite ? "#00D084" : "#fff"}
                />
                <Text style={[
                  styles.actionButtonText,
                  isFavorite && styles.myListButtonText
                ]}>
                  {isLoadingFavorite ? "..." : (isFavorite ? "Trong DS" : "Danh sách")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="download" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Tải</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Movie Details */}
          <View style={styles.detailsSection}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📖 Nội dung phim</Text>
              <Text style={styles.description}>
                {movie.description || "Chưa có mô tả cho bộ phim này."}
              </Text>
            </View>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎭 Thể loại</Text>
                  <View style={styles.genresContainer}>
                    {movie.genres.map((genre, index) => (
                        <View key={index} style={styles.genreChip}>
                          <Text style={styles.genreText}>{genre.name}</Text>
                        </View>
                    ))}
                  </View>
                </View>
            )}

            {/* Director/Author */}
            {movie.author && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎬 Đạo diễn</Text>
                  <View style={styles.personCard}>
                    <Image
                        source={{
                          uri: movie.author.avatar
                              ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.author.avatar}`
                              : 'https://via.placeholder.com/60x60/333/FFF?text=Dir'
                        }}
                        style={styles.personAvatar}
                    />
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{movie.author.fullName}</Text>
                      <Text style={styles.personDetails}>
                        {movie.author.country} • {movie.author.description}
                      </Text>
                    </View>
                  </View>
                </View>
            )}

            {/* Cast/Performers */}
            {movie.performers && movie.performers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎭 Diễn viên</Text>
                  <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={movie.performers}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                          <View style={styles.castCard}>
                            <Image
                                source={{
                                  uri: item.avatar
                                      ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${item.avatar}`
                                      : 'https://via.placeholder.com/80x80/333/FFF?text=Actor'
                                }}
                                style={styles.castAvatar}
                            />
                            <Text style={styles.castName} numberOfLines={2}>
                              {item.fullName}
                            </Text>
                          </View>
                      )}
                      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                      contentContainerStyle={styles.castList}
                  />
                </View>
            )}

            {/* Category */}
            {movie.category && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📂 Danh mục</Text>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{movie.category.name}</Text>
                  </View>
                </View>
            )}

            {/* Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Thống kê</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Icon name="thumb-up" size={20} color="#4CAF50" />
                  <Text style={styles.statNumber}>{movie.likes || 0}</Text>
                  <Text style={styles.statLabel}>Thích</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="thumb-down" size={20} color="#F44336" />
                  <Text style={styles.statNumber}>{movie.dislikes || 0}</Text>
                  <Text style={styles.statLabel}>Không thích</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="visibility" size={20} color="#2196F3" />
                  <Text style={styles.statNumber}>{movie.views || 0}</Text>
                  <Text style={styles.statLabel}>Lượt xem</Text>
                </View>
              </View>
            </View>

            {/* Reviews Section */}
            <View style={styles.section}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionTitle}>⭐ Đánh giá & Nhận xét</Text>
                
                {/* Review Stats */}
                {reviewStats && (
                  <View style={styles.reviewStatsContainer}>
                    <View style={styles.avgRatingContainer}>
                      <Text style={styles.avgRating}>
                        {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'}
                      </Text>
                      <View style={styles.avgRatingStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Icon
                            key={star}
                            name={star <= Math.round(reviewStats.averageRating || 0) ? "star" : "star-border"}
                            size={16}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                      <Text style={styles.totalReviews}>
                        ({reviewStats.totalReviews || 0} đánh giá)
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Write Review Button */}
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={handleWriteReview}
              >
                <Icon 
                  name={userReview ? "edit" : "rate-review"} 
                  size={20} 
                  color="#E50914" 
                />
                <Text style={styles.writeReviewText}>
                  {userReview ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá'}
                </Text>
              </TouchableOpacity>

              {/* User's Review */}
              {userReview && (
                <View style={styles.userReviewSection}>
                  <Text style={styles.userReviewTitle}>Đánh giá của bạn:</Text>
                  <ReviewCard
                    review={userReview}
                    isCurrentUser={true}
                    onEdit={handleEditReview}
                    onDelete={handleDeleteReview}
                    style={styles.userReviewCard}
                  />
                </View>
              )}

              {/* Recent Reviews */}
              {reviews.length > 0 ? (
                <View style={styles.reviewsList}>
                  <Text style={styles.reviewsListTitle}>Đánh giá gần đây:</Text>
                  {reviews.map((review, index) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isCurrentUser={false}
                      style={index === 0 ? { marginTop: 0 } : {}}
                    />
                  ))}
                  
                  {/* View All Reviews Button */}
                  <TouchableOpacity 
                    style={styles.viewAllReviewsButton}
                    onPress={() => navigation.navigate('MovieReviewsScreen', { movie })}
                  >
                    <Text style={styles.viewAllReviewsText}>
                      Xem tất cả đánh giá
                    </Text>
                    <Icon name="arrow-forward" size={16} color="#E50914" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noReviewsContainer}>
                  <Icon name="rate-review" size={40} color="#666" />
                  <Text style={styles.noReviewsText}>
                    Chưa có đánh giá nào cho bộ phim này
                  </Text>
                  <Text style={styles.noReviewsSubtext}>
                    Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
                  </Text>
                </View>
              )}
            </View>

            {/* Related Movies Section Placeholder */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🍿 Phim liên quan</Text>
              <Text style={styles.comingSoonText}>Sắp có...</Text>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Play Button */}
        <TouchableOpacity
            style={styles.floatingPlayButton}
            onPress={handleWatchMovie}
        >
          <Icon name="play-arrow" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroSection: {
    height: height * 0.6,
    position: 'relative',
  },
  heroBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  shareIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  movieInfoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    paddingBottom: 30,
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  movieMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  ratingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#111',
  },
  playButton: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    minWidth: 60,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  detailsSection: {
    backgroundColor: '#111',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreChip: {
    backgroundColor: '#E50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
  },
  personAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  personDetails: {
    fontSize: 14,
    color: '#ccc',
  },
  castList: {
    paddingLeft: 20,
  },
  castCard: {
    alignItems: 'center',
    width: 90,
  },
  castAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  castName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  categoryChip: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  floatingPlayButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#E50914',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  myListButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  myListButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  myListButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtonLoading: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  avgRatingStars: {
    flexDirection: 'row',
  },
  totalReviews: {
    color: '#ccc',
    fontSize: 14,
  },
  writeReviewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  writeReviewText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  userReviewSection: {
    marginBottom: 20,
  },
  userReviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  userReviewCard: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
  },
  reviewsList: {
    marginBottom: 20,
  },
  reviewsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  viewAllReviewsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllReviewsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noReviewsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  noReviewsSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MovieScreen;
