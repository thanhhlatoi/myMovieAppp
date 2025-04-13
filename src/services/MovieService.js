const API_BASE_URL = "http://192.168.0.117:8082/api/movieProduct"; 

const MovieService = {
  getAllMovies: async (page = 0, size = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! Status: ${response.status}`);
      }

      console.log("✅ Kết nối thành công tới API movieProduct!");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Lỗi khi tải movieProduct:", error);
      return null;
    }
  },
};

export default MovieService; 
