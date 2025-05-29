// 📄 src/hooks/useHLSVideo.js
import { useState, useEffect, useCallback } from 'react';
import HLSServiceHelper from '../services/HLSServiceHelper';

const useHLSVideo = (videoId, options = {}) => {
    const {
        autoPlay = false,
        initialQuality = null,
        networkType = 'wifi'
    } = options;

    // State management
    const [hlsService] = useState(new HLSServiceHelper());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [availableQualities, setAvailableQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(null);
    const [streamingInfo, setStreamingInfo] = useState(null);
    const [isStreamAvailable, setIsStreamAvailable] = useState(false);

    // Initialize video streaming
    const initializeStreaming = useCallback(async () => {
        if (!videoId) {
            setError("Video ID không hợp lệ");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log("🎬 Initializing HLS streaming for video:", videoId);

            // Get streaming info
            const info = await hlsService.getStreamingInfo(videoId);
            console.log("📊 Streaming info:", info);

            if (!info.isAvailable) {
                throw new Error(info.error || "Video không khả dụng");
            }

            setStreamingInfo(info);
            setAvailableQualities(info.qualities);
            setIsStreamAvailable(true);

            // Get optimized URL based on network type
            let urlResult;
            if (initialQuality) {
                urlResult = await hlsService.getHLSUrl(videoId, initialQuality);
            } else {
                urlResult = await hlsService.getOptimizedUrl(videoId, networkType);
            }

            console.log("🎯 URL result:", urlResult);

            setStreamUrl(urlResult.url);
            setCurrentQuality(urlResult.quality);

            console.log("✅ HLS streaming initialized successfully");

        } catch (err) {
            console.error("❌ Error initializing HLS streaming:", err);
            setError(err.message);
            setIsStreamAvailable(false);
        } finally {
            setLoading(false);
        }
    }, [videoId, initialQuality, networkType, hlsService]);

    // Change video quality
    const changeQuality = useCallback(async (quality) => {
        if (!videoId || !isStreamAvailable) {
            console.warn("Cannot change quality: video not available");
            return;
        }

        try {
            console.log("🔄 Changing quality to:", quality);

            const urlResult = await hlsService.getHLSUrl(videoId, quality);
            console.log("🎯 New URL result:", urlResult);

            setStreamUrl(urlResult.url);
            setCurrentQuality(urlResult.quality);

            console.log("✅ Quality changed successfully");

        } catch (err) {
            console.error("❌ Error changing quality:", err);
            // Don't set error state for quality changes, just log
        }
    }, [videoId, isStreamAvailable, hlsService]);

    // Get quality info
    const getQualityInfo = useCallback((bandwidth) => {
        return hlsService.getQualityInfo(bandwidth);
    }, [hlsService]);

    // Check if specific quality is available
    const isQualityAvailable = useCallback((quality) => {
        return availableQualities.some(q => q.label === quality);
    }, [availableQualities]);

    // Get recommended quality based on network
    const getRecommendedQuality = useCallback(() => {
        if (!availableQualities.length) return null;

        switch (networkType.toLowerCase()) {
            case 'wifi':
                return availableQualities[0]; // Highest quality
            case 'cellular':
            case '4g':
                return availableQualities.find(q =>
                    q.label.includes('720') || q.label.includes('780')
                ) || availableQualities[Math.floor(availableQualities.length / 2)];
            case '3g':
            case 'slow':
                return availableQualities[availableQualities.length - 1]; // Lowest quality
            default:
                return availableQualities[0];
        }
    }, [availableQualities, networkType]);

    // Format utilities
    const formatDuration = useCallback((milliseconds) => {
        return hlsService.formatDuration(milliseconds);
    }, [hlsService]);

    const formatFileSize = useCallback((bytes) => {
        return hlsService.formatFileSize(bytes);
    }, [hlsService]);

    // Generate share URL
    const generateShareUrl = useCallback((startTime = 0) => {
        return hlsService.generateShareUrl(videoId, startTime);
    }, [videoId, hlsService]);

    // Retry streaming initialization
    const retry = useCallback(() => {
        initializeStreaming();
    }, [initializeStreaming]);

    // Initialize on mount or when videoId changes
    useEffect(() => {
        initializeStreaming();
    }, [initializeStreaming]);

    // Return hook interface
    return {
        // State
        loading,
        error,
        streamUrl,
        availableQualities,
        currentQuality,
        streamingInfo,
        isStreamAvailable,

        // Actions
        changeQuality,
        retry,

        // Utilities
        getQualityInfo,
        isQualityAvailable,
        getRecommendedQuality,
        formatDuration,
        formatFileSize,
        generateShareUrl,

        // Data
        masterUrl: streamingInfo?.masterUrl,
        recommendedQuality: getRecommendedQuality(),
        totalQualities: availableQualities.length,
    };
};

export default useHLSVideo;
