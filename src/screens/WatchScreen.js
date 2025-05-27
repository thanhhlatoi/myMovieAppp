// WatchScreen.js - React Native Expo version
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StatusBar,
    Dimensions
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import VideoApiService from '../services/VideoApiService'; // Tái sử dụng service

const { width, height } = Dimensions.get('window');

const WatchScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;
    const videoRef = useRef(null);
    const videoApiService = useRef(new VideoApiService()).current;

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);
    const [availableQualities, setAvailableQualities] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Fetch video info
    const fetchVideoInfo = async () => {
        try {
            const data = await videoApiService.getVideoById(id);
            setVideoInfo(data);
            return data;
        } catch (err) {
            console.error('Error fetching video info:', err);
            setError('Không thể tải thông tin video');
            throw err;
        }
    };

    // Test HLS structure
    const testHLSStructure = async () => {
        try {
            console.log('🔧 Testing HLS structure...');
            const testResult = await videoApiService.testHLSStructure(id);

            if (!testResult.valid) {
                throw new Error(`HLS structure invalid: ${testResult.error || 'Unknown error'}`);
            }

            console.log('✅ HLS structure is valid');
            setAvailableQualities(testResult.qualities);
            return testResult;
        } catch (err) {
            console.error('❌ HLS structure test failed:', err);
            throw err;
        }
    };

    // Initialize player
    useEffect(() => {
        const initPlayer = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log(`🎬 Initializing player for video ${id}`);

                // 1. Fetch video info
                await fetchVideoInfo();

                // 2. Test HLS structure
                await testHLSStructure();

                setLoading(false);
            } catch (err) {
                console.error('Error initializing player:', err);
                setError(err.message || 'Không thể khởi tạo video player');
                setLoading(false);
            }
        };

        if (id) {
            initPlayer();
        }
    }, [id]);

    // Handle video load
    const handleVideoLoad = (status) => {
        console.log('Video loaded:', status);
    };

    // Handle playback status
    const handlePlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
        }
    };

    // Handle video error
    const handleVideoError = (error) => {
        console.error('Video error:', error);
        setError('Lỗi phát video: ' + error);
    };

    // Play/Pause toggle
    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    };

    // Retry function
    const handleRetry = () => {
        setError(null);
        setLoading(true);

        setTimeout(async () => {
            try {
                await fetchVideoInfo();
                await testHLSStructure();
                setLoading(false);
            } catch (err) {
                console.error('Retry failed:', err);
                setError(err.message || 'Không thể khởi tạo video player');
                setLoading(false);
            }
        }, 500);
    };

    // Get master playlist URL
    const getMasterPlaylistUrl = () => {
        return videoApiService.getMasterPlaylistUrl(id);
    };

    // Handle controls visibility
    const toggleControls = () => {
        setShowControls(!showControls);
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                    <Text style={styles.backText}>Quay lại</Text>
                </TouchableOpacity>
            </View>

            {/* Video Player Container */}
            <View style={styles.videoContainer}>
                {/* Loading */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Đang tải video...</Text>
                        <Text style={styles.loadingSubText}>Đang kiểm tra HLS structure...</Text>
                    </View>
                )}

                {/* Error */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorTitle}>Lỗi phát video</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <View style={styles.errorButtons}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.primaryButton}
                            >
                                <Text style={styles.buttonText}>Quay lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleRetry}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.buttonText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Video Player */}
                {!loading && !error && (
                    <TouchableOpacity
                        style={styles.videoPlayer}
                        activeOpacity={1}
                        onPress={toggleControls}
                    >
                        <Video
                            ref={videoRef}
                            source={{ uri: getMasterPlaylistUrl() }}
                            style={styles.video}
                            shouldPlay={false}
                            isLooping={false}
                            resizeMode={ResizeMode.CONTAIN}
                            onLoad={handleVideoLoad}
                            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                            onError={handleVideoError}
                            useNativeControls={showControls}
                        />

                        {/* Custom Play/Pause Overlay */}
                        {!showControls && (
                            <View style={styles.controlsOverlay}>
                                <TouchableOpacity
                                    onPress={togglePlayPause}
                                    style={styles.playButton}
                                >
                                    <Ionicons
                                        name={isPlaying ? "pause" : "play"}
                                        size={60}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Debug Info */}
            {__DEV__ && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugTitle}>Debug Info:</Text>
                    <Text style={styles.debugText}>Video ID: {id}</Text>
                    <Text style={styles.debugText}>
                        Master Playlist: {videoApiService.getMasterPlaylistUrl(id)}
                    </Text>
                    {videoInfo?.movieProduct?.title && (
                        <Text style={styles.debugText}>
                            Title: {videoInfo.movieProduct.title}
                        </Text>
                    )}
                    <Text style={styles.debugText}>
                        Available Qualities: {availableQualities.length}
                    </Text>
                    {availableQualities.map((quality, index) => (
                        <Text key={index} style={styles.debugQuality}>
                            • {quality.label} ({quality.bandwidth} bps)
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        backgroundColor: '#1F2937',
        padding: 16,
        paddingTop: 40, // Status bar padding
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: 'white',
        marginLeft: 8,
        fontSize: 16,
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 16,
    },
    loadingSubText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 8,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 24,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorMessage: {
        color: '#D1D5DB',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    secondaryButton: {
        backgroundColor: '#4B5563',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    videoPlayer: {
        width: width,
        height: height * 0.7,
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    controlsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 50,
        padding: 20,
    },
    debugContainer: {
        backgroundColor: '#1F2937',
        padding: 16,
    },
    debugTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    debugText: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 4,
    },
    debugQuality: {
        color: '#9CA3AF',
        fontSize: 10,
        marginLeft: 8,
    },
});

export default WatchScreen;
