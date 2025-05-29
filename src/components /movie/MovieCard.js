import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/Colors';
import { FONTS } from '../../constants/Fonts';
import favoriteService from '../../services/FavoriteService';

const { width } = Dimensions.get('window');

const MovieCard = ({ movie, onPress, heartLess = false, onFavoriteChange }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
    const [heartScale] = useState(new Animated.Value(1));
    
    if (!movie) {
        console.warn('MovieCard: movie prop is undefined');
        return null;
    }

    const movieTitle = movie?.title || 'Không có tiêu đề';
    const movieYear = movie?.year || 'N/A';
    const movieViews = movie?.views || 0;
    const movieLikes = movie?.likes || 0;
    const movieTime = movie?.time || movie?.duration || 0;
    const posterUrl = movie?.poster || movie?.imgMovie || movie?.image;

    useEffect(() => {
        if (movie?.id && !heartLess) {
            checkFavoriteStatus();
        }
    }, [movie?.id, heartLess]);

    const checkFavoriteStatus = async () => {
        try {
            const response = await favoriteService.checkIsFavorite(movie.id);
            setIsFavorite(response.isFavorite);
        } catch (error) {
            console.warn('MovieCard: Error checking favorite status:', error);
        }
    };

    const handleFavoriteToggle = async (event) => {
        event.stopPropagation();
        
        if (isLoadingFavorite) return;

        try {
            setIsLoadingFavorite(true);
            
            Animated.sequence([
                Animated.timing(heartScale, {
                    toValue: 1.3,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(heartScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();

            const newFavoriteState = !isFavorite;
            setIsFavorite(newFavoriteState);

            const response = await favoriteService.toggleFavorite(movie.id);
            
            setIsFavorite(response.isFavorite);
            
            if (onFavoriteChange) {
                onFavoriteChange(movie.id, response.isFavorite);
            }
            
            console.log(`💖 Movie "${movie.title}" ${response.isFavorite ? 'added to' : 'removed from'} favorites`);
        } catch (error) {
            console.error('❌ Error toggling favorite in MovieCard:', error);
            
            setIsFavorite(!isFavorite);
        } finally {
            setIsLoadingFavorite(false);
        }
    };

    const imageUri = posterUrl
        ? (posterUrl.startsWith('http')
            ? posterUrl
            : `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${posterUrl}`)
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

    const handlePress = () => {
        if (onPress && movie?.id) {
            onPress(movie.id);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.posterContainer}>
                <Image
                    source={{ uri: imageUri }}
                    style={styles.poster}
                    resizeMode="cover"
                    onError={(error) => {
                        console.warn('MovieCard: Image failed to load', error);
                    }}
                />

                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Icon name="play-arrow" size={24} color={COLORS.WHITE} />
                    </View>
                </View>

                {!heartLess && (
                    <TouchableOpacity 
                        style={[
                            styles.heartButton,
                            isFavorite && styles.heartButtonActive,
                            isLoadingFavorite && styles.heartButtonLoading
                        ]}
                        onPress={handleFavoriteToggle}
                        disabled={isLoadingFavorite}
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Ionicons 
                                name={isFavorite ? "heart" : "heart-outline"} 
                                size={20} 
                                color={isFavorite ? "#E50914" : COLORS.WHITE}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                )}

                {isFavorite && !heartLess && (
                    <View style={styles.favoriteIndicator}>
                        <Text style={styles.favoriteIndicatorText}>♥</Text>
                    </View>
                )}

                {movieTime > 0 && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{movieTime}p</Text>
                    </View>
                )}
            </View>

            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                    {movieTitle}
                </Text>

                <Text style={styles.movieMeta} numberOfLines={1}>
                    {movieYear}
                </Text>

                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Icon name="visibility" size={12} color={COLORS.GRAY} />
                        <Text style={styles.statText}>{movieViews}</Text>
                    </View>

                    <View style={styles.stat}>
                        <Icon name="favorite" size={12} color={COLORS.HEART} />
                        <Text style={styles.statText}>{movieLikes}</Text>
                    </View>

                    {isFavorite && (
                        <View style={styles.stat}>
                            <Ionicons name="checkmark-circle" size={12} color="#00D084" />
                            <Text style={[styles.statText, styles.favoriteStatText]}>DS</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width * 0.4,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    posterContainer: {
        position: 'relative',
        aspectRatio: 2/3,
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    playButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 30,
        padding: 12,
    },
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    heartButtonActive: {
        backgroundColor: 'rgba(229, 9, 20, 0.2)',
        borderColor: '#E50914',
    },
    heartButtonLoading: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        opacity: 0.7,
    },
    favoriteIndicator: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#E50914',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    favoriteIndicatorText: {
        color: COLORS.WHITE,
        fontSize: 10,
        fontWeight: 'bold',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: COLORS.WHITE,
        fontSize: 10,
        fontWeight: '500',
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
    movieMeta: {
        fontSize: 12,
        color: COLORS.GRAY,
        marginBottom: 8,
        fontFamily: FONTS.REGULAR,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 10,
        color: COLORS.GRAY,
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
    favoriteStatText: {
        color: '#00D084',
        fontWeight: 'bold',
    },
});

export default MovieCard;
