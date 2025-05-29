import React from 'react';
import { FlatList } from 'react-native';
import MovieCard from '../movie/MovieCard'; // ⭐ Component mới
import ItemSeparator from '../common/ItemSeparator';

const VideoList = ({ videos, handleVideoPress }) => (
    <FlatList
        data={videos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `video-${item.id}-${index}`}
        ItemSeparatorComponent={() => <ItemSeparator width={15} />}
        ListHeaderComponent={() => <ItemSeparator width={20} />}
        ListFooterComponent={() => <ItemSeparator width={20} />}
        renderItem={({ item }) => (
            <MovieCard
                video={item} // ⭐ Truyền video object
                onPress={() => handleVideoPress(item.id)}
                heartLess={false}
            />
        )}
    />
);

export default VideoList;
