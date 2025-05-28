import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/Colors';
import { FONTS } from '../../constants/Fonts';
const { width } = Dimensions.get('window');

const MovieCard = ({ movie, onPress, heartLess = false }) => {
    // 🔥 DEFENSIVE PROGRAMMING - Check if movie exists
    if (!movie) {
        console.warn('MovieCard: movie prop is undefined');
        return null;
    }

    // 🔥 SAFE ACCESS - Use optional chaining
    const movieTitle = movie?.title || 'Không có tiêu đề';
    const movieYear = movie?.year || 'N/A';
    const movieViews = movie?.views || 0;
    const movieLikes = movie?.likes || 0;
    const movieTime = movie?.time || movie?.duration || 0;
    const posterUrl = movie?.poster || movie?.imgMovie || movie?.image;

    // Generate image URL safely
    const imageUri = posterUrl
        ? (posterUrl.startsWith('http')
            ? posterUrl
            : `http://192.168.1.73:8082/api/movieProduct/view?bucketName=thanh&path=${posterUrl}`)
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
            {/* Poster */}
            <View style={styles.posterContainer}>
                <Image
                    source={{ uri: imageUri }}
                    style={styles.poster}
                    resizeMode="cover"
                    onError={(error) => {
                        console.warn('MovieCard: Image failed to load', error);
                    }}
                />

                {/* Play Overlay */}
                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Icon name="play-arrow" size={24} color={COLORS.WHITE} />
                    </View>
                </View>

                {/* Heart/Like Button */}
                {!heartLess && (
                    <TouchableOpacity style={styles.heartButton}>
                        <Icon name="favorite-border" size={20} color={COLORS.WHITE} />
                    </TouchableOpacity>
                )}

                {/* Duration Badge */}
                {movieTime > 0 && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{movieTime}p</Text>
                    </View>
                )}
            </View>

            {/* Movie Info */}
            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                    {movieTitle}
                </Text>

                <Text style={styles.movieMeta} numberOfLines={1}>
                    {movieYear}
                </Text>

                {/* Stats */}
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Icon name="visibility" size={12} color={COLORS.GRAY} />
                        <Text style={styles.statText}>{movieViews}</Text>
                    </View>

                    <View style={styles.stat}>
                        <Icon name="favorite" size={12} color={COLORS.HEART} />
                        <Text style={styles.statText}>{movieLikes}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width * 0.4, // 40% of screen width
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    posterContainer: {
        position: 'relative',
        aspectRatio: 2/3, // Movie poster aspect ratio
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 6,
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
});

// 🔥 CRITICAL: Ensure default export
export default MovieCard;
