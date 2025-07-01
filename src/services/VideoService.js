const API_BASE_URL = "http://192.168.100.193:8082/api/videos";

const VideoService = {
    getAllVideos: async (page = 0, size = 5, sortBy = "id", order = "desc") => {
        try {
            const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}&sortBy=${sortBy}&order=${order}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Status: ${response.status}`);
            }

            console.log("✅ Kết nối thành công tới API videos!");

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("❌ Lỗi khi tải videos:", error);
            return null;
        }
    },

    getVideoById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Status: ${response.status}`);
            }

            console.log(`✅ Lấy thành công video với ID: ${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`❌ Lỗi khi lấy video với ID ${id}:`, error);
            return null;
        }
    },

    // Thêm method để lọc videos theo trạng thái
    getCompletedVideos: async (page = 0, size = 10) => {
        try {
            const allVideos = await VideoService.getAllVideos(page, size);
            if (!allVideos || !allVideos.data) return null;

            // Lọc chỉ lấy videos có status = "COMPLETED"
            const completedVideos = {
                ...allVideos,
                data: {
                    ...allVideos.data,
                    content: allVideos.data.content.filter(video => video.status === "COMPLETED")
                }
            };

            return completedVideos;
        } catch (error) {
            console.error("❌ Lỗi khi lọc videos completed:", error);
            return null;
        }
    },

    // ✨ NEW: Lọc videos có movieProduct (không null)
    getVideosWithMovieProduct: async (page = 0, size = 10, sortBy = "id", order = "desc") => {
        try {
            console.log("🎬 Fetching videos with movieProduct...");
            const allVideos = await VideoService.getAllVideos(page, size, sortBy, order);
            if (!allVideos || !allVideos.data) return null;

            // Lọc chỉ lấy videos có movieProduct không null
            const videosWithMovieProduct = allVideos.data.content.filter(video => {
                const hasMovieProduct = video.movieProduct != null;
                if (!hasMovieProduct) {
                    console.log(`🚫 Filtering out video ID ${video.id} - no movieProduct`);
                }
                return hasMovieProduct;
            });

            const filteredResult = {
                ...allVideos,
                data: {
                    ...allVideos.data,
                    content: videosWithMovieProduct,
                    totalElements: videosWithMovieProduct.length,
                    numberOfElements: videosWithMovieProduct.length
                }
            };

            console.log(`✅ Filtered ${videosWithMovieProduct.length} videos with movieProduct`);
            return filteredResult;
        } catch (error) {
            console.error("❌ Lỗi khi lọc videos with movieProduct:", error);
            return null;
        }
    },

    // ✨ NEW: Lọc videos có movieProduct và status COMPLETED
    getCompletedVideosWithMovieProduct: async (page = 0, size = 10, sortBy = "id", order = "desc") => {
        try {
            console.log("🎬 Fetching completed videos with movieProduct...");
            const allVideos = await VideoService.getAllVideos(page, size, sortBy, order);
            if (!allVideos || !allVideos.data) return null;

            // Lọc videos có cả movieProduct và status COMPLETED
            const filteredVideos = allVideos.data.content.filter(video => {
                const hasMovieProduct = video.movieProduct != null;
                const isCompleted = video.status === "COMPLETED";
                const shouldInclude = hasMovieProduct && isCompleted;
                
                if (!shouldInclude) {
                    console.log(`🚫 Filtering out video ID ${video.id} - movieProduct: ${hasMovieProduct}, completed: ${isCompleted}`);
                }
                return shouldInclude;
            });

            const filteredResult = {
                ...allVideos,
                data: {
                    ...allVideos.data,
                    content: filteredVideos,
                    totalElements: filteredVideos.length,
                    numberOfElements: filteredVideos.length
                }
            };

            console.log(`✅ Filtered ${filteredVideos.length} completed videos with movieProduct`);
            return filteredResult;
        } catch (error) {
            console.error("❌ Lỗi khi lọc completed videos with movieProduct:", error);
            return null;
        }
    }
};

export default VideoService;
