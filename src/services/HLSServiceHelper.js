// 📄 src/services/HLSServiceHelper.js - Updated cho Mobile
import VideoApiService from './VideoApiService';

class HLSServiceHelper {
    constructor() {
        this.videoApiService = new VideoApiService();
    }

    /**
     * Lấy URL HLS cho video với quality cụ thể (Mobile-optimized)
     * @param {number} videoId - ID của video
     * @param {string} quality - Quality mong muốn (1080p, 720p, etc.)
     * @returns {Promise<Object>} - Object chứa URL và thông tin quality
     */
    async getHLSUrl(videoId, quality = null) {
        try {
            console.log(`🎬 Getting MOBILE HLS URL for video ${videoId}, quality: ${quality}`);

            // 1. Lấy master playlist URL (mobile)
            const masterUrl = this.videoApiService.getMasterPlaylistUrl(videoId);
            console.log("📋 Mobile Master URL:", masterUrl);

            // 2. Nếu không yêu cầu quality cụ thể, trả về master playlist
            if (!quality) {
                return {
                    url: masterUrl,
                    type: 'master',
                    quality: 'auto',
                    platform: 'mobile'
                };
            }

            // 3. Lấy danh sách qualities có sẵn
            const availableQualities = await this.videoApiService.getAvailableQualities(videoId);
            console.log("🎯 Available mobile qualities:", availableQualities);

            // 4. Tìm quality phù hợp
            const matchedQuality = availableQualities.find(q => q.label === quality);

            if (matchedQuality && matchedQuality.playlistName) {
                // Sử dụng sub-playlist cho quality cụ thể (mobile)
                const subUrl = this.videoApiService.getSubPlaylistUrl(videoId, matchedQuality.playlistName);
                console.log("🎯 Mobile Sub-playlist URL:", subUrl);

                return {
                    url: subUrl,
                    type: 'sub-playlist',
                    quality: matchedQuality.label,
                    bandwidth: matchedQuality.bandwidth,
                    resolution: matchedQuality.resolution,
                    platform: 'mobile'
                };
            } else {
                // Fallback về master playlist
                console.log("⚠️ Quality not found, using mobile master playlist");
                return {
                    url: masterUrl,
                    type: 'master',
                    quality: 'auto',
                    platform: 'mobile'
                };
            }

        } catch (error) {
            console.error("❌ Error getting mobile HLS URL:", error);
            throw new Error(`Không thể lấy mobile URL HLS: ${error.message}`);
        }
    }

    /**
     * Lấy thông tin chi tiết về video streaming (Mobile-optimized)
     * @param {number} videoId - ID của video
     * @returns {Promise<Object>} - Thông tin chi tiết về streaming
     */
    async getStreamingInfo(videoId) {
        try {
            console.log(`📊 Getting mobile streaming info for video ${videoId}`);

            // Test connection first
            const connectionOk = await this.videoApiService.testConnection();
            if (!connectionOk) {
                throw new Error("Không thể kết nối đến server streaming");
            }

            // Test HLS structure
            const hlsTest = await this.videoApiService.testHLSStructure(videoId);

            if (!hlsTest.valid) {
                throw new Error("Mobile video stream không khả dụng");
            }

            // Get qualities
            const qualities = await this.videoApiService.getAvailableQualities(videoId);

            // Get master playlist URL
            const masterUrl = this.videoApiService.getMasterPlaylistUrl(videoId);

            // Get video status
            let videoStatus = null;
            try {
                videoStatus = await this.videoApiService.getVideoStatus(videoId);
            } catch (e) {
                console.warn("Could not get video status:", e.message);
            }

            return {
                isAvailable: true,
                masterUrl: masterUrl,
                qualities: qualities,
                recommendedQuality: this.getRecommendedQuality(qualities),
                totalQualities: qualities.length,
                hlsTest: hlsTest,
                videoStatus: videoStatus,
                platform: 'mobile',
                config: this.videoApiService.getMobileStreamingConfig()
            };

        } catch (error) {
            console.error("❌ Error getting mobile streaming info:", error);
            return {
                isAvailable: false,
                error: error.message,
                masterUrl: null,
                qualities: [],
                recommendedQuality: null,
                totalQualities: 0,
                platform: 'mobile'
            };
        }
    }

    /**
     * Lấy quality được đề xuất dựa trên mobile device
     * @param {Array} qualities - Danh sách qualities
     * @returns {Object} - Quality được đề xuất
     */
    getRecommendedQuality(qualities) {
        if (!qualities || qualities.length === 0) return null;

        // Cho mobile, ưu tiên 720p hoặc 480p
        const mobilePreferred = ['720p', '780p', '480p', '560p'];

        for (const preferred of mobilePreferred) {
            const found = qualities.find(q => q.label.includes(preferred));
            if (found) {
                console.log(`📱 Recommended mobile quality: ${found.label}`);
                return found;
            }
        }

        // Fallback: chọn quality ở giữa
        const middleIndex = Math.floor(qualities.length / 2);
        const recommended = qualities[middleIndex];
        console.log(`📱 Fallback mobile quality: ${recommended.label}`);
        return recommended;
    }

    /**
     * Kiểm tra xem video có thể stream được không (Mobile)
     * @param {number} videoId - ID của video
     * @returns {Promise<boolean>} - True nếu có thể stream
     */
    async canStream(videoId) {
        try {
            const info = await this.getStreamingInfo(videoId);
            return info.isAvailable;
        } catch (error) {
            console.error("❌ Error checking if can stream on mobile:", error);
            return false;
        }
    }

    /**
     * Lấy URL tối ưu cho video dựa trên kết nối mạng (Mobile-optimized)
     * @param {number} videoId - ID của video
     * @param {string} networkType - Loại kết nối (wifi, cellular, etc.)
     * @param {string} deviceType - Loại thiết bị (phone, tablet)
     * @returns {Promise<Object>} - URL tối ưu
     */
    async getOptimizedUrl(videoId, networkType = 'wifi', deviceType = 'phone') {
        try {
            console.log(`🚀 Getting mobile optimized URL for video ${videoId}, network: ${networkType}, device: ${deviceType}`);

            const streamingInfo = await this.getStreamingInfo(videoId);

            if (!streamingInfo.isAvailable) {
                throw new Error("Mobile video không khả dụng");
            }

            // Chọn quality dựa trên loại kết nối và thiết bị
            let targetQuality = null;

            switch (networkType.toLowerCase()) {
                case 'wifi':
                    // WiFi: Chọn quality cao cho tablet, trung bình cho phone
                    if (deviceType === 'tablet') {
                        targetQuality = streamingInfo.qualities.find(q =>
                            q.label.includes('1080') || q.label.includes('720')
                        )?.label;
                    } else {
                        targetQuality = streamingInfo.qualities.find(q =>
                            q.label.includes('720') || q.label.includes('780')
                        )?.label;
                    }
                    break;

                case 'cellular':
                case '4g':
                case 'lte':
                    // 4G/LTE: Quality trung bình
                    targetQuality = streamingInfo.qualities.find(q =>
                        q.label.includes('480') || q.label.includes('560')
                    )?.label;
                    break;

                case '3g':
                case 'edge':
                case 'slow':
                    // 3G/Slow: Quality thấp nhất
                    targetQuality = streamingInfo.qualities[streamingInfo.qualities.length - 1]?.label;
                    break;

                default:
                    // Mặc định: sử dụng recommended quality
                    targetQuality = streamingInfo.recommendedQuality?.label;
            }

            console.log(`🎯 Mobile optimized quality for ${networkType}/${deviceType}:`, targetQuality);

            return await this.getHLSUrl(videoId, targetQuality);

        } catch (error) {
            console.error("❌ Error getting mobile optimized URL:", error);
            throw error;
        }
    }

    /**
     * Lấy URL preview/thumbnail cho video
     * @param {number} videoId - ID của video
     * @returns {string} - URL của thumbnail
     */
    getThumbnailUrl(videoId) {
        return `${this.videoApiService.baseURL}/thumbnail/${videoId}`;
    }

    /**
     * Format thời gian từ milliseconds
     * @param {number} milliseconds - Thời gian tính bằng milliseconds
     * @returns {string} - Thời gian đã format (mm:ss hoặc hh:mm:ss)
     */
    formatDuration(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return "0:00";

        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Format kích thước file
     * @param {number} bytes - Kích thước tính bằng bytes
     * @returns {string} - Kích thước đã format
     */
    formatFileSize(bytes) {
        if (!bytes || bytes <= 0) return "0 B";

        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Lấy thông tin về chất lượng video từ bandwidth (Mobile-optimized)
     * @param {number} bandwidth - Bandwidth của stream
     * @returns {Object} - Thông tin về chất lượng
     */
    getQualityInfo(bandwidth) {
        const mobileQualityRanges = [
            { min: 0, max: 300000, label: '240p', description: 'Chất lượng thấp - tiết kiệm data', suitable: ['3g', 'slow'] },
            { min: 300000, max: 600000, label: '360p', description: 'Chất lượng cơ bản', suitable: ['3g', '4g'] },
            { min: 600000, max: 1200000, label: '480p', description: 'Chất lượng tốt cho mobile', suitable: ['4g', 'lte'] },
            { min: 1200000, max: 2500000, label: '720p', description: 'HD - tốt cho màn hình lớn', suitable: ['wifi', 'lte'] },
            { min: 2500000, max: 5000000, label: '1080p', description: 'Full HD - chỉ nên dùng WiFi', suitable: ['wifi'] },
            { min: 5000000, max: Infinity, label: '4K', description: 'Ultra HD - chỉ WiFi tốc độ cao', suitable: ['wifi'] }
        ];

        const qualityInfo = mobileQualityRanges.find(range =>
            bandwidth >= range.min && bandwidth < range.max
        );

        return qualityInfo || {
            label: 'Unknown',
            description: 'Không xác định',
            suitable: []
        };
    }

    /**
     * Tạo URL cho việc chia sẻ video (Mobile deep link)
     * @param {number} videoId - ID của video
     * @param {number} startTime - Thời gian bắt đầu (giây)
     * @returns {string} - URL chia sẻ
     */
    generateShareUrl(videoId, startTime = 0) {
        // Mobile deep link format
        const baseUrl = "myapp://watch"; // Thay đổi theo scheme của app
        return `${baseUrl}?v=${videoId}${startTime > 0 ? `&t=${startTime}` : ''}`;
    }

    /**
     * Kiểm tra tính khả dụng của stream (Mobile-optimized)
     * @param {string} streamUrl - URL của stream
     * @returns {Promise<boolean>} - True nếu stream khả dụng
     */
    async checkStreamAvailability(streamUrl) {
        try {
            console.log('🔍 Checking mobile stream availability:', streamUrl);

            const response = await fetch(streamUrl, {
                method: 'HEAD',
                timeout: 10000, // Tăng timeout cho mobile
                headers: {
                    'Accept': 'application/x-mpegURL, */*',
                    'User-Agent': 'ReactNative/ExpoVideo'
                }
            });

            const available = response.ok;
            console.log(`${available ? '✅' : '❌'} Mobile stream availability:`, available);
            return available;
        } catch (error) {
            console.error("❌ Mobile stream availability check failed:", error);
            return false;
        }
    }

    /**
     * Lấy metadata từ HLS playlist (Mobile-optimized)
     * @param {string} playlistContent - Nội dung playlist
     * @returns {Object} - Metadata
     */
    parseHLSMetadata(playlistContent) {
        const metadata = {
            version: null,
            targetDuration: null,
            mediaSequence: null,
            playlistType: null,
            segments: [],
            totalDuration: 0,
            platform: 'mobile'
        };

        if (typeof playlistContent !== 'string') {
            return metadata;
        }

        const lines = playlistContent.split('\n');
        let segmentDuration = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('#EXT-X-VERSION:')) {
                metadata.version = parseInt(trimmedLine.split(':')[1]);
            } else if (trimmedLine.startsWith('#EXT-X-TARGETDURATION:')) {
                metadata.targetDuration = parseInt(trimmedLine.split(':')[1]);
            } else if (trimmedLine.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
                metadata.mediaSequence = parseInt(trimmedLine.split(':')[1]);
            } else if (trimmedLine.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
                metadata.playlistType = trimmedLine.split(':')[1];
            } else if (trimmedLine.startsWith('#EXTINF:')) {
                const durationMatch = trimmedLine.match(/#EXTINF:([0-9.]+)/);
                if (durationMatch) {
                    segmentDuration = parseFloat(durationMatch[1]);
                    metadata.totalDuration += segmentDuration;
                }
            } else if (trimmedLine.endsWith('.ts')) {
                metadata.segments.push({
                    url: trimmedLine,
                    duration: segmentDuration
                });
            }
        }

        return metadata;
    }

    /**
     * Detect network type (helper for mobile)
     */
    detectNetworkType() {
        // This would be implemented using React Native NetInfo
        // For now, return default
        return 'wifi';
    }

    /**
     * Detect device type (helper for mobile)
     */
    detectDeviceType() {
        // This would be implemented using React Native device info
        // For now, return default
        return 'phone';
    }

    /**
     * Get mobile streaming recommendations
     * @param {number} videoId - ID của video
     * @returns {Promise<Object>} - Streaming recommendations
     */
    async getMobileRecommendations(videoId) {
        try {
            const streamingInfo = await this.getStreamingInfo(videoId);

            if (!streamingInfo.isAvailable) {
                return {
                    canStream: false,
                    reason: 'Video không khả dụng'
                };
            }

            const networkType = this.detectNetworkType();
            const deviceType = this.detectDeviceType();

            const recommendations = {
                canStream: true,
                networkType: networkType,
                deviceType: deviceType,
                recommendedQuality: streamingInfo.recommendedQuality,
                optimizedUrl: null,
                tips: []
            };

            // Get optimized URL
            try {
                recommendations.optimizedUrl = await this.getOptimizedUrl(videoId, networkType, deviceType);
            } catch (e) {
                console.warn('Could not get optimized URL:', e.message);
            }

            // Add tips based on network
            switch (networkType) {
                case 'cellular':
                case '4g':
                    recommendations.tips.push('Đang sử dụng mạng di động. Chất lượng video được tối ưu để tiết kiệm data.');
                    break;
                case '3g':
                    recommendations.tips.push('Mạng 3G chậm. Đề xuất chất lượng thấp để tránh buffering.');
                    break;
                case 'wifi':
                    recommendations.tips.push('Đang kết nối WiFi. Có thể xem chất lượng cao.');
                    break;
            }

            return recommendations;
        } catch (error) {
            console.error('Error getting mobile recommendations:', error);
            return {
                canStream: false,
                reason: error.message
            };
        }
    }
}

export default HLSServiceHelper;
