// 📄 src/screens/ProfileScreen.js - Thông tin cá nhân
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    Switch,
    Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONTS } from '../constants/Fonts';
import { COLORS } from '../constants/Colors';
const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState({
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        joinDate: '15/03/2023',
        watchTime: '2,450',
        favoriteMovies: 156,
        watchedMovies: 89
    });

    const [settings, setSettings] = useState({
        notifications: true,
        autoPlay: false,
        downloadWifi: true,
        darkMode: true
    });

    const [showEditModal, setShowEditModal] = useState(false);

    const handleEditProfile = () => {
        setShowEditModal(true);
    };

    const handleSaveSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        Alert.alert('Thành công', 'Đã cập nhật cài đặt');
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => {
                        // Handle logout logic
                        console.log('User logged out');
                        // navigation.navigate('Login');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
                <TouchableOpacity onPress={handleEditProfile}>
                    <Icon name="edit" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        <TouchableOpacity style={styles.cameraButton}>
                            <Icon name="camera-alt" size={20} color={COLORS.WHITE} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.joinDate}>Tham gia từ {user.joinDate}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <StatItem
                        icon="access-time"
                        label="Thời gian xem"
                        value={`${user.watchTime} phút`}
                        color={COLORS.ACTIVE}
                    />
                    <StatItem
                        icon="favorite"
                        label="Phim yêu thích"
                        value={user.favoriteMovies}
                        color={COLORS.HEART}
                    />
                    <StatItem
                        icon="visibility"
                        label="Đã xem"
                        value={user.watchedMovies}
                        color={COLORS.YELLOW}
                    />
                </View>

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    <MenuHeader title="Tài khoản" />

                    <MenuItem
                        icon="person"
                        title="Chỉnh sửa hồ sơ"
                        subtitle="Cập nhật thông tin cá nhân"
                        onPress={handleEditProfile}
                        showArrow
                    />

                    <MenuItem
                        icon="security"
                        title="Bảo mật"
                        subtitle="Đổi mật khẩu, xác thực 2 bước"
                        onPress={() => console.log('Security')}
                        showArrow
                    />

                    <MenuItem
                        icon="payment"
                        title="Thanh toán"
                        subtitle="Phương thức thanh toán, lịch sử"
                        onPress={() => console.log('Payment')}
                        showArrow
                    />
                </View>

                {/* Settings */}
                <View style={styles.menuSection}>
                    <MenuHeader title="Cài đặt" />

                    <SettingItem
                        icon="notifications"
                        title="Thông báo"
                        subtitle="Nhận thông báo về phim mới"
                        value={settings.notifications}
                        onValueChange={(value) => handleSaveSetting('notifications', value)}
                    />

                    <SettingItem
                        icon="play-arrow"
                        title="Tự động phát"
                        subtitle="Tự động phát tập tiếp theo"
                        value={settings.autoPlay}
                        onValueChange={(value) => handleSaveSetting('autoPlay', value)}
                    />

                    <SettingItem
                        icon="wifi"
                        title="Tải chỉ qua WiFi"
                        subtitle="Tiết kiệm dữ liệu di động"
                        value={settings.downloadWifi}
                        onValueChange={(value) => handleSaveSetting('downloadWifi', value)}
                    />

                    <SettingItem
                        icon="brightness-6"
                        title="Chế độ tối"
                        subtitle="Giao diện tối cho mắt"
                        value={settings.darkMode}
                        onValueChange={(value) => handleSaveSetting('darkMode', value)}
                    />
                </View>

                {/* Other Options */}
                <View style={styles.menuSection}>
                    <MenuHeader title="Khác" />

                    <MenuItem
                        icon="help"
                        title="Trợ giúp & Hỗ trợ"
                        subtitle="FAQ, liên hệ hỗ trợ"
                        onPress={() => console.log('Help')}
                        showArrow
                    />

                    <MenuItem
                        icon="info"
                        title="Về ứng dụng"
                        subtitle="Phiên bản 1.0.0"
                        onPress={() => console.log('About')}
                        showArrow
                    />

                    <MenuItem
                        icon="star"
                        title="Đánh giá ứng dụng"
                        subtitle="Cho chúng tôi 5 sao nhé!"
                        onPress={() => console.log('Rate')}
                        showArrow
                    />
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={24} color={COLORS.ACTIVE} />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={showEditModal}
                user={user}
                onSave={(updatedUser) => {
                    setUser(updatedUser);
                    setShowEditModal(false);
                    Alert.alert('Thành công', 'Đã cập nhật thông tin');
                }}
                onClose={() => setShowEditModal(false)}
            />
        </View>
    );
};

// Sub Components
const StatItem = ({ icon, label, value, color }) => (
    <View style={styles.statItem}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const MenuHeader = ({ title }) => (
    <Text style={styles.menuHeader}>{title}</Text>
);

const MenuItem = ({ icon, title, subtitle, onPress, showArrow = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
                <Icon name={icon} size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        {showArrow && (
            <Icon name="chevron-right" size={24} color={COLORS.GRAY} />
        )}
    </TouchableOpacity>
);

const SettingItem = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
                <Icon name={icon} size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#767577', true: COLORS.ACTIVE }}
            thumbColor={value ? COLORS.WHITE : '#f4f3f4'}
        />
    </View>
);

const EditProfileModal = ({ visible, user, onSave, onClose }) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Icon name="close" size={24} color={COLORS.WHITE} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                    <Text style={styles.modalText}>
                        Tính năng chỉnh sửa hồ sơ đang được phát triển...
                    </Text>

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => onSave(user)}
                    >
                        <Text style={styles.modalButtonText}>Lưu thay đổi</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BASIC_BACKGROUND,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 15,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.ACTIVE,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.ACTIVE,
        borderRadius: 15,
        padding: 8,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 5,
        fontFamily: FONTS.BOLD,
    },
    userEmail: {
        fontSize: 16,
        color: COLORS.GRAY,
        marginBottom: 5,
        fontFamily: FONTS.REGULAR,
    },
    joinDate: {
        fontSize: 14,
        color: COLORS.GRAY,
        fontFamily: FONTS.REGULAR,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginTop: 8,
        marginBottom: 4,
        fontFamily: FONTS.BOLD,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.GRAY,
        fontFamily: FONTS.REGULAR,
    },
    menuSection: {
        marginHorizontal: 20,
        marginTop: 30,
    },
    menuHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        marginBottom: 15,
        fontFamily: FONTS.BOLD,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.ACTIVE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.WHITE,
        fontFamily: FONTS.REGULAR,
    },
    menuSubtitle: {
        fontSize: 14,
        color: COLORS.GRAY,
        marginTop: 2,
        fontFamily: FONTS.REGULAR,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 30,
        borderWidth: 1,
        borderColor: COLORS.ACTIVE,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.ACTIVE,
        marginLeft: 10,
        fontFamily: FONTS.BOLD,
    },
    bottomPadding: {
        height: 50,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    modalBody: {
        padding: 20,
    },
    modalText: {
        fontSize: 16,
        color: COLORS.WHITE,
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: FONTS.REGULAR,
    },
    modalButton: {
        backgroundColor: COLORS.ACTIVE,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
});

export default ProfileScreen;
