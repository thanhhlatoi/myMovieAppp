import axios from "axios";

const API_KEY = "YOUR_TMDB_API_KEY";  // Thay bằng API Key của bạn
const BASE_URL = "https://api.themoviedb.org/3";

export const getNowPlayingMovies = async () => {
  const response = await axios.get(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`);
  return response.data.results;
};
