import { useState, useEffect } from 'react';
import CategoryService from '../services/CategoryService';
import MovieService from '../services/MovieService';

export const useMovieData = () => {
    const [genres, setGenres] = useState([]);
    const [movies, setMovies] = useState([]);
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [comingSoonMovies, setComingSoonMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [genresResponse, moviesResponse] = await Promise.all([
                CategoryService.getAllCategories(),
                MovieService.getAllMovies()
            ]);

            // Handle genres
            const genresData = genresResponse?.data?.content || [];
            setGenres(genresData);

            // Handle movies
            const moviesData = moviesResponse?.data?.content || [];
            setMovies(moviesData);

            // Set featured movie
            if (moviesData.length > 0) {
                const featured = moviesData.reduce((prev, current) =>
                    (prev.views > current.views) ? prev : current
                );
                setFeaturedMovie(featured);
            }

            // Set coming soon
            const comingSoon = moviesData
                .filter(movie => movie.year === "2025" || movie.year === "2024")
                .slice(0, 5);
            setComingSoonMovies(comingSoon.length > 0 ? comingSoon : moviesData.slice(-5));

        } catch (err) {
            console.error("❌ Lỗi khi tải dữ liệu:", err);
            setError(err);

            // Mock data fallback
            const mockMovies = [{
                id: 1,
                title: "Test Movie 1",
                description: "Test description",
                likes: 100,
                views: 1000,
                year: "2024",
                time: "120",
                imgMovie: "",
                genres: [{ name: "Action" }],
            }];
            setMovies(mockMovies);
            setFeaturedMovie(mockMovies[0]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        genres,
        movies,
        featuredMovie,
        comingSoonMovies,
        loading,
        error,
        refetch: fetchData
    };
};
