// 📄 src/services/MovieApiHelper.js - Helper for Movie API Integration
import MovieService from './MovieService';

const MovieApiHelper = {
  /**
   * ✨ Fetch movies by category with error handling
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>} - Array of movies or empty array
   */
  fetchMoviesByCategory: async (categoryId) => {
    try {
      const response = await MovieService.getMoviesByCategory(categoryId);
      return response?.data || [];
    } catch (error) {
      console.error(`❌ MovieApiHelper: Error fetching movies for category ${categoryId}:`, error);
      return [];
    }
  },

  /**
   * ✨ Fetch popular movies by category with error handling
   * @param {number} categoryId - Category ID
   * @param {number} limit - Number of movies to fetch (default: 10)
   * @returns {Promise<Array>} - Array of popular movies or empty array
   */
  fetchPopularMoviesByCategory: async (categoryId, limit = 10) => {
    try {
      const response = await MovieService.getPopularMoviesByCategory(categoryId, limit);
      return response?.data || [];
    } catch (error) {
      console.error(`❌ MovieApiHelper: Error fetching popular movies for category ${categoryId}:`, error);
      return [];
    }
  },

  /**
   * ✨ Fetch movies for multiple categories in parallel
   * @param {Array} categories - Array of category objects with id and name
   * @param {number} limit - Number of movies per category (default: 10)
   * @returns {Promise<Object>} - Object with category names as keys and movie arrays as values
   */
  fetchMoviesForMultipleCategories: async (categories, limit = 10) => {
    try {
      const categoryPromises = categories.map(async (category) => {
        const [regularMovies, popularMovies] = await Promise.all([
          MovieApiHelper.fetchMoviesByCategory(category.id),
          MovieApiHelper.fetchPopularMoviesByCategory(category.id, limit)
        ]);

        return {
          categoryId: category.id,
          categoryName: category.name,
          movies: regularMovies,
          popularMovies: popularMovies
        };
      });

      const results = await Promise.all(categoryPromises);
      
      const moviesByCategory = {};
      const popularMoviesByCategory = {};
      
      results.forEach(result => {
        if (result.movies.length > 0) {
          moviesByCategory[result.categoryName] = result.movies;
        }
        if (result.popularMovies.length > 0) {
          popularMoviesByCategory[result.categoryName] = result.popularMovies;
        }
      });

      return {
        moviesByCategory,
        popularMoviesByCategory
      };
    } catch (error) {
      console.error('❌ MovieApiHelper: Error fetching movies for multiple categories:', error);
      return {
        moviesByCategory: {},
        popularMoviesByCategory: {}
      };
    }
  },

  /**
   * ✨ Search movies with smart fallback
   * @param {string} query - Search query
   * @param {string} type - Search type: 'basic' or 'advanced' (default: 'basic')
   * @returns {Promise<Array>} - Array of search results
   */
  searchMovies: async (query, type = 'basic') => {
    try {
      let response;
      
      if (type === 'advanced') {
        // For advanced search, try with title parameter
        response = await MovieService.searchMoviesAdvanced({ title: query });
      } else {
        // Try basic search first
        response = await MovieService.searchMoviesByTitle(query);
      }
      
      return response?.data || [];
    } catch (error) {
      console.error(`❌ MovieApiHelper: Error searching movies with query "${query}":`, error);
      return [];
    }
  },

  /**
   * ✨ Get search suggestions with error handling
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} - Array of suggestions
   */
  getSearchSuggestions: async (keyword) => {
    try {
      const response = await MovieService.getSearchSuggestions(keyword);
      return response?.data || [];
    } catch (error) {
      console.error(`❌ MovieApiHelper: Error getting suggestions for "${keyword}":`, error);
      return [];
    }
  },

  /**
   * ✨ Track movie interaction with error handling
   * @param {number} movieId - Movie ID
   * @param {string} action - Action type: 'watch', 'like', 'dislike'
   * @returns {Promise<boolean>} - Success status
   */
  trackMovieInteraction: async (movieId, action) => {
    try {
      let response;
      
      switch (action) {
        case 'watch':
          response = await MovieService.watchMovie(movieId);
          break;
        case 'like':
          response = await MovieService.likeMovie(movieId);
          break;
        case 'dislike':
          response = await MovieService.dislikeMovie(movieId);
          break;
        default:
          console.warn(`❌ MovieApiHelper: Unknown action "${action}"`);
          return false;
      }
      
      return response !== null;
    } catch (error) {
      console.error(`❌ MovieApiHelper: Error tracking ${action} for movie ${movieId}:`, error);
      return false;
    }
  },

  /**
   * ✨ Get trending keywords with error handling
   * @param {number} limit - Number of keywords to fetch (default: 10)
   * @returns {Promise<Array>} - Array of trending keywords
   */
  getTrendingKeywords: async (limit = 10) => {
    try {
      const response = await MovieService.getTrendingKeywords(limit);
      return response?.data || [];
    } catch (error) {
      console.error('❌ MovieApiHelper: Error fetching trending keywords:', error);
      return [];
    }
  },

  /**
   * ✨ Comprehensive movie data fetcher for home screen
   * @param {Array} categories - Available categories
   * @param {number} moviesPerCategory - Movies per category (default: 10)
   * @param {number} popularLimit - Popular movies per category (default: 5)
   * @returns {Promise<Object>} - Complete movie data for home screen
   */
  fetchHomeScreenData: async (categories, moviesPerCategory = 10, popularLimit = 5) => {
    try {
      console.log('🏠 MovieApiHelper: Fetching home screen data...');
      
      const [
        allMoviesResponse,
        categoryData,
        trendingKeywords
      ] = await Promise.all([
        MovieService.getAllMovies(0, 50),
        MovieApiHelper.fetchMoviesForMultipleCategories(categories.slice(0, 6), moviesPerCategory),
        MovieApiHelper.getTrendingKeywords(10)
      ]);

      const allMovies = allMoviesResponse?.data?.content || [];
      
      return {
        allMovies,
        moviesByCategory: categoryData.moviesByCategory,
        popularMoviesByCategory: categoryData.popularMoviesByCategory,
        trendingKeywords,
        success: true
      };
    } catch (error) {
      console.error('❌ MovieApiHelper: Error fetching home screen data:', error);
      return {
        allMovies: [],
        moviesByCategory: {},
        popularMoviesByCategory: {},
        trendingKeywords: [],
        success: false
      };
    }
  }
};

export default MovieApiHelper; 