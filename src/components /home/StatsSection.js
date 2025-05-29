import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const StatsSection = ({ movies = [], videos = [] }) => {
    // ⭐ SỬA LỖI: Kiểm tra và sử dụng fallback
    const dataToUse = videos.length > 0 ? videos : movies;

    // ⭐ DEFENSIVE PROGRAMMING: Kiểm tra dữ liệu tồn tại
    if (!Array.isArray(dataToUse) || dataToUse.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>📊 Thống kê</Text>
                <Text style={styles.noDataText}>Chưa có dữ liệu thống kê</Text>
            </View>
        );
    }

    // Xử lý dữ liệu videos
    if (videos.length > 0) {
        const totalViews = videos.reduce((sum, video) => {
            return sum + (video.movieProduct?.views || 0);
        }, 0);

        const totalLikes = videos.reduce((sum, video) => {
            return sum + (video.movieProduct?.likes || 0);
        }, 0);

        // Tính tổng dung lượng video
        const totalSize = videos.reduce((sum, video) => {
            return sum + (video.fileSize || 0);
        }, 0);

        // Đếm số video completed
        const completedVideos = videos.filter(video => video.status === 'COMPLETED').length;

        const stats = [
            {
                number: videos.length,
                label: 'Tổng video',
                icon: '🎬'
            },
            {
                number: completedVideos,
                label: 'Hoàn thành',
                icon: '✅'
            },
            {
                number: totalViews,
                label: 'Lượt xem',
                icon: '👁️'
            },
            {
                number: totalLikes,
                label: 'Lượt thích',
                icon: '❤️'
            },
            {
                number: `${(totalSize / (1024 * 1024 * 1024)).toFixed(1)}GB`,
                label: 'Dung lượng',
                icon: '💾'
            },
        ];

        return (
            <View style={styles.container}>
                <Text style={styles.title}>📊 Thống kê Video</Text>
                <View style={styles.grid}>
                    {stats.map((stat, index) => (
                        <StatBox key={index} {...stat} />
                    ))}
                </View>
            </View>
        );
    }

    // Xử lý dữ liệu movies (fallback)
    const totalViews = movies.reduce((sum, movie) => sum + (movie.views || 0), 0);
    const totalLikes = movies.reduce((sum, movie) => sum + (movie.likes || 0), 0);

    const stats = [
        {
            number: movies.length,
            label: 'Tổng phim',
            icon: '🎬'
        },
        {
            number: totalViews,
            label: 'Lượt xem',
            icon: '👁️'
        },
        {
            number: totalLikes,
            label: 'Lượt thích',
            icon: '❤️'
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📊 Thống kê Phim</Text>
            <View style={styles.grid}>
                {stats.map((stat, index) => (
                    <StatBox key={index} {...stat} />
                ))}
            </View>
        </View>
    );
};

const StatBox = ({ number, label, icon }) => (
    <View style={styles.box}>
        <Text style={styles.icon}>{icon}</Text>
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    box: {
        alignItems: 'center',
        minWidth: '30%',
        marginBottom: 15,
    },
    icon: {
        fontSize: 20,
        marginBottom: 5,
    },
    number: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.ACTIVE,
        fontFamily: FONTS.BOLD,
    },
    label: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 5,
        textAlign: 'center',
        fontFamily: FONTS.REGULAR,
    },
    noDataText: {
        color: '#ccc',
        textAlign: 'center',
        fontSize: 16,
        fontStyle: 'italic',
        fontFamily: FONTS.REGULAR,
    },
});

export default StatsSection;
