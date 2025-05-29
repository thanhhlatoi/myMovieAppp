// 📄 src/components/video/HLSVideoPlayer.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import VideoApiService from '../../services/VideoApiService';
import { COLORS } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

const HLSVideoPlayer = ({
                            videoId,
                            onClose,
                            initialQuality = null,
                            autoPlay = true
                        }) => {
    const [videoApiService] = useState(new VideoApiService());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableQualities, setAvailableQualities] = useState([]);
    const [selectedQuality, setSelectedQuality] = useState(null);
    const [currentStreamUrl, setCurrentStreamUrl] = useState(null);
    const [videoStatus, setVideoStatus] = useState({});
    const [controlsVisible, setControlsVisible] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        initializeVideo();
    }, [videoId]);

    useEffect(() => {
        // Auto-hide controls after 3 seconds
        const timer = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [controlsVisible]);

    const initializeVideo = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("🎬 Initializing HLS video player for video ID:", videoId);

            // Test HLS structure first
            const hlsTest = await videoApiService.testHLSStructure(videoId);
            console.log("🔧 HLS test result:", hlsTest);

            if (!hlsTest.valid) {
                throw new Error("Video stream không khả dụng");
            }

            // Get available qualities
            const qualities = await videoApiService.getAvailableQualities(videoId);
            console.log("🎯 Available qualities:", qualities);

            setAvailableQualities(qualities);

            // Set initial quality
            let qualityToUse = null;
            if (initialQuality) {
                qualityToUse = qualities.find(q => q.label === initialQuality);
            }
            if (!qualityToUse && qualities.length > 0) {
                // Use highest quality by default (first in array after sorting)
                qualityToUse = qualities[0];
            }

            if (qualityToUse) {
                await selectQuality(qualityToUse);
            } else {
                // Fallback to master playlist
                const masterUrl = videoApiService.getMasterPlaylistUrl(videoId);
                setCurrentStreamUrl(masterUrl);
                setSelectedQuality('Auto');
            }

        } catch (error) {
            console.error("❌ Error initializing video:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const selectQuality = async (qualityData) => {
        try {
            console.log("🎯 Selecting quality:", qualityData.label);

            let streamUrl;
            if (qualityData.playlistName) {
                // Use sub-playlist for specific quality
                streamUrl = videoApiService.getSubPlaylistUrl(videoId, qualityData.playlistName);
            } else {
                // Fallback to master playlist
                streamUrl = videoApiService.getMasterPlaylistUrl(videoId);
            }

            // Test if the stream URL is accessible
            const testResponse = await fetch(streamUrl, { method: 'HEAD' });
            if (!testResponse.ok) {
                throw new Error(`Stream không khả dụng: ${testResponse.status}`);
            }

            setCurrentStreamUrl(streamUrl);
            setSelectedQuality(qualityData.label);

            console.log("✅ Quality selected:", qualityData.label, "URL:", streamUrl);

        } catch (error) {
            console.error("❌ Error selecting quality:", error);
            Alert.alert("Lỗi", "Không thể chuyển chất lượng video");
        }
    };

    const handleQualityChange = (qualityData) => {
        selectQuality(qualityData);
    };

    const handleVideoError = (error) => {
        console.error("❌ Video playback error:", error);
        setError("Lỗi phát video. Vui lòng thử lại.");
    };

    const handleVideoLoad = (status) => {
        console.log("📺 Video loaded:", status);
        setVideoStatus(status);
    };

    const handleVideoProgress = (status) => {
        setVideoStatus(status);
    };

    const toggleControls = () => {
        setControlsVisible(!controlsVisible);
    };

    const formatTime = (milliseconds) => {
        if (!milliseconds) return "0:00";
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.ACTIVE} />
                    <Text style={styles.loadingText}>Đang tải video...</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={COLORS.ACTIVE} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={initializeVideo}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    if (!currentStreamUrl) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Không có URL stream</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.videoContainer}
                activeOpacity={1}
                onPress={toggleControls}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: currentStreamUrl }}
                    style={styles.video}
                    useNativeControls={false}
                    resizeMode="contain"
                    shouldPlay={autoPlay}
                    isLooping={false}
                    onLoad={handleVideoLoad}
                    onPlaybackStatusUpdate={handleVideoProgress}
                    onError={handleVideoError}
                />
            </TouchableOpacity>

            {/* Controls Overlay */}
            {controlsVisible && (
                <View style={styles.controlsOverlay}>
                    {/* Top Controls */}
                    <View style={styles.topControls}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        {/* Quality Selector */}
                        {availableQualities.length > 0 && (
                            <View style={styles.qualitySelector}>
                                <Text style={styles.qualityLabel}>
                                    {selectedQuality || 'Auto'}
                                </Text>
                                <View style={styles.qualityDropdown}>
                                    {availableQualities.map((quality) => (
                                        <TouchableOpacity
                                            key={quality.label}
                                            style={[
                                                styles.qualityOption,
                                                selectedQuality === quality.label && styles.qualityOptionActive
                                            ]}
                                            onPress={() => handleQualityChange(quality)}
                                        >
                                            <Text style={[
                                                styles.qualityOptionText,
                                                selectedQuality === quality.label && styles.qualityOptionTextActive
                                            ]}>
                                                {quality.label}
                                            </Text>
                                            {quality.bandwidth && (
                                                <Text style={styles.qualityBandwidth}>
                                                    {Math.round(quality.bandwidth / 1000)}kbps
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Bottom Controls */}
                    <View style={styles.bottomControls}>
                        {/* Progress Bar */}
                        {videoStatus.durationMillis && (
                            <View style={styles.progressContainer}>
                                <Text style={styles.timeText}>
                                    {formatTime(videoStatus.positionMillis)}
                                </Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${(videoStatus.positionMillis / videoStatus.durationMillis) * 100}%`
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.timeText}>
                                    {formatTime(videoStatus.durationMillis)}
                                </Text>
                            </View>
                        )}

                        {/* Play/Pause Button */}
                        <View style={styles.playbackControls}>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => {
                                    if (videoStatus.isPlaying) {
                                        videoRef.current?.pauseAsync();
                                    } else {
                                        videoRef.current?.playAsync();
                                    }
                                }}
                            >
                                <Ionicons
                                    name={videoStatus.isPlaying ? "pause" : "play"}
                                    size={32}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Loading Indicator */}
            {videoStatus.isBuffering && (
                <View style={styles.bufferingContainer}>
                    <ActivityIndicator size="large" color={COLORS.ACTIVE} />
                    <Text style={styles.bufferingText}>Đang tải...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    videoContainer: {
        flex: 1,
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
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qualitySelector: {
        alignItems: 'flex-end',
    },
    qualityLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    qualityDropdown: {
        position: 'absolute',
        top: 35,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 8,
        minWidth: 120,
        maxHeight: 300,
    },
    qualityOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    qualityOptionActive: {
        backgroundColor: COLORS.ACTIVE,
    },
    qualityOptionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    qualityOptionTextActive: {
        fontWeight: 'bold',
    },
    qualityBandwidth: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        color: 'white',
        fontSize: 12,
        minWidth: 40,
        textAlign: 'center',
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginHorizontal: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.ACTIVE,
        borderRadius: 2,
    },
    playbackControls: {
        alignItems: 'center',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 20,
    },
    retryButton: {
        backgroundColor: COLORS.ACTIVE,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bufferingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: 'center',
    },
    bufferingText: {
        color: 'white',
        fontSize: 14,
        marginTop: 8,
    },
});

export default HLSVideoPlayer;
