import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const StatsSection = ({ movies }) => {
    const totalViews = movies.reduce((sum, movie) => sum + (movie.views || 0), 0);
    const totalLikes = movies.reduce((sum, movie) => sum + (movie.likes || 0), 0);

    const stats = [
        { number: movies.length, label: 'Tổng phim' },
        { number: totalViews, label: 'Lượt xem' },
        { number: totalLikes, label: 'Lượt thích' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📊 Thống kê</Text>
            <View style={styles.row}>
                {stats.map((stat, index) => (
                    <StatBox key={index} {...stat} />
                ))}
            </View>
        </View>
    );
};

const StatBox = ({ number, label }) => (
    <View style={styles.box}>
        <Text style={styles.number}>{number}</Text>
        <Text style={styles.label}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 15,
        textAlign: 'center',
        fontFamily: FONTS.BOLD,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    box: {
        alignItems: 'center',
    },
    number: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.ACTIVE,
        fontFamily: FONTS.BOLD,
    },
    label: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 5,
        fontFamily: FONTS.REGULAR,
    },
});

export default StatsSection;
