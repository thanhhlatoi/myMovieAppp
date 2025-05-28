import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/Fonts';

const MenuOverlay = ({ visible, onSelect, onClose, navigation }) => {
    if (!visible) return null;

    const menuItems = [
        {
            id: 1,
            title: '👤 Thông tin cá nhân',
            action: 'Profile',
            onPress: () => {
                onClose();
                navigation.navigate('Profile');
            }
        },
        {
            id: 2,
            title: '❤️ Yêu thích',
            action: 'Favorites',
            onPress: () => {
                onClose();
                navigation.navigate('Favorites');
            }
        },
        {
            id: 3,
            title: '⚙️ Cài đặt',
            action: 'Settings',
            onPress: () => {
                onClose();
                onSelect('Settings');
            }
        },
        {
            id: 4,
            title: '🚪 Đăng xuất',
            action: 'Logout',
            onPress: () => {
                onClose();
                onSelect('Logout');
            }
        },
    ];

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} />
            <View style={styles.content}>
                <Text style={styles.title}>Menu</Text>
                {menuItems.map(item => (
                    <MenuItem
                        key={item.id}
                        title={item.title}
                        onPress={item.onPress}
                    />
                ))}
            </View>
        </View>
    );
};

const MenuItem = ({ title, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <Text style={styles.itemText}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        position: 'absolute',
        top: 100,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        fontFamily: FONTS.BOLD,
    },
    item: {
        padding: 15,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        fontFamily: FONTS.REGULAR,
    },
});

export default MenuOverlay;
