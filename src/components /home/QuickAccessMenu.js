import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const QuickAccessItem = ({ icon, color, text, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
);

const QuickAccessMenu = ({ navigation, onFavoritesPress, onHistoryPress }) => {
    const menuItems = [
        { icon: 'favorite', color: COLORS.HEART, text: 'Yêu thích', onPress: onFavoritesPress },
        { icon: 'history', color: COLORS.SUCCESS, text: 'Đã xem', onPress: onHistoryPress },
    ];

    return (
        <View style={styles.container}>
            {menuItems.map((item, index) => (
                <QuickAccessItem key={index} {...item} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: COLORS.CARD_BACKGROUND,
        marginHorizontal: 20,
        borderRadius: 15,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
        shadowColor: COLORS.TEXT_PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    text: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 12,
        marginTop: 8,
        fontFamily: FONTS.REGULAR,
        fontWeight: '600',
    },
});

export default QuickAccessMenu;
