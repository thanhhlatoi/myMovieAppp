import React from 'react';
import { FlatList } from 'react-native';
import MovieCard from '../movie/MovieCard';
import ItemSeparator from '../common/ItemSeparator';

const MovieList = ({ movies, handleMoviePress }) => (
    <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ItemSeparatorComponent={() => <ItemSeparator width={15} />}
        ListHeaderComponent={() => <ItemSeparator width={20} />}
        ListFooterComponent={() => <ItemSeparator width={20} />}
        renderItem={({ item }) => (
            <MovieCard
                movie={item}
                onPress={() => handleMoviePress(item.id)}
                heartLess={false}
            />
        )}
    />
);

export default MovieList;
