// VideoCard.js - React Native version
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoApiService from '../api/VideoApiService';

const { width } = Dimensions.get('window');
const videoApiService = new VideoApiService();

const VideoCard = ({ video, onPlay, viewMode = 'grid' }) => {
    const handlePlay = () => {
        onPlay(video.id);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'UPLOADING': '#2563EB',
            'PROCESSING': '#D97706',
            'COMPLETED': '#059669',
            'FAILED': '#DC2626'
        };
        return colorMap[status] || '#6B7280';
    };

    if (viewMode === 'list') {
        return (
            <TouchableOpacity style={styles.listContainer} activeOpacity={0.8}>
                <View style={styles.listThumbnail}>
                    {video.thumbnailPath ? (
                        <Image
                            source={{ uri: video.thumbnailPath }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderThumbnail}>
                            <Ionicons name="film-outline" size={24} color="white" />
                        </View>
                    )}
                </View>

                <View style={styles.listContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                        {video.originalFileName}
                    </Text>
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                        {video.movieProduct?.title || 'Chưa có tiêu đề'}
                    </Text>

                    <View style={styles.listMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.metaText}>{formatDate(video.uploadedAt)}</Text>
                        </View>
                        <Text style={styles.metaText}>
                            {videoApiService.formatFileSize(video.fileSize)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(video.status) }]}>
                            <Text style={styles.statusText}>
                                {videoApiService.getStatusDisplayName(video.status)}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handlePlay}
                    disabled={video.status !== 'COMPLETED'}
                    style={[
                        styles.playButton,
                        video.status !== 'COMPLETED' && styles.playButtonDisabled
                    ]}
                >
                    <Ionicons name="play" size={16} color="white" />
                    <Text style={styles.playButtonText}>Phát</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }

    // Grid view
    return (
        <TouchableOpacity style={styles.gridContainer} activeOpacity={0.8}>
            <View style={styles.gridThumbnail}>
                {video.thumbnailPath ? (
                    <Image
                        source={{ uri: video.thumbnailPath }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderThumbnail}>
                        <Ionicons name="film-outline" size={48} color="white" />
                    </View>
                )}

                <TouchableOpacity
                    onPress={handlePlay}
                    disabled={video.status !== 'COMPLETED'}
                    style={styles.playOverlay}
                >
                    <View style={[
                        styles.playIconContainer,
                        video.status !== 'COMPLETED' && styles.playIconDisabled
                    ]}>
                        <Ionicons name="play" size={32} color="white" />
                    </View>
                </TouchableOpacity>

                <View style={styles.statusBadgeOverlay}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(video.status) }]}>
                        <Text style={styles.statusText}>
                            {videoApiService.getStatusDisplayName(video.status)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.gridContent}>
                <Text style={styles.gridTitle} numberOfLines={1}>
                    {video.originalFileName}
                </Text>
                <Text style={styles.gridSubtitle} numberOfLines={1}>
                    {video.movieProduct?.title || 'Chưa có tiêu đề'}
                </Text>

                <View style={styles.gridMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.metaText}>{formatDate(video.uploadedAt)}</Text>
                    </View>
                    <Text style={styles.metaText}>
                        {videoApiService.formatFileSize(video.fileSize)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // List View Styles
    listContainer: {
        backgroundColor: '#1F2937',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    listThumbnail: {
        width: 128,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 16,
    },
    listContent: {
        flex: 1,
        marginRight: 16,
    },
    listTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    listSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
    listMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        flexWrap: 'wrap',
    },

    // Grid View Styles
    gridContainer: {
        backgroundColor: '#1F2937',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
        width: (width - 48) / 2, // 2 columns with padding
    },
    gridThumbnail: {
        aspectRatio: 16 / 9,
        position: 'relative',
    },
    gridContent: {
        padding: 16,
    },
    gridTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    gridSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
    gridMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },

    // Common Styles
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 40,
        padding: 16,
    },
    playIconDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statusBadgeOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginLeft: 4,
    },
    playButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButtonDisabled: {
        backgroundColor: '#4B5563',
    },
    playButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default VideoCard;
