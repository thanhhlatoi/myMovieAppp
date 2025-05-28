import React from 'react';
import { View, FlatList } from 'react-native';
import GenreCard from '../ui/GenreCard';
import ItemSeparator from '../common/ItemSeparator';

const GenreList = ({ genres, activeGenre, setActiveGenre }) => (
    <View style={{ paddingVertical: 5 }}>
        <FlatList
            data={genres}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.name}-${index}-${item.id}`}
            ItemSeparatorComponent={() => <ItemSeparator width={12} />}
            ListHeaderComponent={() => <ItemSeparator width={20} />}
            ListFooterComponent={() => <ItemSeparator width={20} />}
            renderItem={({ item }) => (
                <GenreCard
                    genreName={item.name}
                    active={item.name === activeGenre}
                    onPress={setActiveGenre}
                />
            )}
        />
    </View>
);

export default GenreList;
