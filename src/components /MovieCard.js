import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
} from "react-native";
import COLORS from "../constants/Colors";
import FONTS from "../constants/Fonts";
import IMAGES from "../constants/Images";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.35; // 35% của màn hình
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Tỷ lệ 2:3 như poster phim

const MovieCard = ({ movie = {}, heartLess = true, onPress, style }) => {
  const [liked, setLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleLikePress = () => {
    setLiked(!liked);
    // Có thể gọi API để update like status
    // updateMovieLike(movie.id, !liked);
  };

  // Xử lý URL ảnh từ API của bạn
  const imageUri = movie.imgMovie
      ? `http://192.168.100.193:8082/api/videos/view?bucketName=thanh&path=${movie.imgMovie}`
      : 'https://via.placeholder.com/300x450/333333/FFFFFF?text=No+Image';

  // Lấy thể loại đầu tiên từ genres array
  const primaryGenre = movie.genres && movie.genres.length > 0
      ? movie.genres[0].name
      : null;

  // Format duration từ field 'time'
  const formatDuration = (time) => {
    if (!time) return "N/A";
    // Nếu time là số, coi như phút
    if (!isNaN(time)) return `${time}p`;
    // Nếu time là string, trả về như cũ
    return time;
  };

  return (
      <Animated.View style={[
        styles.cardWrapper,
        style,
        { transform: [{ scale: scaleValue }] }
      ]}>
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.touchableContainer}
        >
          <View style={styles.container}>
            <ImageBackground
                source={{ uri: imageUri }}
                resizeMode="cover"
                style={styles.imageBackground}
                onLoad={() => setImageLoaded(true)}
                imageStyle={styles.imageStyle}
            >
              {/* Loading placeholder */}
              {!imageLoaded && (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.GRAY} />
                  </View>
              )}

              {/* Gradient overlay */}
              <View style={styles.gradientOverlay} />

              {/* IMDB Rating - Sử dụng rating tự tính hoặc mặc định */}
              <View style={styles.imdbContainer}>
                {IMAGES.IMDB ? (
                    <Image
                        source={IMAGES.IMDB}
                        resizeMode="contain"
                        style={styles.imdbImage}
                    />
                ) : (
                    <Text style={styles.imdbLabel}>★</Text>
                )}
                <Text style={styles.imdbRating}>
                  {movie.rating || (movie.likes > movie.dislikes ? "8.5" : "7.2")}
                </Text>
              </View>

              {/* Heart Icon */}
              {!heartLess && (
                  <TouchableOpacity
                      style={styles.heartIconWrapper}
                      onPress={handleLikePress}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[
                      styles.heartBackground,
                      liked && styles.heartBackgroundLiked
                    ]}>
                      <Ionicons
                          name={liked ? "heart" : "heart-outline"}
                          size={22}
                          color={COLORS.WHITE || '#FFF'}
                      />
                    </View>
                  </TouchableOpacity>
              )}

              {/* Play Icon Overlay */}
              <View style={styles.playIconContainer}>
                <View style={styles.playIconBackground}>
                  <Ionicons
                      name="play"
                      size={24}
                      color={COLORS.WHITE || '#FFF'}
                      style={styles.playIcon}
                  />
                </View>
              </View>

              {/* Genre Badge */}
              {primaryGenre && (
                  <View style={styles.genreBadge}>
                    <Text style={styles.genreText}>{primaryGenre}</Text>
                  </View>
              )}

              {/* Year Badge */}
              {movie.year && (
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearText}>{movie.year}</Text>
                  </View>
              )}
            </ImageBackground>
          </View>

          {/* Movie Info Section */}
          <View style={styles.movieInfoContainer}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.title || "Untitled Movie"}
            </Text>

            <View style={styles.movieDetailsRow}>
              <Text style={styles.movieYear}>
                {movie.year || "2024"}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.movieDuration}>
                {formatDuration(movie.time)}
              </Text>
            </View>

            {/* Stats Row - Sử dụng dữ liệu thực từ API */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color={COLORS.YELLOW || '#F5C518'} />
                <Text style={styles.statText}>
                  {movie.rating || (movie.likes > movie.dislikes ? "8.5" : "7.2")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="heart" size={14} color={COLORS.HEART || '#FF6B6B'} />
                <Text style={styles.statText}>
                  {movie.likes || 0}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="eye" size={14} color={COLORS.ACTIVE || '#E50914'} />
                <Text style={styles.statText}>
                  {movie.views || 0}
                </Text>
              </View>
            </View>

            {/* Author info nếu có */}
            {movie.author && (
                <View style={styles.authorContainer}>
                  <Text style={styles.authorText} numberOfLines={1}>
                    Đạo diễn: {movie.author.fullName}
                  </Text>
                </View>
            )}

            {/* Category badge */}
            {movie.category && (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {movie.category.name}
                  </Text>
                </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 5,
  },
  touchableContainer: {
    width: CARD_WIDTH,
  },
  container: {
    backgroundColor: COLORS.BLACK || '#000',
    height: CARD_HEIGHT,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  imageBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  imageStyle: {
    borderRadius: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  imdbContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: COLORS.YELLOW || '#F5C518',
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6,
    elevation: 3,
  },
  imdbImage: {
    height: 12,
    width: 30,
    marginRight: 3,
  },
  imdbLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.BLACK || '#000',
    marginRight: 2,
  },
  imdbRating: {
    fontSize: 11,
    color: COLORS.BLACK || '#000',
    fontFamily: FONTS.EXTRA_BOLD || 'System',
    fontWeight: 'bold',
  },
  heartIconWrapper: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  heartBackground: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  heartBackgroundLiked: {
    backgroundColor: COLORS.HEART || '#FF6B6B',
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    opacity: 0.8,
  },
  playIconBackground: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE || '#FFF',
  },
  playIcon: {
    marginLeft: 2, // Center the play icon
  },
  genreBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.ACTIVE || '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: COLORS.WHITE || '#FFF',
    fontSize: 10,
    fontFamily: FONTS.BOLD || 'System',
    fontWeight: 'bold',
  },
  yearBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: {
    color: COLORS.WHITE || '#FFF',
    fontSize: 10,
    fontFamily: FONTS.BOLD || 'System',
    fontWeight: 'bold',
  },
  movieInfoContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  movieTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD || 'System',
    fontWeight: 'bold',
    color: COLORS.WHITE || '#FFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  movieDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  movieYear: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR || 'System',
    color: COLORS.GRAY || '#999',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.GRAY || '#999',
    marginHorizontal: 8,
  },
  movieDuration: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR || 'System',
    color: COLORS.GRAY || '#999',
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR || 'System',
    color: COLORS.GRAY || '#999',
    marginLeft: 3,
  },
  authorContainer: {
    marginBottom: 4,
  },
  authorText: {
    fontSize: 10,
    fontFamily: FONTS.REGULAR || 'System',
    color: COLORS.GRAY || '#999',
    fontStyle: 'italic',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontFamily: FONTS.REGULAR || 'System',
    color: COLORS.ACTIVE || '#E50914',
    fontWeight: '500',
  },
});

export default MovieCard;
