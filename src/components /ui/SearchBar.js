import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const SearchBar = ({ onPress, placeholder = "Tìm kiếm phim..." }) => (
    <TouchableOpacity style={styles.container} onPress={onPress}>
        <Icon name="search" size={20} color={COLORS.GRAY} />
        <Text style={styles.text}>{placeholder}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        flex: 1,
        marginRight: 10,
    },
    text: {
        color: COLORS.GRAY,
        marginLeft: 10,
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
    },
});

export default SearchBar;
