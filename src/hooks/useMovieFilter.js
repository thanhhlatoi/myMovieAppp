import { useState, useEffect } from 'react';

export const useMovieFilter = (movies) => {
    const [activeGenre, setActiveGenre] = useState(null);
    const [filteredMovies, setFilteredMovies] = useState([]);

    useEffect(() => {
        if (activeGenre && movies.length > 0) {
            const filtered = movies.filter(movie =>
                movie.genres?.some(genre => genre.name === activeGenre)
            );
            setFilteredMovies(filtered);
        } else {
            setFilteredMovies(movies);
        }
    }, [activeGenre, movies]);

    const handleGenreSelect = (genreName) => {
        setActiveGenre(activeGenre === genreName ? null : genreName);
    };

    const clearFilter = () => {
        setActiveGenre(null);
    };

    return {
        activeGenre,
        filteredMovies,
        handleGenreSelect,
        clearFilter
    };
};
