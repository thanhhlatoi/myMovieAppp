// 📄 src/components/review/ReviewCard.js - Netflix-Style Review Card
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/Colors';
import { FONTS } from '../../constants/Fonts';
import ReviewService from '../../services/ReviewService';

const ReviewCard = ({ 
    review, 
    isCurrentUser = false, 
    onEdit, 
    onDelete, 
    onLike,
    style 
}) => {
    const [expanded, setExpanded] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(review.likes || 0);
    const [scaleAnim] = useState(new Animated.Value(1));

    const handleLike = () => {
        // Animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();

        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        
        if (onLike) {
            onLike(review.id, newLiked);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(review);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Xóa đánh giá',
            'Bạn có chắc chắn muốn xóa đánh giá này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        if (onDelete) {
                            onDelete(review.id);
                        }
                    }
                }
            ]
        );
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon
                    key={i}
                    name={i <= rating ? "star" : "star-border"}
                    size={16}
                    color={i <= rating ? "#FFD700" : "#666"}
                />
            );
        }
        return stars;
    };

    const getDefaultAvatar = () => {
        return 'https://via.placeholder.com/50x50/333/FFF?text=' + 
               (review.userName ? review.userName.charAt(0).toUpperCase() : 'U');
    };

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={['#1a1a1a', '#0d0d0d']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image 
                            source={{ 
                                uri: review.userAvatar || getDefaultAvatar()
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {review.userName || 'Người dùng ẩn danh'}
                            </Text>
                            <Text style={styles.timeAgo}>
                                {review.timeAgo}
                                {review.isEdited && (
                                    <Text style={styles.editedText}> • Đã chỉnh sửa</Text>
                                )}
                            </Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {isCurrentUser && (
                            <>
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={handleEdit}
                                >
                                    <Icon name="edit" size={20} color="#999" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={handleDelete}
                                >
                                    <Icon name="delete" size={20} color="#E50914" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                        {renderStars(review.rating)}
                    </View>
                    <Text style={styles.ratingText}>
                        {review.rating}/5
                    </Text>
                </View>

                {/* Comment */}
                {review.comment && (
                    <View style={styles.commentContainer}>
                        <Text 
                            style={styles.comment}
                            numberOfLines={expanded ? undefined : 3}
                        >
                            {review.comment}
                        </Text>
                        {review.comment.length > 150 && (
                            <TouchableOpacity 
                                onPress={() => setExpanded(!expanded)}
                                style={styles.expandButton}
                            >
                                <Text style={styles.expandText}>
                                    {expanded ? 'Thu gọn' : 'Xem thêm'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity 
                            style={styles.likeButton}
                            onPress={handleLike}
                        >
                            <Ionicons 
                                name={liked ? "heart" : "heart-outline"} 
                                size={20} 
                                color={liked ? "#E50914" : "#999"} 
                            />
                            <Text style={[
                                styles.likeText,
                                liked && styles.likedText
                            ]}>
                                {likeCount > 0 ? likeCount : ''}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Report button for other users */}
                    {!isCurrentUser && (
                        <TouchableOpacity style={styles.reportButton}>
                            <Icon name="flag" size={16} color="#666" />
                            <Text style={styles.reportText}>Báo cáo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Current user indicator */}
                {isCurrentUser && (
                    <View style={styles.currentUserBadge}>
                        <Text style={styles.currentUserText}>Đánh giá của bạn</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    gradient: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#333',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        marginTop: 2,
    },
    editedText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    commentContainer: {
        marginBottom: 12,
    },
    comment: {
        fontSize: 14,
        color: '#e0e0e0',
        lineHeight: 20,
        fontFamily: FONTS.REGULAR,
    },
    expandButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    expandText: {
        fontSize: 12,
        color: '#E50914',
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    likeText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
    likedText: {
        color: '#E50914',
        fontWeight: 'bold',
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    reportText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        fontFamily: FONTS.REGULAR,
    },
    currentUserBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    currentUserText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
});

export default ReviewCard; 