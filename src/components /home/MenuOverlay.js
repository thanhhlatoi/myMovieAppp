import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';
import AuthService from '../../services/AuthService';
import AuthUtils from '../../utils/authUtils';

const MenuOverlay = ({ visible, onSelect, onClose, navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            loadUserData();
        }
    }, [visible]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const userData = await AuthUtils.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const menuItems = [
        {
            id: 1,
            title: 'Thông tin cá nhân',
            subtitle: 'Quản lý hồ sơ của bạn',
            icon: 'person',
            action: 'Profile',
            color: '#4A90E2',
            onPress: () => {
                onClose();
                navigation.navigate('Profile');
            }
        },
        {
            id: 2,
            title: 'Yêu thích',
            subtitle: 'Danh sách phim đã lưu',
            icon: 'favorite',
            action: 'Favorites',
            color: '#E50914',
            onPress: () => {
                onClose();
                navigation.navigate('Favorites');
            }
        },
        {
            id: 3,
            title: 'Lịch sử xem',
            subtitle: 'Theo dõi quá trình xem',
            icon: 'history',
            action: 'History',
            color: '#50C878',
            onPress: () => {
                onClose();
                onSelect('History');
            }
        },
        {
            id: 4,
            title: 'Cài đặt',
            subtitle: 'Tùy chỉnh ứng dụng',
            icon: 'settings',
            action: 'Settings',
            color: '#9B59B6',
            onPress: () => {
                onClose();
                onSelect('Settings');
            }
        },
        {
            id: 5,
            title: 'Trợ giúp & Hỗ trợ',
            subtitle: 'Liên hệ với chúng tôi',
            icon: 'help',
            action: 'Help',
            color: '#FF9500',
            onPress: () => {
                onClose();
                onSelect('Help');
            }
        },
        {
            id: 6,
            title: 'Đăng xuất',
            subtitle: 'Thoát khỏi tài khoản',
            icon: 'logout',
            action: 'Logout',
            color: '#E50914',
            isLogout: true,
            onPress: () => {
                onClose();
                onSelect('Logout');
            }
        },
    ];

    const userDisplayName = AuthUtils.formatUserDisplayName(user);
    const userAvatar = AuthUtils.getUserAvatar(user);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} />
            
            <View style={styles.content}>
                <LinearGradient
                    colors={['#1a1a1a', '#2d2d2d']}
                    style={styles.gradientBackground}
                >
                    {/* ✨ NETFLIX FEATURE: User Profile Header */}
                    <View style={styles.userHeader}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                {userAvatar ? (
                                    <Image source={{ uri: userAvatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.defaultAvatar}>
                                        <Icon name="person" size={30} color="#fff" />
                                    </View>
                                )}
                                <View style={styles.onlineIndicator} />
                            </View>
                            
                            <View style={styles.userDetails}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#E50914" />
                                ) : (
                                    <>
                                        <Text style={styles.userName}>{userDisplayName}</Text>
                                        <Text style={styles.userEmail}>{user?.email || 'Không có email'}</Text>
                                        <View style={styles.membershipBadge}>
                                            <Text style={styles.membershipText}>PREMIUM</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                        
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* ✨ NETFLIX FEATURE: Menu Items */}
                    <View style={styles.menuList}>
                {menuItems.map(item => (
                            <NetflixMenuItem
                        key={item.id}
                        title={item.title}
                                subtitle={item.subtitle}
                                icon={item.icon}
                                color={item.color}
                                isLogout={item.isLogout}
                        onPress={item.onPress}
                    />
                ))}
                    </View>

                    {/* ✨ NETFLIX FEATURE: App Version */}
                    <View style={styles.footer}>
                        <Text style={styles.versionText}>MovieApp v1.0.0</Text>
                        <Text style={styles.copyrightText}>© 2024 Your Company</Text>
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
};

// Netflix-style Menu Item Component
const NetflixMenuItem = ({ title, subtitle, icon, color, isLogout, onPress }) => (
    <TouchableOpacity 
        style={[styles.menuItem, isLogout && styles.logoutItem]} 
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Icon name={icon} size={22} color="#fff" />
        </View>
        
        <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, isLogout && styles.logoutTitle]}>
                {title}
            </Text>
            <Text style={[styles.itemSubtitle, isLogout && styles.logoutSubtitle]}>
                {subtitle}
            </Text>
        </View>
        
        <Icon 
            name="chevron-right" 
            size={20} 
            color={isLogout ? '#E50914' : '#666'} 
        />
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
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    content: {
        position: 'absolute',
        top: 60,
        right: 15,
        width: 320,
        maxHeight: '85%',
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    gradientBackground: {
        flex: 1,
    },
    
    // ✨ NETFLIX USER HEADER STYLES
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#E50914',
    },
    defaultAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E50914',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#50C878',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 3,
    },
    userEmail: {
        fontSize: 12,
        color: '#999',
        fontFamily: FONTS.REGULAR,
        marginBottom: 5,
    },
    membershipBadge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    membershipText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    closeButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
    },

    // ✨ NETFLIX MENU STYLES
    menuList: {
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    logoutItem: {
        backgroundColor: 'rgba(229,9,20,0.1)',
        borderBottomColor: 'rgba(229,9,20,0.2)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 3,
    },
    logoutTitle: {
        color: '#E50914',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },
    logoutSubtitle: {
        color: 'rgba(229,9,20,0.8)',
    },

    // ✨ NETFLIX FOOTER STYLES
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#666',
        fontFamily: FONTS.REGULAR,
        marginBottom: 3,
    },
    copyrightText: {
        fontSize: 10,
        color: '#555',
        fontFamily: FONTS.REGULAR,
    },
});

export default MenuOverlay;
