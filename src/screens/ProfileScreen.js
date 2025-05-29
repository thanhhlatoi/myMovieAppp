// 📄 src/screens/ProfileScreen.js - Netflix-Style Enhanced Profile
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    Switch,
    Modal,
    Animated,
    Dimensions,
    StatusBar,
    ImageBackground,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONTS } from '../constants/Fonts';
import { COLORS } from '../constants/Colors';
import ProfileService from '../services/ProfileService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [settings, setSettings] = useState({
        notifications: true,
        autoPlay: false,
        downloadWifi: true,
        darkMode: true,
        dataReduction: false,
        parentalControls: false,
        offlineMode: true
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // profile, settings, activity
    
    // Animations
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // ✨ NETFLIX FEATURE: Parallax header animation
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [250, 100],
        extrapolate: 'clamp',
    });

    const avatarScale = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [1, 0.6],
        extrapolate: 'clamp',
    });

    const titleOpacity = scrollY.interpolate({
        inputRange: [0, 100, 200],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const [profileData, statsData] = await Promise.all([
                ProfileService.getCurrentProfile(),
                ProfileService.getUserStats().catch(() => null) // Don't fail if stats not available
            ]);
            
            setProfile(profileData);
            setUserStats(statsData);
        } catch (error) {
            console.error('Error loading profile data:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin profile');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProfileData();
        setRefreshing(false);
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfileScreen');
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePasswordScreen');
    };

    const handleSaveSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        
        // Netflix-style feedback
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
        
        // TODO: Save to backend
        console.log(`✅ ${key} updated to ${value}`);
    };

    const handleLogout = () => {
        Alert.alert(
            '🚪 Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear stored data
                            await AsyncStorage.multiRemove(['authToken', 'userData']);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'login' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    const getAvatarSource = () => {
        if (!profile) return { uri: 'https://via.placeholder.com/150' };
        return { uri: ProfileService.getAvatarUrl(profile.avatar, profile.fullName) };
    };

    const renderProfileTab = () => (
        <View style={styles.tabContent}>
            {/* ✨ NETFLIX FEATURE: Enhanced Stats Cards */}
            <View style={styles.statsGrid}>
                <NetflixStatCard
                    icon="access-time"
                    label="Thời gian xem"
                    value={userStats ? ProfileService.formatWatchTime(userStats.totalWatchTime) : '0h'}
                    subtitle="Tổng cộng"
                    color="#E50914"
                    gradient={['#E50914', '#FF6B6B']}
                />
                <NetflixStatCard
                    icon="movie"
                    label="Đã xem"
                    value={userStats?.totalMoviesWatched || 0}
                    subtitle="Phim & Shows"
                    color="#FF6B6B"
                    gradient={['#FF6B6B', '#FFD93D']}
                />
                <NetflixStatCard
                    icon="star"
                    label="Đánh giá"
                    value={userStats?.reviewsCount || 0}
                    subtitle={`TB: ${userStats?.avgRating?.toFixed(1) || '0.0'}`}
                    color="#6BCF7F"
                    gradient={['#6BCF7F', '#4D96FF']}
                />
                <NetflixStatCard
                    icon="local-fire-department"
                    label="Streak"
                    value={userStats?.watchStreak || 0}
                    subtitle="Ngày liên tiếp"
                    color="#FFD93D"
                    gradient={['#FFD93D', '#FF9A9E']}
                />
            </View>

            {/* Profile Info Section */}
            <NetflixSection title="👤 Thông tin cá nhân" subtitle="Chi tiết tài khoản">
                <View style={styles.profileInfoContainer}>
                    <ProfileInfoItem
                        icon="email"
                        label="Email"
                        value={profile?.email || 'Chưa cập nhật'}
                    />
                    <ProfileInfoItem
                        icon="phone"
                        label="Số điện thoại"
                        value={profile?.phone || 'Chưa cập nhật'}
                    />
                    <ProfileInfoItem
                        icon="location-on"
                        label="Quốc gia"
                        value={profile?.country || 'Chưa cập nhật'}
                    />
                    <ProfileInfoItem
                        icon="cake"
                        label="Ngày sinh"
                        value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    />
                    <ProfileInfoItem
                        icon="schedule"
                        label="Tham gia"
                        value={profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                    />
                </View>
            </NetflixSection>

            {/* ✨ NETFLIX FEATURE: Favorite Genres */}
            {userStats?.favoriteGenres && userStats.favoriteGenres.length > 0 && (
                <NetflixSection title="🎭 Thể loại yêu thích" subtitle="Sở thích của bạn">
                    <View style={styles.genreContainer}>
                        {userStats.favoriteGenres.map((genre, index) => (
                            <GenreChip key={index} title={genre} />
                        ))}
                    </View>
                </NetflixSection>
            )}

            {/* Bio Section */}
            {profile?.bio && (
                <NetflixSection title="📝 Giới thiệu" subtitle="Về bản thân">
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                </NetflixSection>
            )}

            {/* ✨ NETFLIX FEATURE: Quick Actions */}
            <NetflixSection title="⚡ Quản lý tài khoản" subtitle="Cài đặt & tính năng">
                <View style={styles.quickActions}>
                    <QuickActionButton
                        icon="edit"
                        title="Chỉnh sửa"
                        subtitle="Cập nhật thông tin"
                        onPress={handleEditProfile}
                    />
                    <QuickActionButton
                        icon="lock"
                        title="Đổi mật khẩu"
                        subtitle="Bảo mật tài khoản"
                        onPress={handleChangePassword}
                    />
                    <QuickActionButton
                        icon="history"
                        title="Lịch sử"
                        subtitle="Xem gần đây"
                        onPress={() => console.log('History')}
                    />
                    <QuickActionButton
                        icon="favorite"
                        title="Yêu thích"
                        subtitle="Phim đã lưu"
                        onPress={() => navigation.navigate('Favorites')}
                    />
                </View>
            </NetflixSection>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.loadingText}>Đang tải thông tin profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error" size={80} color="#666" />
                <Text style={styles.errorText}>Không thể tải thông tin profile</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            {/* ✨ NETFLIX FEATURE: Parallax Header */}
            <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
                <ImageBackground
                    source={{ uri: profile.coverImage }}
                    style={styles.coverImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                        style={styles.headerGradient}
                    >
                        {/* Header Actions */}
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.headerButton}
                            >
                                <Icon name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            
                            <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>
                                Profile
                            </Animated.Text>
                            
                            <TouchableOpacity
                                onPress={handleEditProfile}
                                style={styles.headerButton}
                            >
                                <Icon name="edit" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Profile Info */}
                        <Animated.View style={[styles.profileInfo, { opacity: titleOpacity }]}>
                            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
                                <Image source={getAvatarSource()} style={styles.avatar} />
                                <View style={styles.premiumBadge}>
                                    <Text style={styles.premiumText}>PREMIUM</Text>
                                </View>
                            </Animated.View>
                            
                            <Text style={styles.userName}>{profile.name}</Text>
                            <Text style={styles.userEmail}>{profile.email}</Text>
                            <Text style={styles.joinDate}>Thành viên từ {profile.joinDate}</Text>
                        </Animated.View>
                    </LinearGradient>
                </ImageBackground>
            </Animated.View>

            {/* ✨ NETFLIX FEATURE: Tab Navigation */}
            <View style={styles.tabContainer}>
                <TabButton
                    title="Profile"
                    icon="person"
                    active={activeTab === 'profile'}
                    onPress={() => setActiveTab('profile')}
                />
                <TabButton
                    title="Settings"
                    icon="settings"
                    active={activeTab === 'settings'}
                    onPress={() => setActiveTab('settings')}
                />
                <TabButton
                    title="Activity"
                    icon="analytics"
                    active={activeTab === 'activity'}
                    onPress={() => setActiveTab('activity')}
                />
            </View>

            {/* Content */}
            <Animated.ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { 
                        useNativeDriver: false,
                        listener: (event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            headerOpacity.setValue(Math.min(offsetY / 100, 1));
                        }
                    }
                )}
                scrollEventThrottle={16}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'settings' && renderSettingsTab()}
                    {activeTab === 'activity' && renderActivityTab()}
                    
                    {/* ✨ NETFLIX FEATURE: Logout Section */}
                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Icon name="logout" size={24} color="#E50914" />
                            <Text style={styles.logoutText}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.ScrollView>
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

// ✨ NETFLIX COMPONENTS

// Netflix-style Stat Card
const NetflixStatCard = ({ icon, label, value, subtitle, gradient }) => (
    <View style={styles.statCard}>
        <LinearGradient colors={gradient} style={styles.statGradient}>
            <Icon name={icon} size={28} color="#fff" style={styles.statIcon} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statSubtitle}>{subtitle}</Text>
        </LinearGradient>
    </View>
);

// Netflix-style Section
const NetflixSection = ({ title, subtitle, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        {children}
    </View>
);

// Netflix-style Setting Item
const NetflixSettingItem = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={styles.settingItem}>
        <View style={styles.settingIcon}>
            <Icon name={icon} size={24} color="#E50914" />
        </View>
        <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#333', true: '#E50914' }}
            thumbColor={value ? '#fff' : '#ccc'}
            ios_backgroundColor="#333"
        />
    </View>
);

// Achievement Badge
const AchievementBadge = ({ title }) => (
    <View style={styles.achievementBadge}>
        <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.achievementGradient}
        >
            <Icon name="star" size={20} color="#fff" />
            <Text style={styles.achievementText}>{title}</Text>
        </LinearGradient>
    </View>
);

// Genre Chip
const GenreChip = ({ title }) => (
    <View style={styles.genreChip}>
        <Text style={styles.genreText}>{title}</Text>
    </View>
);

// Quick Action Button
const QuickActionButton = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.quickActionGradient}
        >
            <Icon name={icon} size={32} color="#E50914" />
            <Text style={styles.quickActionTitle}>{title}</Text>
            <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </LinearGradient>
    </TouchableOpacity>
);

// Tab Button
const TabButton = ({ title, icon, active, onPress }) => (
    <TouchableOpacity 
        style={[styles.tabButton, active && styles.tabButtonActive]} 
        onPress={onPress}
    >
        <Icon name={icon} size={20} color={active ? '#E50914' : '#666'} />
        <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
            {title}
        </Text>
        {active && <View style={styles.tabButtonIndicator} />}
    </TouchableOpacity>
);

// Activity Chart (placeholder)
const ActivityChart = () => (
    <View style={styles.activityChart}>
        <Text style={styles.chartTitle}>Hoạt động 7 ngày qua</Text>
        <View style={styles.chartContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <View key={day} style={styles.chartBar}>
                    <View style={[styles.chartBarFill, { height: Math.random() * 60 + 20 }]} />
                    <Text style={styles.chartDay}>T{day}</Text>
                </View>
            ))}
        </View>
    </View>
);

// Recently Watched (placeholder)
const RecentlyWatched = () => (
    <View style={styles.recentlyWatched}>
        <Text style={styles.recentTitle}>Chưa có nội dung xem gần đây</Text>
        <Text style={styles.recentSubtitle}>Bắt đầu xem để thấy lịch sử tại đây</Text>
    </View>
);

const ProfileInfoItem = ({ icon, label, value }) => (
    <View style={styles.profileInfoItem}>
        <View style={styles.profileInfoIcon}>
            <Icon name={icon} size={20} color="#E50914" />
        </View>
        <View style={styles.profileInfoContent}>
            <Text style={styles.profileInfoLabel}>{label}</Text>
            <Text style={styles.profileInfoValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    
    // ✨ NETFLIX HEADER STYLES
    headerContainer: {
        position: 'relative',
        overflow: 'hidden',
    },
    coverImage: {
        flex: 1,
        width: '100%',
    },
    headerGradient: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#E50914',
    },
    premiumBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#000',
    },
    premiumText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        textAlign: 'center',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#ccc',
        fontFamily: FONTS.REGULAR,
        marginBottom: 5,
    },
    joinDate: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },

    // ✨ NETFLIX TAB STYLES
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tabButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        position: 'relative',
    },
    tabButtonActive: {
        backgroundColor: 'rgba(229,9,20,0.1)',
    },
    tabButtonText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
        fontFamily: FONTS.REGULAR,
    },
    tabButtonTextActive: {
        color: '#E50914',
        fontWeight: 'bold',
    },
    tabButtonIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#E50914',
    },

    // ✨ NETFLIX CONTENT STYLES
    scrollContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        backgroundColor: '#000',
    },
    tabContent: {
        padding: 20,
    },

    // ✨ NETFLIX STATS STYLES
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 30,
        justifyContent: 'space-between',
    },
    statCard: {
        width: (screenWidth - 60) / 2,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    statGradient: {
        padding: 20,
        alignItems: 'center',
        minHeight: 120,
        justifyContent: 'center',
    },
    statIcon: {
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
        marginBottom: 3,
    },
    statSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
    },

    // ✨ NETFLIX SECTION STYLES
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },

    // ✨ NETFLIX SETTINGS STYLES
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    settingIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(229,9,20,0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 3,
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#999',
        fontFamily: FONTS.REGULAR,
    },

    // ✨ NETFLIX ACHIEVEMENT STYLES
    achievementBadge: {
        marginRight: 15,
        borderRadius: 10,
        overflow: 'hidden',
    },
    achievementGradient: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 120,
    },
    achievementText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 8,
    },

    // ✨ NETFLIX GENRE STYLES
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    genreChip: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E50914',
    },
    genreText: {
        color: '#E50914',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },

    // ✨ NETFLIX QUICK ACTIONS
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionButton: {
        flex: 0.3,
        borderRadius: 10,
        overflow: 'hidden',
    },
    quickActionGradient: {
        padding: 15,
        alignItems: 'center',
        minHeight: 100,
        justifyContent: 'center',
    },
    quickActionTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginTop: 8,
        textAlign: 'center',
    },
    quickActionSubtitle: {
        color: '#999',
        fontSize: 11,
        fontFamily: FONTS.REGULAR,
        marginTop: 3,
        textAlign: 'center',
    },

    // ✨ NETFLIX ACTIVITY STYLES
    activityChart: {
        backgroundColor: '#111',
        borderRadius: 10,
        padding: 20,
    },
    chartTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 15,
        textAlign: 'center',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    chartBar: {
        alignItems: 'center',
    },
    chartBarFill: {
        width: 20,
        backgroundColor: '#E50914',
        borderRadius: 10,
        marginBottom: 10,
    },
    chartDay: {
        color: '#999',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
    },

    // ✨ NETFLIX RECENTLY WATCHED
    recentlyWatched: {
        backgroundColor: '#111',
        borderRadius: 10,
        padding: 30,
        alignItems: 'center',
    },
    recentTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
        textAlign: 'center',
    },
    recentSubtitle: {
        color: '#999',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
    },

    // ✨ NETFLIX LOGOUT STYLES
    logoutSection: {
        padding: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(229,9,20,0.1)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E50914',
    },
    logoutText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 10,
    },

    // ✨ NETFLIX LOADING STYLES
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginTop: 20,
    },

    // ✨ NETFLIX ERROR STYLES
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginTop: 20,
    },
    retryButton: {
        backgroundColor: 'rgba(229,9,20,0.1)',
        padding: 15,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },

    // ✨ NETFLIX PROFILE INFO STYLES
    profileInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileInfoIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(229,9,20,0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    profileInfoContent: {
        flex: 1,
    },
    profileInfoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 5,
    },
    profileInfoValue: {
        fontSize: 14,
        color: '#ccc',
        fontFamily: FONTS.REGULAR,
    },

    // ✨ NETFLIX BIO STYLES
    bioContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
    },
    bioText: {
        fontSize: 14,
        color: '#ccc',
        fontFamily: FONTS.REGULAR,
        lineHeight: 20,
    },

    // ✨ NETFLIX PROFILE INFO CONTAINER
    profileInfoContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
    },
});

export default ProfileScreen;
