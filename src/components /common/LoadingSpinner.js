import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const LoadingSpinner = ({ message = "Đang tải..." }) => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.ACTIVE} />
        <Text style={styles.text}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.BASIC_BACKGROUND,
    },
    text: {
        color: COLORS.WHITE,
        fontSize: 18,
        marginTop: 20,
        fontFamily: FONTS.REGULAR,
    },
});

export default LoadingSpinner;
