// 📄 src/screens/WriteReviewScreen.js - Netflix-Style Write Review Screen
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/Colors';
import { FONTS } from '../constants/Fonts';
import ReviewService from '../services/ReviewService';

const WriteReviewScreen = ({ route, navigation }) => {
    const { movie, existingReview } = route.params || {};
    const isEditing = !!existingReview;

    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [loading, setLoading] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const starAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleStarPress = (selectedRating) => {
        setRating(selectedRating);
        
        // Animate all stars
        const animations = starAnims.map((anim, index) => {
            if (index < selectedRating) {
                return Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1.3,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    })
                ]);
            }
            return Animated.timing(anim, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
            });
        });

        Animated.parallel(animations).start();
    };

    const handleSubmit = async () => {
        if (!rating) {
            Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
            return;
        }

        if (!comment.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nhận xét của bạn');
            return;
        }

        try {
            setLoading(true);

            const reviewData = {
                movieId: movie.id,
                rating: rating,
                comment: comment.trim()
            };

            if (isEditing) {
                await ReviewService.updateReview(existingReview.id, reviewData);
                Alert.alert(
                    'Thành công',
                    'Đánh giá của bạn đã được cập nhật!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                await ReviewService.createReview(reviewData);
                Alert.alert(
                    'Thành công',
                    'Cảm ơn bạn đã đánh giá phim!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert(
                'Lỗi',
                'Không thể gửi đánh giá. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const isSelected = i <= rating;
            const isHovered = i <= hoveredStar;
            
            stars.push(
                <Animated.View
                    key={i}
                    style={{
                        transform: [{ scale: starAnims[i - 1] }]
                    }}
                >
                    <TouchableOpacity
                        style={styles.star}
                        onPress={() => handleStarPress(i)}
                        onPressIn={() => setHoveredStar(i)}
                        onPressOut={() => setHoveredStar(0)}
                    >
                        <Icon
                            name={isSelected || isHovered ? "star" : "star-border"}
                            size={40}
                            color={isSelected || isHovered ? "#FFD700" : "#666"}
                        />
                    </TouchableOpacity>
                </Animated.View>
            );
        }
        return stars;
    };

    const getRatingDescription = () => {
        switch (rating) {
            case 1: return 'Rất tệ';
            case 2: return 'Tệ';
            case 3: return 'Bình thường';
            case 4: return 'Tốt';
            case 5: return 'Xuất sắc';
            default: return 'Chọn số sao đánh giá';
        }
    };

    const imageUri = movie?.imgMovie
        ? (movie.imgMovie.startsWith('http')
            ? movie.imgMovie
            : `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`)
        : 'https://via.placeholder.com/200x300/333/FFF?text=Movie';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <KeyboardAvoidingView 
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <Text style={styles.headerTitle}>
                            {isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                        </Text>
                        
                        <View style={styles.placeholder} />
                    </LinearGradient>

                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Movie Info */}
                        <View style={styles.movieInfo}>
                            <Image source={{ uri: imageUri }} style={styles.moviePoster} />
                            <View style={styles.movieDetails}>
                                <Text style={styles.movieTitle}>{movie?.title || 'Unknown Movie'}</Text>
                                <Text style={styles.movieMeta}>
                                    {movie?.year || '2024'} • {movie?.time || 120} phút
                                </Text>
                            </View>
                        </View>

                        {/* Rating Section */}
                        <View style={styles.ratingSection}>
                            <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
                            
                            <View style={styles.starsContainer}>
                                {renderStars()}
                            </View>
                            
                            <Text style={styles.ratingDescription}>
                                {getRatingDescription()}
                            </Text>
                        </View>

                        {/* Comment Section */}
                        <View style={styles.commentSection}>
                            <Text style={styles.sectionTitle}>Nhận xét</Text>
                            
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
                                    placeholderTextColor="#666"
                                    multiline
                                    textAlignVertical="top"
                                    value={comment}
                                    onChangeText={setComment}
                                    maxLength={500}
                                />
                                <Text style={styles.characterCount}>
                                    {comment.length}/500
                                </Text>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                loading && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#666', '#444'] : ['#E50914', '#B20710']}
                                style={styles.submitGradient}
                            >
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <Text style={styles.submitText}>Đang gửi...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.submitContent}>
                                        <Icon name="send" size={20} color="#fff" />
                                        <Text style={styles.submitText}>
                                            {isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Guidelines */}
                        <View style={styles.guidelines}>
                            <Text style={styles.guidelinesTitle}>Hướng dẫn viết đánh giá:</Text>
                            <Text style={styles.guidelinesText}>
                                • Chia sẻ cảm nhận chân thật về bộ phim{'\n'}
                                • Tránh spoiler cho người khác{'\n'}
                                • Sử dụng ngôn từ lịch sự, tôn trọng{'\n'}
                                • Đánh giá dựa trên nội dung, diễn xuất, kỹ thuật
                            </Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    placeholder: {
        width: 44,
    },
    content: {
        padding: 20,
    },
    movieInfo: {
        flexDirection: 'row',
        marginBottom: 30,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    movieMeta: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },
    ratingSection: {
        marginBottom: 30,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    star: {
        marginHorizontal: 8,
        padding: 4,
    },
    ratingDescription: {
        fontSize: 16,
        color: '#FFD700',
        fontFamily: FONTS.BOLD,
        textAlign: 'center',
    },
    commentSection: {
        marginBottom: 30,
    },
    textInputContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    textInput: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        minHeight: 120,
        maxHeight: 200,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 8,
        fontFamily: FONTS.REGULAR,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 30,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    submitContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 8,
    },
    guidelines: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    guidelinesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    guidelinesText: {
        fontSize: 12,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        lineHeight: 18,
    },
});

export default WriteReviewScreen; 