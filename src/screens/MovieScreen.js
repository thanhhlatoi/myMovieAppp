import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import favoriteService from '../services/FavoriteService';
import ReviewService from '../services/ReviewService';
import ReviewCard from '../components/review/ReviewCard';
import MovieService from '../services/MovieService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

const MovieScreen = ({ route, navigation }) => {
  const movie = route.params?.movie?.data || route.params?.movie;
  const { user, isAuthenticated } = useUser();
  
  // Debug authentication status
  useEffect(() => {
    console.log('=== MovieScreen Authentication Debug ===');
    console.log('User from context:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('IsAuthenticated:', isAuthenticated);
    console.log('Movie ID:', movie?.id);
    console.log('==========================================');
  }, [user, isAuthenticated]);
  
  const [liked, setLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // ✨ NEW: Add state for likes count to trigger UI re-renders
  const [likesCount, setLikesCount] = useState(movie?.likes || 0);
  const [dislikesCount, setDislikesCount] = useState(movie?.dislikes || 0);
  const [disliked, setDisliked] = useState(false);

  // ✨ NEW: Add loading states to prevent spam clicking
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  // 🚫 RATE LIMITING: Track last click times
  const lastLikeClickRef = useRef(0);
  const lastDislikeClickRef = useRef(0);

  // 🚫 GLOBAL FLAG: Prevent multiple API calls
  const isProcessingRef = useRef(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [canUserReview, setCanUserReview] = useState(true);

  console.log("📦 Dữ liệu phim:", movie);

  // Helper function to get user ID safely
  const getUserId = () => {
    if (!isAuthenticated || !user?.id) {
      console.warn('User not authenticated or missing ID');
      return null;
    }
    return user.id;
  };

  useEffect(() => {
    if (movie?.id) {
      checkFavoriteStatus();
      loadReviews();
      loadReviewStats();
      checkUserReviewStatus();
      
      // Only load user status if authenticated
      if (isAuthenticated && user?.id) {
        loadUserLikeStatus();
      }
    }
  }, [movie?.id, isAuthenticated, user?.id]);

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

  const handleLike = async () => {
    // 🚫 ENHANCED SPAM PREVENTION
    if (isLiking || isDisliking || isProcessingRef.current) {
      console.warn('⚠️ Already processing like/dislike, ignoring click');
      return;
    }

    // 🚫 RATE LIMITING: Prevent rapid clicks (minimum 500ms between clicks)
    const now = Date.now();
    const lastClickTime = lastLikeClickRef.current || 0;
    if (now - lastClickTime < 500) {
      console.warn('⚠️ Rate limited: Too fast clicking, ignoring');
      return;
    }
    lastLikeClickRef.current = now;

    // 🔒 SET GLOBAL PROCESSING FLAG
    isProcessingRef.current = true;

    // Get real user ID from context
    const userId = user?.id;
    if (!userId || !isAuthenticated) {
      Alert.alert('⚠️ Lỗi', 'Bạn cần đăng nhập để thực hiện hành động này');
      setIsLiking(false);
      isProcessingRef.current = false;
      return;
    }
    
    // 🎯 ONE-LIKE-PER-USER LOGIC:
    // If user is already liked, remove like
    // If user is disliked, switch to like
    // If user has no reaction, add like
    
    setIsLiking(true); // 🔒 Lock button
    
    try {
      if (liked) {
        // User already liked - REMOVE LIKE
        setLiked(false);
        setLikesCount(Math.max(likesCount - 1, 0));
        
        // Try enhanced API first, fallback to regular
        try {
          const response = await MovieService.likeMovieEnhanced(movie.id, userId);
          console.log(`💔 Removed like for movie: ${movie.title}`, response);
        } catch (apiError) {
          console.warn('⚠️ Enhanced API failed, using regular like:', apiError);
          await MovieService.likeMovie(movie.id);
        }
        
        await saveUserLikeStatus(false, disliked);
        Alert.alert('💔', 'Đã bỏ thích phim này');
        
      } else if (disliked) {
        // User was disliked - SWITCH TO LIKE
        setLiked(true);
        setDisliked(false);
        setLikesCount(likesCount + 1);
        setDislikesCount(Math.max(dislikesCount - 1, 0));
        
        // Call both APIs to handle the switch
        try {
          await MovieService.likeMovieEnhanced(movie.id, userId);
          console.log(`💖 Switched from dislike to like for movie: ${movie.title}`);
        } catch (apiError) {
          await MovieService.likeMovie(movie.id);
        }
        
        await saveUserLikeStatus(true, false);
        Alert.alert('💖', 'Đã chuyển từ không thích sang thích phim này');
        
      } else {
        // User has no reaction - ADD LIKE
        setLiked(true);
        setLikesCount(likesCount + 1);
        
        try {
          const response = await MovieService.likeMovieEnhanced(movie.id, userId);
          console.log(`💖 Added like for movie: ${movie.title}`, response);
        } catch (apiError) {
          await MovieService.likeMovie(movie.id);
        }
        
        await saveUserLikeStatus(true, false);
        Alert.alert('💖', 'Đã thích phim này');
      }
      
      // Refresh movie data to get updated counts
      try {
        const updatedMovie = await MovieService.getMovieById(movie.id);
        if (updatedMovie?.data?.likes !== undefined) {
          setLikesCount(updatedMovie.data.likes);
          setDislikesCount(updatedMovie.data.dislikes);
          console.log(`🔄 Updated counts from server: ${updatedMovie.data.likes} likes, ${updatedMovie.data.dislikes} dislikes`);
        }
      } catch (refreshError) {
        console.warn('⚠️ Could not refresh movie data:', refreshError);
      }
      
    } catch (error) {
      console.error('❌ Error updating like status:', error);
      
      // Revert changes on error
      await loadUserLikeStatus();
      Alert.alert('❌ Lỗi', 'Không thể cập nhật trạng thái thích. Vui lòng thử lại.');
    } finally {
      setIsLiking(false); // 🔓 Unlock button
      isProcessingRef.current = false; // 🔓 Unlock global flag
    }
  };

  const handleDislike = async () => {
    // 🚫 ENHANCED SPAM PREVENTION
    if (isLiking || isDisliking || isProcessingRef.current) {
      console.warn('⚠️ Already processing like/dislike, ignoring click');
      return;
    }

    // 🚫 RATE LIMITING: Prevent rapid clicks (minimum 500ms between clicks)
    const now = Date.now();
    const lastClickTime = lastDislikeClickRef.current || 0;
    if (now - lastClickTime < 500) {
      console.warn('⚠️ Rate limited: Too fast clicking, ignoring');
      return;
    }
    lastDislikeClickRef.current = now;

    // 🔒 SET GLOBAL PROCESSING FLAG
    isProcessingRef.current = true;

    // Get real user ID from context
    const userId = user?.id;
    if (!userId || !isAuthenticated) {
      Alert.alert('⚠️ Lỗi', 'Bạn cần đăng nhập để thực hiện hành động này');
      setIsDisliking(false);
      isProcessingRef.current = false;
      return;
    }
    
    // 🎯 ONE-DISLIKE-PER-USER LOGIC:
    // If user already disliked, remove dislike
    // If user is liked, switch to dislike
    // If user has no reaction, add dislike
    
    setIsDisliking(true); // 🔒 Lock button
    
    try {
      if (disliked) {
        // User already disliked - REMOVE DISLIKE
        setDisliked(false);
        setDislikesCount(Math.max(dislikesCount - 1, 0));
        
        try {
          const response = await MovieService.dislikeMovieEnhanced(movie.id, userId);
          console.log(`👍 Removed dislike for movie: ${movie.title}`, response);
        } catch (apiError) {
          console.warn('⚠️ Enhanced API failed, using regular dislike:', apiError);
          await MovieService.dislikeMovie(movie.id);
        }
        
        await saveUserLikeStatus(liked, false);
        Alert.alert('👍', 'Đã bỏ không thích phim này');
        
      } else if (liked) {
        // User was liked - SWITCH TO DISLIKE
        setLiked(false);
        setDisliked(true);
        setLikesCount(Math.max(likesCount - 1, 0));
        setDislikesCount(dislikesCount + 1);
        
        try {
          await MovieService.dislikeMovieEnhanced(movie.id, userId);
          console.log(`👎 Switched from like to dislike for movie: ${movie.title}`);
        } catch (apiError) {
          await MovieService.dislikeMovie(movie.id);
        }
        
        await saveUserLikeStatus(false, true);
        Alert.alert('👎', 'Đã chuyển từ thích sang không thích phim này');
        
      } else {
        // User has no reaction - ADD DISLIKE
        setDisliked(true);
        setDislikesCount(dislikesCount + 1);
        
        try {
          const response = await MovieService.dislikeMovieEnhanced(movie.id, userId);
          console.log(`👎 Added dislike for movie: ${movie.title}`, response);
        } catch (apiError) {
          await MovieService.dislikeMovie(movie.id);
        }
        
        await saveUserLikeStatus(false, true);
        Alert.alert('👎', 'Đã không thích phim này');
      }
      
      // Refresh movie data to get updated counts
      try {
        const updatedMovie = await MovieService.getMovieById(movie.id);
        if (updatedMovie?.data?.dislikes !== undefined) {
          setLikesCount(updatedMovie.data.likes);
          setDislikesCount(updatedMovie.data.dislikes);
          console.log(`🔄 Updated counts from server: ${updatedMovie.data.likes} likes, ${updatedMovie.data.dislikes} dislikes`);
        }
      } catch (refreshError) {
        console.warn('⚠️ Could not refresh movie data:', refreshError);
      }
      
    } catch (error) {
      console.error('❌ Error updating dislike status:', error);
      
      // Revert changes on error
      await loadUserLikeStatus();
      Alert.alert('❌ Lỗi', 'Không thể cập nhật trạng thái không thích. Vui lòng thử lại.');
    } finally {
      setIsDisliking(false); // 🔓 Unlock button
      isProcessingRef.current = false; // 🔓 Unlock global flag
    }
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
      console.log('✅ Review stats loaded successfully for movie:', movie.id, stats);
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

  // NEW: Load user's like/dislike status from both API and AsyncStorage
  const loadUserLikeStatus = async () => {
    try {
      const userId = user?.id;
      if (!userId || !isAuthenticated) {
        console.warn('User not authenticated, skipping like status load');
        return;
      }
      const storageKey = `user_${userId}_movie_${movie.id}_like_status`;
      
      // Check AsyncStorage first (for offline capability)
      const storedStatus = await AsyncStorage.getItem(storageKey);
      if (storedStatus) {
        const { liked, disliked } = JSON.parse(storedStatus);
        setLiked(liked);
        setDisliked(disliked);
        console.log(`📱 Loaded like status from storage: liked=${liked}, disliked=${disliked}`);
      }
      
      // Also check with API if available
      try {
        const apiStatus = await MovieService.checkUserLikeStatus(movie.id, userId);
        if (apiStatus) {
          setLiked(apiStatus.liked || false);
          setDisliked(apiStatus.disliked || false);
          
          // Update AsyncStorage with API data
          await AsyncStorage.setItem(storageKey, JSON.stringify({
            liked: apiStatus.liked || false,
            disliked: apiStatus.disliked || false,
            timestamp: new Date().toISOString()
          }));
          
          console.log(`🌐 Updated like status from API: liked=${apiStatus.liked}, disliked=${apiStatus.disliked}`);
        }
      } catch (apiError) {
        console.warn('⚠️ API like status check failed, using stored data:', apiError);
      }
    } catch (error) {
      console.error('❌ Error loading user like status:', error);
    }
  };

  // NEW: Save user like status to AsyncStorage
  const saveUserLikeStatus = async (liked, disliked) => {
    try {
      const userId = user?.id;
      if (!userId || !isAuthenticated) {
        console.warn('User not authenticated, skipping like status save');
        return;
      }
      const storageKey = `user_${userId}_movie_${movie.id}_like_status`;
      
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        liked,
        disliked,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`💾 Saved like status to storage: liked=${liked}, disliked=${disliked}`);
    } catch (error) {
      console.error('❌ Error saving like status:', error);
    }
  };

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

          {/* Authentication Notice */}
          {!isAuthenticated && (
            <View style={styles.authNotice}>
              <Ionicons name="information-circle-outline" size={20} color="#FFD700" />
              <Text style={styles.authNoticeText}>
                Đăng nhập để thích phim và viết đánh giá
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.playButton} onPress={handleWatchMovie}>
              <Icon name="play-arrow" size={24} color="#fff" />
              <Text style={styles.playButtonText}>Xem Phim</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    liked && styles.actionButtonActive,
                    (isLiking || isDisliking) && styles.actionButtonLoading,
                    !isAuthenticated && styles.actionButtonDisabled
                  ]}
                  onPress={handleLike}
                  disabled={isLiking || isDisliking || !isAuthenticated}
                  activeOpacity={isLiking || isDisliking || !isAuthenticated ? 1 : 0.7}
              >
                <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={24}
                    color={liked ? "#E50914" : ((isLiking || isDisliking || !isAuthenticated) ? "#666" : "#fff")}
                />
                <Text style={[
                  styles.actionButtonText,
                  (isLiking || isDisliking) && styles.actionButtonTextLoading
                ]}>
                  {isLiking ? "..." : (isAuthenticated ? likesCount : "?")}
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

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  disliked && styles.actionButtonActive,
                  (isLiking || isDisliking) && styles.actionButtonLoading,
                  !isAuthenticated && styles.actionButtonDisabled
                ]}
                onPress={handleDislike}
                disabled={isLiking || isDisliking || !isAuthenticated}
                activeOpacity={isLiking || isDisliking || !isAuthenticated ? 1 : 0.7}
              >
                <Ionicons
                  name={disliked ? "thumbs-down" : "thumbs-down-outline"}
                  size={24}
                  color={disliked ? "#F44336" : ((isLiking || isDisliking || !isAuthenticated) ? "#666" : "#fff")}
                />
                <Text style={[
                  styles.actionButtonText,
                  (isLiking || isDisliking) && styles.actionButtonTextLoading
                ]}>
                  {isDisliking ? "..." : (isAuthenticated ? dislikesCount : "?")}
                </Text>
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
                  <Text style={styles.statNumber}>
                    {likesCount}
                  </Text>
                  <Text style={styles.statLabel}>Thích</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="thumb-down" size={20} color="#F44336" />
                  <Text style={styles.statNumber}>{dislikesCount}</Text>
                  <Text style={styles.statLabel}>Không thích</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="visibility" size={20} color="#2196F3" />
                  <Text style={styles.statNumber}>
                    {(() => {
                      // Enhanced views display for stats section
                      const viewsCount = movie.views ?? movie.viewCount ?? movie.totalViews ?? 0;
                      return viewsCount;
                    })()}
                  </Text>
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
    opacity: 0.7,
  },
  actionButtonTextLoading: {
    color: '#999',
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  authNoticeText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
