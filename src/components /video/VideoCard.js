// src/components/video/VideoCard.js
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

const VideoCard = ({ video, onPress, heartLess = false }) => {
    console.log('VideoCard received video:', video?.id);

    if (!video) {
        console.warn('VideoCard: video prop is undefined');
        return null;
    }

    const movieProduct = video?.movieProduct;

    // Nếu có movieProduct, sử dụng thông tin từ đó
    if (movieProduct) {
        const movieTitle = movieProduct.title || 'Không có tiêu đề';
        const movieYear = movieProduct.year || 'N/A';
        const movieViews = movieProduct.views || 0;
        const movieLikes = movieProduct.likes || 0;
        const movieTime = movieProduct.time || 0;
        const posterUrl = movieProduct.imgMovie;

        const imageUri = posterUrl
            ? `http://192.168.1.73:8082/api/movieProduct/view?bucketName=thanh&path=${posterUrl}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

        return (
            <TouchableOpacity
                style={styles.container}
                onPress={() => onPress && onPress()}
                activeOpacity={0.8}
            >
                <View style={styles.posterContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.poster}
                        resizeMode="cover"
                        onError={(error) => {
                            console.warn('VideoCard: Image failed to load', error);
                        }}
                    />

                    <View style={styles.playOverlay}>
                        <View style={styles.playButton}>
                            <Icon name="play-arrow" size={24} color={COLORS.WHITE} />
                        </View>
                    </View>

                    {!heartLess && (
                        <TouchableOpacity style={styles.heartButton}>
                            <Icon name="favorite-border" size={20} color={COLORS.WHITE} />
                        </TouchableOpacity>
                    )}

                    {movieTime > 0 && (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{movieTime}p</Text>
                        </View>
                    )}

                    {video.availableQualities && video.availableQualities.length > 0 && (
                        <View style={styles.qualityBadge}>
                            <Text style={styles.qualityText}>
                                {video.availableQualities[video.availableQualities.length - 1]}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.statusBadge,
                        video.status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending
                    ]}>
                        <Text style={styles.statusText}>
                            {video.status === 'COMPLETED' ? '✓' : '⏳'}
                        </Text>
                    </View>
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

                        {video.fileSize && (
                            <View style={styles.stat}>
                                <Icon name="storage" size={12} color={COLORS.GRAY} />
                                <Text style={styles.statText}>
                                    {(video.fileSize / (1024 * 1024)).toFixed(0)}MB
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Nếu không có movieProduct, hiển thị thông tin cơ bản từ video
    const videoTitle = video.originalFileName?.replace('.mp4', '') || 'Video không có tên';
    const videoSize = video.fileSize ? `${(video.fileSize / (1024 * 1024)).toFixed(1)}MB` : 'N/A';
    const watchedDate = video.watchedAt ? new Date(video.watchedAt).toLocaleDateString('vi-VN') : 'N/A';

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress()}
            activeOpacity={0.8}
        >
            <View style={styles.posterContainer}>
                <View style={styles.noImageContainer}>
                    <Icon name="movie" size={40} color={COLORS.GRAY} />
                    <Text style={styles.noImageText}>Video</Text>
                </View>

                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Icon name="play-arrow" size={24} color={COLORS.WHITE} />
                    </View>
                </View>

                {video.availableQualities && video.availableQualities.length > 0 && (
                    <View style={styles.qualityBadge}>
                        <Text style={styles.qualityText}>
                            {video.availableQualities[video.availableQualities.length - 1]}
                        </Text>
                    </View>
                )}

                <View style={[styles.statusBadge,
                    video.status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending
                ]}>
                    <Text style={styles.statusText}>
                        {video.status === 'COMPLETED' ? '✓' : '⏳'}
                    </Text>
                </View>
            </View>

            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                    {videoTitle}
                </Text>
                <Text style={styles.movieMeta} numberOfLines={1}>
                    {videoSize} • {watchedDate}
                </Text>
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Icon name="high-quality" size={12} color={COLORS.GRAY} />
                        <Text style={styles.statText}>
                            {video.availableQualities?.[video.availableQualities.length - 1] || 'HD'}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Icon name="play-circle-filled" size={12} color={COLORS.ACTIVE} />
                        <Text style={styles.statText}>Video</Text>
                    </View>
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
    noImageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: COLORS.GRAY,
        fontSize: 10,
        marginTop: 8,
        fontFamily: FONTS.REGULAR,
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
    qualityBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(229, 9, 20, 0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    qualityText: {
        color: COLORS.WHITE,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    statusCompleted: {
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 152, 0, 0.8)',
    },
    statusText: {
        color: COLORS.WHITE,
        fontSize: 10,
        fontWeight: 'bold',
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
        flexWrap: 'wrap',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 2,
    },
    statText: {
        fontSize: 10,
        color: COLORS.GRAY,
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
});

// 🔥 CRITICAL: Đảm bảo default export
export default VideoCard;
