import React from 'react';
import { FlatList, View, Text } from 'react-native';
import MovieCard from '../movie/MovieCard';
import ItemSeparator from '../common/ItemSeparator';

const MovieList = ({ movies, handleMoviePress, onFavoritesChange }) => {
    console.log("🎬 MovieList received:", movies?.length, "movies");
    console.log("🎬 Sample movie:", movies?.[0]);

    // Debug: Kiểm tra data
    if (!movies || !Array.isArray(movies)) {
        console.warn("⚠️ MovieList: movies is not an array", movies);
        return (
            <View style={{ padding: 20 }}>
                <Text style={{ color: 'white' }}>No movies data</Text>
            </View>
        );
    }

    if (movies.length === 0) {
        console.warn("⚠️ MovieList: movies array is empty");
        return (
            <View style={{ padding: 20 }}>
                <Text style={{ color: 'white' }}>No movies available</Text>
            </View>
        );
    }

    // ✨ NEW: Handle favorite changes callback
    const handleFavoriteChange = (movieId, isFavorite) => {
        console.log(`💖 MovieList: Favorite changed for movie ${movieId}: ${isFavorite}`);
        // Callback to parent component (e.g., HomeScreen) to refresh data if needed
        if (onFavoritesChange) {
            onFavoritesChange(movieId, isFavorite);
        }
    };

    return (
        <View>
            {/* ✨ ENHANCED: More informative debug text */}
            <Text style={{ color: 'white', marginLeft: 20, marginBottom: 10 }}>
                🎬 {movies.length} phim • Nhấn ♥ để thêm vào yêu thích
            </Text>
            <FlatList
                data={movies}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => {
                    const key = `movie-${item?.id || index}-${index}`;
                    console.log("🔑 Generated key:", key, "for movie:", item?.title);
                    return key;
                }}
                ItemSeparatorComponent={() => <ItemSeparator width={15} />}
                ListHeaderComponent={() => <ItemSeparator width={20} />}
                ListFooterComponent={() => <ItemSeparator width={20} />}
                renderItem={({ item, index }) => {
                    console.log("🎬 Rendering MovieCard for:", item?.id, item?.title, "at index:", index);
                    return (
                        <MovieCard
                            movie={item}
                            onPress={() => {
                                console.log("🎬 MovieCard pressed:", item?.id);
                                handleMoviePress && handleMoviePress(item?.id);
                            }}
                            heartLess={false}
                            // ✨ NEW: Pass favorites change callback
                            onFavoriteChange={handleFavoriteChange}
                        />
                    );
                }}
                onEndReachedThreshold={0.1}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={false}
                style={{ minHeight: 200 }}
            />
        </View>
    );
};

export default MovieList;
