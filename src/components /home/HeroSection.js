import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';
import { SCREEN_HEIGHT } from '../../constants/Dimensions';

const HeroSection = ({ movie, onPress, onAddToWatchlist }) => {
    // const imageUri = movie.imgMovie
    //     ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`
    //     : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const imageUri = movie.imgMovie
        ? `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: imageUri }}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.gradient}>
                    <View style={styles.content}>
                        <Text style={styles.title}>{movie.title}</Text>
                        <Text style={styles.description} numberOfLines={3}>
                            {movie.description || "Một bộ phim tuyệt vời đang chờ bạn khám phá..."}
                        </Text>

                        <MovieStats movie={movie} />
                        <HeroActions
                            onPlay={() => onPress(movie.id)}
                            onAddToWatchlist={onAddToWatchlist}
                        />
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

const MovieStats = ({ movie }) => (
    <View style={styles.stats}>
        <View style={styles.stat}>
            <Icon name="visibility" size={16} color={COLORS.WHITE} />
            <Text style={styles.statText}>{movie.views} lượt xem</Text>
        </View>
        <View style={styles.stat}>
            <Icon name="favorite" size={16} color={COLORS.HEART} />
            <Text style={styles.statText}>{movie.likes} lượt thích</Text>
        </View>
        <View style={styles.stat}>
            <Icon name="access-time" size={16} color={COLORS.WHITE} />
            <Text style={styles.statText}>{movie.time} phút</Text>
        </View>
    </View>
);

const HeroActions = ({ onPlay, onAddToWatchlist }) => (
    <View style={styles.actions}>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
            <Icon name="play-arrow" size={24} color={COLORS.WHITE} />
            <Text style={styles.playButtonText}>Xem ngay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={onAddToWatchlist}>
            <Icon name="add" size={24} color={COLORS.WHITE} />
            <Text style={styles.addButtonText}>Danh sách</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        height: SCREEN_HEIGHT * 0.6,
        marginBottom: 20,
    },
    background: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 10,
        fontFamily: FONTS.BOLD,
    },
    description: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 22,
        marginBottom: 15,
        fontFamily: FONTS.REGULAR,
    },
    stats: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    statText: {
        color: COLORS.WHITE,
        fontSize: 14,
        marginLeft: 5,
        fontFamily: FONTS.REGULAR,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.ACTIVE,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginRight: 15,
    },
    playButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
        fontFamily: FONTS.BOLD,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    addButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        marginLeft: 5,
        fontFamily: FONTS.REGULAR,
    },
});

export default HeroSection;
