import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  StyleSheet, 
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';
import { SCREEN_HEIGHT } from '../../constants/Dimensions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ✨ ENHANCED: Netflix-style Hero Section with auto-playing preview
const HeroSection = ({ movie, onPress, onAddToWatchlist, isAutoPlaying = false }) => {
    if (!movie) {
        return null;
    }

    // Animation states
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // ✨ NETFLIX FEATURE: Auto-scaling animation
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                })
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [movie.id]);

    // Enhanced movie data processing
    const displayData = {
        title: movie.title || 'Video không có tên',
        description: movie.description || 'Video đang chờ bạn khám phá...',
        views: movie.views || 0,
        likes: movie.likes || 0,
        time: movie.time || movie.duration || 0,
        imgMovie: movie.imgMovie,
        year: movie.year || new Date().getFullYear(),
        rating: movie.rating || 'PG-13',
        categories: movie.categories || [],
    };

    const imageUri = displayData.imgMovie
        ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${displayData.imgMovie}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            {/* ✨ NETFLIX FEATURE: Animated background with subtle zoom */}
            <Animated.View style={[styles.backgroundContainer, { transform: [{ scale: scaleAnim }] }]}>
                <ImageBackground
                    source={{ uri: imageUri }}
                    style={styles.background}
                    resizeMode="cover"
                    onLoad={() => setIsVideoLoaded(true)}
                >
                    {/* ✨ NETFLIX FEATURE: Multiple gradient layers for depth */}
                    <LinearGradient
                        colors={[
                            'rgba(0,0,0,0.1)',
                            'rgba(0,0,0,0.3)',
                            'rgba(0,0,0,0.6)',
                            'rgba(0,0,0,0.9)'
                        ]}
                        style={styles.gradient}
                        locations={[0, 0.4, 0.7, 1]}
                    >
                        {/* ✨ NETFLIX FEATURE: Enhanced content layout */}
                        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                            
                            {/* Netflix-style badge */}
                            <View style={styles.badgeContainer}>
                                <View style={styles.netflixBadge}>
                                    <Text style={styles.netflixBadgeText}>N</Text>
                                </View>
                                <Text style={styles.seriesText}>PHIM SERIES</Text>
                            </View>

                            {/* Enhanced title with shadows */}
                            <Text style={styles.title}>{displayData.title}</Text>
                            
                            {/* ✨ NETFLIX FEATURE: Movie metadata row */}
                            <MovieMetadata movie={movie} displayData={displayData} />
                            
                            {/* Enhanced description */}
                            <Text style={styles.description} numberOfLines={3}>
                                {displayData.description}
                            </Text>

                            {/* ✨ NETFLIX FEATURE: Enhanced stats */}
                            <MovieStats movie={movie} displayData={displayData} />
                            
                            {/* ✨ NETFLIX FEATURE: Premium action buttons */}
                            <NetflixHeroActions
                                onPlay={() => onPress(movie.id)}
                                onAddToWatchlist={onAddToWatchlist}
                                onMoreInfo={() => console.log('More info')}
                            />
                        </Animated.View>
                    </LinearGradient>
                </ImageBackground>
            </Animated.View>

            {/* ✨ NETFLIX FEATURE: Auto-playing indicator */}
            {isAutoPlaying && (
                <View style={styles.autoPlayIndicator}>
                    <Icon name="play-circle-filled" size={16} color="#E50914" />
                    <Text style={styles.autoPlayText}>Auto Preview</Text>
                </View>
            )}
        </View>
    );
};

// ✨ NETFLIX FEATURE: Movie metadata component
const MovieMetadata = ({ movie, displayData }) => (
    <View style={styles.metadata}>
        <Text style={styles.year}>{displayData.year}</Text>
        <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{displayData.rating}</Text>
        </View>
        <Text style={styles.duration}>{Math.floor(displayData.time / 60)}h {displayData.time % 60}m</Text>
        <View style={styles.hdBadge}>
            <Text style={styles.hdText}>HD</Text>
        </View>
    </View>
);

// ✨ ENHANCED: Netflix-style stats
const MovieStats = ({ movie, displayData }) => (
    <View style={styles.stats}>
        <View style={styles.stat}>
            <Icon name="visibility" size={16} color="#fff" />
            <Text style={styles.statText}>{formatNumber(displayData.views)} views</Text>
        </View>
        <View style={styles.stat}>
            <Icon name="thumb-up" size={16} color="#fff" />
            <Text style={styles.statText}>{formatNumber(displayData.likes)}</Text>
        </View>
        {movie._qualities && movie._qualities.length > 0 && (
            <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>
                    {movie._qualities[movie._qualities.length - 1]}
                </Text>
            </View>
        )}
    </View>
);

// ✨ NETFLIX FEATURE: Premium action buttons
const NetflixHeroActions = ({ onPlay, onAddToWatchlist, onMoreInfo }) => (
    <View style={styles.actions}>
        {/* Primary Play Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={onPlay}>
            <Icon name="play-arrow" size={24} color="#000" />
            <Text style={styles.primaryButtonText}>▶ Phát</Text>
        </TouchableOpacity>
        
        {/* Secondary Actions Row */}
        <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onAddToWatchlist}>
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.secondaryButtonText}>Danh sách của tôi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onMoreInfo}>
                <Icon name="info-outline" size={20} color="#fff" />
                <Text style={styles.secondaryButtonText}>Thông tin</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// Helper function
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

const styles = StyleSheet.create({
    container: {
        height: screenHeight * 0.7, // Taller Netflix-style
        position: 'relative',
    },
    backgroundContainer: {
        flex: 1,
    },
    background: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    
    // ✨ NETFLIX FEATURE: Badge styling
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    netflixBadge: {
        backgroundColor: '#E50914',
        width: 20,
        height: 20,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    netflixBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    seriesText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 2,
        fontFamily: FONTS.BOLD,
    },
    
    // Enhanced title
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 15,
        fontFamily: FONTS.BOLD,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        lineHeight: 45,
    },
    
    // ✨ NETFLIX FEATURE: Metadata styling
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    year: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 12,
        fontFamily: FONTS.REGULAR,
    },
    ratingBadge: {
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 12,
        borderRadius: 2,
    },
    ratingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    duration: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 12,
        fontFamily: FONTS.REGULAR,
    },
    hdBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    hdText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    
    // Enhanced description
    description: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
        marginBottom: 20,
        fontFamily: FONTS.REGULAR,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    
    // Enhanced stats
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        flexWrap: 'wrap',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        marginBottom: 5,
    },
    statText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 6,
        fontFamily: FONTS.REGULAR,
        fontWeight: '500',
    },
    qualityBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginLeft: 'auto',
    },
    qualityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    
    // ✨ NETFLIX FEATURE: Premium action buttons
    actions: {
        marginBottom: 20,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 4,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        fontFamily: FONTS.BOLD,
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        flex: 0.45,
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 6,
        fontFamily: FONTS.REGULAR,
        fontWeight: '500',
    },
    
    // ✨ NETFLIX FEATURE: Auto-play indicator
    autoPlayIndicator: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    autoPlayText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
});

export default HeroSection;
