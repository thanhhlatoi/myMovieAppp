// VideoApiService.js - Updated cho Mobile Streaming
class VideoApiService {
    constructor() {
        // Thay đổi base URL để chỉ sử dụng mobile endpoints
        this.baseURL = 'http://172.20.10.7:8082/api/videofilm';
    }

    async handleResponse(response) {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && (contentType.includes('application/x-mpegURL') || contentType.includes('text'))) {
            return await response.text(); // Luôn trả về text cho HLS playlist
        } else {
            return await response.blob();
        }
    }

    buildUrlWithParams(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        return url.toString();
    }

    // === BASIC VIDEO API ===
    async getVideoById(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching video by ID:', error);
            throw error;
        }
    }

    async getRecentVideos() {
        try {
            const response = await fetch(`${this.baseURL}/recent`);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching recent videos:', error);
            throw error;
        }
    }

    async getVideosByStatus(status) {
        try {
            const url = this.buildUrlWithParams('/by-status', { status });
            const response = await fetch(url);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching videos by status:', error);
            throw error;
        }
    }

    // === MOBILE HLS STREAMING API ===

 
    async getMasterPlaylist(videoId) {
        try {
            console.log(`🎬 Getting MOBILE master playlist for video ${videoId}`);

            const response = await fetch(`${this.baseURL}/stream/mobile/${videoId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/x-mpegURL, text/plain, */*',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch mobile master playlist: ${response.status} ${response.statusText}`);
            }

            const content = await response.text();
            console.log('📋 Mobile master playlist content preview:', content.substring(0, 500));
            return content;
        } catch (error) {
            console.error('❌ Error fetching mobile master playlist:', error);
            throw error;
        }
    }

    /**
     * 2. Lấy SUB-PLAYLIST cho Mobile - Chứa danh sách segments cho quality cụ thể
     * URL: http://192.168.100.193:8082/api/videofilm/playlist/mobile/2/index_0.m3u8
     * Trả về: Sub-playlist với danh sách segments (.ts files)
     */
    async getSubPlaylist(videoId, playlistName) {
        try {
            console.log(`🎯 Getting MOBILE sub-playlist: ${playlistName} for video ${videoId}`);

            const response = await fetch(`${this.baseURL}/playlist/mobile/${videoId}/${playlistName}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/x-mpegURL, text/plain, */*',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch mobile sub-playlist: ${response.status} ${response.statusText}`);
            }

            const content = await response.text();
            console.log(`📄 Mobile sub-playlist ${playlistName} content preview:`, content.substring(0, 300));
            return content;
        } catch (error) {
            console.error(`❌ Error fetching mobile sub-playlist ${playlistName}:`, error);
            throw error;
        }
    }

    /**
     * 3. Lấy VIDEO SEGMENT cho Mobile - File .ts chứa video data
     * URL: http://192.168.100.193:8082/api/videofilm/segment/mobile/2/output_0_00000.ts
     */
    async getVideoSegment(videoId, segmentName) {
        try {
            const response = await fetch(`${this.baseURL}/segment/mobile/${videoId}/${segmentName}`, {
                method: 'GET',
                headers: {
                    'Accept': 'video/MP2T, */*'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch segment: ${response.status}`);
            }

            return await response.arrayBuffer(); // Trả về binary data
        } catch (error) {
            console.error(`❌ Error fetching mobile segment ${segmentName}:`, error);
            throw error;
        }
    }

    // === MOBILE URL GENERATORS ===
    getMasterPlaylistUrl(videoId) {
        return `${this.baseURL}/stream/mobile/${videoId}`;
    }

    getSubPlaylistUrl(videoId, playlistName) {
        return `${this.baseURL}/playlist/mobile/${videoId}/${playlistName}`;
    }

    getSegmentUrl(videoId, segmentName) {
        return `${this.baseURL}/segment/mobile/${videoId}/${segmentName}`;
    }

    // === HLS PARSING METHODS (Unchanged) ===

    /**
     * Parse MASTER PLAYLIST để lấy danh sách quality levels
     */
    parseMasterPlaylist(masterContent) {
        if (typeof masterContent !== 'string') {
            console.error('❌ Lỗi: masterContent không phải là string:', typeof masterContent);
            throw new Error('Nội dung master playlist không hợp lệ (không phải string)');
        }

        const lines = masterContent.split('\n');
        const qualities = [];

        console.log('🔍 Parsing mobile master playlist...');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Tìm dòng EXT-X-STREAM-INF (chứa thông tin quality)
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                console.log(`📊 Found quality line: ${line}`);

                // Parse attributes từ dòng EXT-X-STREAM-INF
                const attributes = this.parseStreamInfAttributes(line);

                // Dòng tiếp theo chứa playlist URL hoặc name
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('#')) {
                        // Extract playlist name từ URL
                        let playlistName = nextLine;
                        if (nextLine.includes('/')) {
                            playlistName = nextLine.substring(nextLine.lastIndexOf('/') + 1);
                        }

                        const quality = {
                            playlistName: playlistName, // VD: "index_0.m3u8"
                            fullUrl: nextLine, // URL đầy đủ hoặc relative path
                            bandwidth: parseInt(attributes.BANDWIDTH || 0),
                            resolution: attributes.RESOLUTION || null,
                            codecs: attributes.CODECS ? attributes.CODECS.replace(/"/g, '') : null,
                            label: this.generateQualityLabel(attributes), // VD: "720p", "1080p"
                        };

                        qualities.push(quality);
                        console.log(`✅ Found mobile quality: ${quality.label} (${quality.playlistName})`);
                    }
                }
            }
        }

        // Sắp xếp theo bandwidth (chất lượng cao nhất trước)
        qualities.sort((a, b) => b.bandwidth - a.bandwidth);

        console.log(`📊 Found ${qualities.length} mobile quality levels:`, qualities);
        return qualities;
    }

    /**
     * Parse SUB-PLAYLIST để lấy danh sách segments
     */
    parseSubPlaylist(subContent) {
        if (typeof subContent !== 'string') {
            console.error('❌ Lỗi: subContent không phải là string:', typeof subContent);
            throw new Error('Nội dung sub-playlist không hợp lệ (không phải string)');
        }

        const lines = subContent.split('\n');
        const segments = [];
        let duration = 0;

        console.log('🔍 Parsing mobile sub-playlist...');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Tìm dòng EXTINF (chứa thông tin duration)
            if (line.startsWith('#EXTINF:')) {
                const durationMatch = line.match(/#EXTINF:([0-9.]+)/);
                if (durationMatch) {
                    duration = parseFloat(durationMatch[1]);
                }

                // Dòng tiếp theo chứa segment URL
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('#')) {
                        // Extract segment name từ URL
                        let segmentName = nextLine;
                        if (nextLine.includes('/')) {
                            segmentName = nextLine.substring(nextLine.lastIndexOf('/') + 1);
                        }

                        const segment = {
                            segmentName: segmentName, // VD: "output_0_00000.ts"
                            fullUrl: nextLine, // URL đầy đủ
                            duration: duration,
                            index: segments.length
                        };

                        segments.push(segment);
                    }
                }
            }
        }

        console.log(`📹 Found ${segments.length} segments in mobile sub-playlist`);
        return segments;
    }

    /**
     * Parse attributes từ dòng EXT-X-STREAM-INF
     */
    parseStreamInfAttributes(line) {
        const attributes = {};
        const attrString = line.substring(line.indexOf(':') + 1);

        // Regex để parse các attributes (BANDWIDTH=1500000,RESOLUTION=1920x1080,etc.)
        const regex = /([A-Z-]+)=([^,]+)/g;
        let match;

        while ((match = regex.exec(attrString)) !== null) {
            const key = match[1];
            let value = match[2];

            // Xử lý quoted values
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }

            attributes[key] = value;
        }

        return attributes;
    }

    /**
     * Generate quality label từ attributes (720p, 1080p, etc.)
     */
    generateQualityLabel(attributes) {
        if (attributes.RESOLUTION) {
            // Extract height từ resolution (1920x1080 -> 1080p)
            const heightMatch = attributes.RESOLUTION.match(/\d+x(\d+)/);
            if (heightMatch) {
                return `${heightMatch[1]}p`;
            }
            return attributes.RESOLUTION;
        }

        if (attributes.BANDWIDTH) {
            // Fallback to bandwidth label
            const bandwidth = parseInt(attributes.BANDWIDTH);
            if (bandwidth >= 1000000) {
                return `${Math.round(bandwidth / 1000000)}Mbps`;
            }
            return `${Math.round(bandwidth / 1000)}kbps`;
        }

        return 'Unknown Quality';
    }

    // === HIGH-LEVEL METHODS ===

    /**
     * Lấy tất cả quality levels cho video (Mobile)
     */
    async getAvailableQualities(videoId) {
        try {
            console.log(`🎯 Getting available MOBILE qualities for video ${videoId}`);

            // 1. Lấy master playlist
            const masterContent = await this.getMasterPlaylist(videoId);

            // 2. Parse để lấy quality levels
            const qualities = this.parseMasterPlaylist(masterContent);

            // 3. Thêm URL đầy đủ cho mỗi quality (mobile URLs)
            const qualitiesWithUrls = qualities.map(quality => ({
                ...quality,
                url: this.getSubPlaylistUrl(videoId, quality.playlistName)
            }));

            console.log(`✅ Found ${qualitiesWithUrls.length} mobile qualities:`, qualitiesWithUrls);
            return qualitiesWithUrls;
        } catch (error) {
            console.error('❌ Error getting available mobile qualities:', error);
            throw error;
        }
    }

    /**
     * Lấy segments cho quality cụ thể (Mobile)
     */
    async getSegmentsForQuality(videoId, playlistName) {
        try {
            console.log(`🎬 Getting mobile segments for quality: ${playlistName}`);

            // 1. Lấy sub-playlist
            const subContent = await this.getSubPlaylist(videoId, playlistName);

            // 2. Parse để lấy segments
            const segments = this.parseSubPlaylist(subContent);

            // 3. Thêm URL đầy đủ cho mỗi segment (mobile URLs)
            const segmentsWithUrls = segments.map(segment => ({
                ...segment,
                url: this.getSegmentUrl(videoId, segment.segmentName)
            }));

            console.log(`✅ Found ${segmentsWithUrls.length} mobile segments for ${playlistName}`);
            return segmentsWithUrls;
        } catch (error) {
            console.error(`❌ Error getting mobile segments for quality ${playlistName}:`, error);
            throw error;
        }
    }

    /**
     * Test toàn bộ HLS structure cho video (Mobile)
     */
    async testHLSStructure(videoId) {
        try {
            console.log(`🔧 Testing MOBILE HLS structure for video ${videoId}`);

            // 1. Test master playlist
            console.log('1. Testing mobile master playlist...');
            const masterUrl = this.getMasterPlaylistUrl(videoId);
            console.log(`Mobile Master URL: ${masterUrl}`);

            const qualities = await this.getAvailableQualities(videoId);
            console.log(`✅ Found ${qualities.length} mobile qualities`);

            // 2. Test sub-playlists
            console.log('2. Testing mobile sub-playlists...');
            const subPlaylistTests = [];

            for (const quality of qualities.slice(0, 2)) { // Test only first 2 qualities to save time
                try {
                    const segments = await this.getSegmentsForQuality(videoId, quality.playlistName);
                    console.log(`✅ Mobile Quality ${quality.label}: ${segments.length} segments`);

                    subPlaylistTests.push({
                        quality: quality.label,
                        playlistName: quality.playlistName,
                        segmentCount: segments.length,
                        isValid: segments.length > 0
                    });
                } catch (e) {
                    console.error(`❌ Mobile Quality ${quality.label} failed:`, e.message);
                    subPlaylistTests.push({
                        quality: quality.label,
                        playlistName: quality.playlistName,
                        segmentCount: 0,
                        isValid: false,
                        error: e.message
                    });
                }
            }

            // 3. Test sample segment
            console.log('3. Testing mobile sample segment...');
            if (qualities.length > 0) {
                const firstQuality = qualities[0];
                const segments = await this.getSegmentsForQuality(videoId, firstQuality.playlistName);

                if (segments.length > 0) {
                    const firstSegment = segments[0];
                    const segmentUrl = this.getSegmentUrl(videoId, firstSegment.segmentName);
                    console.log(`Testing first mobile segment: ${segmentUrl}`);

                    try {
                        const response = await fetch(segmentUrl, {
                            method: 'HEAD',
                            timeout: 10000
                        });
                        if (response.ok) {
                            console.log(`✅ Mobile sample segment accessible`);
                        } else {
                            console.error(`❌ Mobile sample segment returned: ${response.status}`);
                        }
                    } catch (e) {
                        console.error(`❌ Mobile sample segment test failed:`, e.message);
                    }
                }
            }

            return {
                valid: subPlaylistTests.some(test => test.isValid),
                qualities: qualities,
                subPlaylistTests: subPlaylistTests,
                masterUrl: masterUrl,
                platform: 'mobile'
            };

        } catch (error) {
            console.error('❌ Mobile HLS structure test failed:', error);
            return {
                valid: false,
                error: error.message,
                platform: 'mobile'
            };
        }
    }

    /**
     * Kiểm tra video status
     */
    async getVideoStatus(videoId) {
        try {
            const response = await fetch(`${this.baseURL}/status/${videoId}`);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error getting video status:', error);
            throw error;
        }
    }

    /**
     * Debug endpoint - Lấy original M3U8 content
     */
    async getDebugM3U8(videoId) {
        try {
            const response = await fetch(`${this.baseURL}/debug/m3u8/${videoId}`);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error getting debug M3U8:', error);
            throw error;
        }
    }

    // === UTILITY METHODS ===

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    getStatusDisplayName(status) {
        const statusMap = {
            'UPLOADING': 'Đang tải lên',
            'PROCESSING': 'Đang xử lý',
            'COMPLETED': 'Hoàn thành',
            'FAILED': 'Thất bại'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'UPLOADING': 'bg-blue-600',
            'PROCESSING': 'bg-yellow-600',
            'COMPLETED': 'bg-green-600',
            'FAILED': 'bg-red-600'
        };
        return colorMap[status] || 'bg-gray-600';
    }

    /**
     * Test connection to server
     */
    async testConnection() {
        try {
            console.log('🔗 Testing connection to mobile streaming server...');
            const response = await fetch(`${this.baseURL}/recent`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                console.log('✅ Connection to mobile streaming server successful');
                return true;
            } else {
                console.error('❌ Connection failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    /**
     * Get mobile-optimized streaming configuration
     */
    getMobileStreamingConfig() {
        return {
            platform: 'mobile',
            baseURL: this.baseURL,
            endpoints: {
                masterPlaylist: '/stream/mobile/{videoId}',
                subPlaylist: '/playlist/mobile/{videoId}/{playlistName}',
                segment: '/segment/mobile/{videoId}/{segmentName}',
                status: '/status/{videoId}',
                debug: '/debug/m3u8/{videoId}'
            },
            headers: {
                'Accept': 'application/x-mpegURL, text/plain, */*',
                'Cache-Control': 'no-cache',
                'User-Agent': 'ReactNative/ExpoVideo'
            },
            supportedFormats: ['m3u8', 'ts'],
            bufferSettings: {
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000
            }
        };
    }
}

export default VideoApiService;
