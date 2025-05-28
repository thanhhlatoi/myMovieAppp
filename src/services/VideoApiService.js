// VideoApiService.js - Xử lý Master Playlist và Sub-playlist HLS
class VideoApiService {
    constructor() {
        this.baseURL = 'http://192.168.1.73:8082/api/videofilm';
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

    // === HLS STREAMING API ===

    /**
     * 1. Lấy MASTER PLAYLIST - Chứa danh sách các quality levels
     * URL: http://192.168.1.73:8082/api/videofilm/stream/web/2
     * Trả về: Master playlist với danh sách các sub-playlist (quality levels)
     */
    async getMasterPlaylist(videoId) {
        try {
            console.log(`🎬 Getting master playlist for video ${videoId}`);

            // Luôn sử dụng fetch + text() để lấy nội dung master playlist
            const response = await fetch(`${this.baseURL}/stream/web/${videoId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch master playlist: ${response.status} ${response.statusText}`);
            }

            // Luôn đọc response dưới dạng text
            const content = await response.text();
            console.log('📋 Master playlist content:', content);
            return content;
        } catch (error) {
            console.error('Error fetching master playlist:', error);
            throw error;
        }
    }

    /**
     * 2. Lấy SUB-PLAYLIST - Chứa danh sách segments cho quality cụ thể
     * URL: http://192.168.1.73:8082/api/videofilm/playlist/web/2/index_0.m3u8
     * Trả về: Sub-playlist với danh sách segments (.ts files)
     */
    async getSubPlaylist(videoId, playlistName) {
        try {
            console.log(`🎯 Getting sub-playlist: ${playlistName} for video ${videoId}`);

            // Luôn sử dụng fetch + text() để lấy nội dung sub-playlist
            const response = await fetch(`${this.baseURL}/playlist/web/${videoId}/${playlistName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch sub-playlist: ${response.status} ${response.statusText}`);
            }

            // Luôn đọc response dưới dạng text
            const content = await response.text();
            console.log(`📄 Sub-playlist ${playlistName} content:`, content);
            return content;
        } catch (error) {
            console.error(`Error fetching sub-playlist ${playlistName}:`, error);
            throw error;
        }
    }

    /**
     * 3. Lấy VIDEO SEGMENT - File .ts chứa video data
     * URL: http://192.168.1.73:8082/api/videofilm/segment/web/2/output_0_00000.ts
     */
    async getVideoSegment(videoId, segmentName) {
        try {
            const response = await fetch(`${this.baseURL}/segment/web/${videoId}/${segmentName}`);
            return await response.arrayBuffer(); // Trả về binary data
        } catch (error) {
            console.error(`Error fetching segment ${segmentName}:`, error);
            throw error;
        }
    }

    // === URL GENERATORS ===
    getMasterPlaylistUrl(videoId) {
        return `${this.baseURL}/stream/web/${videoId}`;
    }

    getSubPlaylistUrl(videoId, playlistName) {
        return `${this.baseURL}/playlist/web/${videoId}/${playlistName}`;
    }

    getSegmentUrl(videoId, segmentName) {
        return `${this.baseURL}/segment/web/${videoId}/${segmentName}`;
    }

    // === HLS PARSING METHODS ===

    /**
     * Parse MASTER PLAYLIST để lấy danh sách quality levels
     * Input: Master playlist content
     * Output: Array of quality objects
     */
    parseMasterPlaylist(masterContent) {
        // Nếu masterContent không phải là string, ném lỗi
        if (typeof masterContent !== 'string') {
            console.error('Lỗi: masterContent không phải là string:', typeof masterContent);
            throw new Error('Nội dung master playlist không hợp lệ (không phải string)');
        }

        const lines = masterContent.split('\n');
        const qualities = [];

        console.log('🔍 Parsing master playlist...');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Tìm dòng EXT-X-STREAM-INF (chứa thông tin quality)
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                console.log(`Found quality line: ${line}`);

                // Parse attributes từ dòng EXT-X-STREAM-INF
                const attributes = this.parseStreamInfAttributes(line);

                // Dòng tiếp theo chứa playlist name
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('#')) {
                        // Extract playlist name từ URL
                        const playlistName = nextLine.includes('/')
                            ? nextLine.substring(nextLine.lastIndexOf('/') + 1)
                            : nextLine;

                        const quality = {
                            playlistName: playlistName, // VD: "index_0.m3u8"
                            fullUrl: nextLine, // URL đầy đủ
                            bandwidth: parseInt(attributes.BANDWIDTH || 0),
                            resolution: attributes.RESOLUTION || null,
                            codecs: attributes.CODECS ? attributes.CODECS.replace(/"/g, '') : null,
                            label: this.generateQualityLabel(attributes), // VD: "720p", "1080p"
                        };

                        qualities.push(quality);
                        console.log(`✅ Found quality: ${quality.label} (${quality.playlistName})`);
                    }
                }
            }
        }

        // Sắp xếp theo bandwidth (chất lượng cao nhất trước)
        qualities.sort((a, b) => b.bandwidth - a.bandwidth);

        console.log(`📊 Found ${qualities.length} quality levels:`, qualities);
        return qualities;
    }

    /**
     * Parse SUB-PLAYLIST để lấy danh sách segments
     * Input: Sub-playlist content
     * Output: Array of segment objects
     */
    parseSubPlaylist(subContent) {
        // Nếu subContent không phải là string, ném lỗi
        if (typeof subContent !== 'string') {
            console.error('Lỗi: subContent không phải là string:', typeof subContent);
            throw new Error('Nội dung sub-playlist không hợp lệ (không phải string)');
        }

        const lines = subContent.split('\n');
        const segments = [];
        let duration = 0;

        console.log('🔍 Parsing sub-playlist...');

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
                        const segmentName = nextLine.includes('/')
                            ? nextLine.substring(nextLine.lastIndexOf('/') + 1)
                            : nextLine;

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

        console.log(`📹 Found ${segments.length} segments in sub-playlist`);
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
     * Lấy tất cả quality levels cho video
     */
    async getAvailableQualities(videoId) {
        try {
            console.log(`🎯 Getting available qualities for video ${videoId}`);

            // 1. Lấy master playlist
            const masterContent = await this.getMasterPlaylist(videoId);

            // 2. Parse để lấy quality levels
            const qualities = this.parseMasterPlaylist(masterContent);

            // 3. Thêm URL đầy đủ cho mỗi quality
            const qualitiesWithUrls = qualities.map(quality => ({
                ...quality,
                url: this.getSubPlaylistUrl(videoId, quality.playlistName)
            }));

            return qualitiesWithUrls;
        } catch (error) {
            console.error('Error getting available qualities:', error);
            throw error;
        }
    }

    /**
     * Lấy segments cho quality cụ thể
     */
    async getSegmentsForQuality(videoId, playlistName) {
        try {
            console.log(`🎬 Getting segments for quality: ${playlistName}`);

            // 1. Lấy sub-playlist
            const subContent = await this.getSubPlaylist(videoId, playlistName);

            // 2. Parse để lấy segments
            const segments = this.parseSubPlaylist(subContent);

            // 3. Thêm URL đầy đủ cho mỗi segment
            const segmentsWithUrls = segments.map(segment => ({
                ...segment,
                url: this.getSegmentUrl(videoId, segment.segmentName)
            }));

            return segmentsWithUrls;
        } catch (error) {
            console.error(`Error getting segments for quality ${playlistName}:`, error);
            throw error;
        }
    }

    /**
     * Test toàn bộ HLS structure cho video
     */
    async testHLSStructure(videoId) {
        try {
            console.log(`🔧 Testing HLS structure for video ${videoId}`);

            // 1. Test master playlist
            console.log('1. Testing master playlist...');
            const masterUrl = this.getMasterPlaylistUrl(videoId);
            console.log(`Master URL: ${masterUrl}`);

            const qualities = await this.getAvailableQualities(videoId);
            console.log(`✅ Found ${qualities.length} qualities`);

            // 2. Test sub-playlists
            console.log('2. Testing sub-playlists...');
            const subPlaylistTests = [];

            for (const quality of qualities) {
                try {
                    const segments = await this.getSegmentsForQuality(videoId, quality.playlistName);
                    console.log(`✅ Quality ${quality.label}: ${segments.length} segments`);

                    subPlaylistTests.push({
                        quality: quality.label,
                        playlistName: quality.playlistName,
                        segmentCount: segments.length,
                        isValid: segments.length > 0
                    });
                } catch (e) {
                    console.error(`❌ Quality ${quality.label} failed:`, e.message);
                    subPlaylistTests.push({
                        quality: quality.label,
                        playlistName: quality.playlistName,
                        segmentCount: 0,
                        isValid: false,
                        error: e.message
                    });
                }
            }

            // 3. Test sample segments
            console.log('3. Testing sample segments...');
            if (qualities.length > 0) {
                const firstQuality = qualities[0];
                const segments = await this.getSegmentsForQuality(videoId, firstQuality.playlistName);

                if (segments.length > 0) {
                    const firstSegment = segments[0];
                    const segmentUrl = this.getSegmentUrl(videoId, firstSegment.segmentName);
                    console.log(`Testing first segment: ${segmentUrl}`);

                    try {
                        const response = await fetch(segmentUrl, { method: 'HEAD' });
                        if (response.ok) {
                            console.log(`✅ Sample segment accessible`);
                        } else {
                            console.error(`❌ Sample segment returned: ${response.status}`);
                        }
                    } catch (e) {
                        console.error(`❌ Sample segment test failed:`, e.message);
                    }
                }
            }

            return {
                valid: subPlaylistTests.some(test => test.isValid),
                qualities: qualities,
                subPlaylistTests: subPlaylistTests
            };

        } catch (error) {
            console.error('❌ HLS structure test failed:', error);
            return {
                valid: false,
                error: error.message
            };
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
}

export default VideoApiService;
