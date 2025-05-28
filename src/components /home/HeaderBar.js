import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';


const HeaderBar = ({ setMenuVisible, onSearchPress, onNotificationPress }) => (
    <View style={styles.container}>
        <View style={styles.left}>
            <Text style={styles.appTitle}>🎬 MovieApp</Text>
            <Text style={styles.greeting}>Khám phá điện ảnh</Text>
        </View>
        <View style={styles.right}>
            <TouchableOpacity style={styles.button} onPress={onSearchPress}>
                <Icon name="search" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onNotificationPress}>
                <Icon name="notifications" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={styles.menuButton}
            >
                <Icon name="account-circle" size={28} color={COLORS.WHITE} />
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    left: {
        flex: 1,
    },
    appTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    greeting: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 2,
        fontFamily: FONTS.REGULAR,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        marginLeft: 15,
        padding: 5,
    },
    menuButton: {
        marginLeft: 10,
    },
});

export default HeaderBar;
