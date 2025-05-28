import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const QuickAccessMenu = ({ navigation, onTrendingPress, onTopRatedPress, onFavoritesPress, onHistoryPress }) => {
    const menuItems = [
        { icon: 'trending-up', color: COLORS.ACTIVE, text: 'Thịnh hành', onPress: onTrendingPress },
        { icon: 'star', color: COLORS.YELLOW, text: 'Đánh giá cao', onPress: onTopRatedPress },
        { icon: 'favorite', color: COLORS.HEART, text: 'Yêu thích', onPress: onFavoritesPress },
        { icon: 'history', color: '#4ECDC4', text: 'Đã xem', onPress: onHistoryPress },
    ];

    return (
        <View style={styles.container}>
            {menuItems.map((item, index) => (
                <QuickAccessItem key={index} {...item} />
            ))}
        </View>
    );
};

const QuickAccessItem = ({ icon, color, text, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <Icon name={icon} size={30} color={color} />
        <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
        borderRadius: 15,
        marginBottom: 30,
    },
    item: {
        alignItems: 'center',
    },
    text: {
        color: COLORS.WHITE,
        fontSize: 12,
        marginTop: 8,
        fontFamily: FONTS.REGULAR,
    },
});

export default QuickAccessMenu;
