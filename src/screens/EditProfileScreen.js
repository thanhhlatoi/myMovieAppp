// 📄 src/screens/EditProfileScreen.js - Edit Profile Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import CustomDatePicker from '../components/DatePicker';
import { FONTS } from '../constants/Fonts';
import { COLORS } from '../constants/Colors';
import ProfileService from '../services/ProfileService';

const EditProfileScreen = ({ navigation, route }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        dateOfBirth: new Date(),
        gender: '',
        country: '',
        avatar: null
    });

    useEffect(() => {
        loadProfileData();
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để thay đổi avatar');
            }
        }
    };

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const profileData = await ProfileService.getCurrentProfile();
            setProfile(profileData);
            
            // Populate form with current data
            setFormData({
                fullName: profileData.fullName || profileData.name || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                bio: profileData.bio || '',
                dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date(),
                gender: profileData.gender || '',
                country: profileData.country || '',
                avatar: profileData.avatar
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDateChange = (selectedDate) => {
        if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                dateOfBirth: selectedDate
            }));
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setFormData(prev => ({
                    ...prev,
                    avatar: result.assets[0].uri
                }));
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const handleSave = async () => {
        try {
            setUpdating(true);

            // Validate required fields
            if (!formData.fullName.trim()) {
                Alert.alert('Lỗi', 'Họ tên không được để trống');
                return;
            }

            if (!formData.email.trim()) {
                Alert.alert('Lỗi', 'Email không được để trống');
                return;
            }

            // Prepare update data
            const updateData = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                bio: formData.bio.trim(),
                dateOfBirth: formData.dateOfBirth.toISOString(),
                gender: formData.gender,
                country: formData.country.trim()
            };

            // Update profile
            const updatedProfile = await ProfileService.updateProfile(updateData);

            // Upload avatar if changed
            if (formData.avatar && formData.avatar !== profile.avatar) {
                try {
                    await ProfileService.uploadAvatar(formData.avatar);
                } catch (avatarError) {
                    console.warn('Avatar upload failed:', avatarError);
                    // Continue even if avatar upload fails
                }
            }

            Alert.alert(
                'Thành công',
                'Cập nhật thông tin thành công!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const getAvatarSource = () => {
        if (formData.avatar) {
            return { uri: formData.avatar };
        }
        return { uri: ProfileService.getAvatarUrl(profile?.avatar, formData.fullName) };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            {/* Header */}
            <LinearGradient
                colors={['#E50914', '#8B0000']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                    
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Icon name="check" size={24} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        <Image source={getAvatarSource()} style={styles.avatar} />
                        <View style={styles.avatarOverlay}>
                            <Icon name="camera-alt" size={32} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarText}>Nhấn để thay đổi ảnh đại diện</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên *</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="person" size={20} color="#E50914" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.fullName}
                                onChangeText={(text) => handleInputChange('fullName', text)}
                                placeholder="Nhập họ và tên"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="email" size={20} color="#E50914" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                placeholder="Nhập email"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#E50914" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => handleInputChange('phone', text)}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ngày sinh</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Icon name="cake" size={20} color="#E50914" style={styles.inputIcon} />
                            <Text style={styles.dateText}>
                                {formData.dateOfBirth.toLocaleDateString('vi-VN')}
                            </Text>
                            <Icon name="arrow-drop-down" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Giới tính</Text>
                        <View style={styles.genderContainer}>
                            {['Nam', 'Nữ', 'Khác'].map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[
                                        styles.genderOption,
                                        formData.gender === gender && styles.genderOptionActive
                                    ]}
                                    onPress={() => handleInputChange('gender', gender)}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        formData.gender === gender && styles.genderTextActive
                                    ]}>
                                        {gender}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Country */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quốc gia</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="location-on" size={20} color="#E50914" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.country}
                                onChangeText={(text) => handleInputChange('country', text)}
                                placeholder="Nhập quốc gia"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Giới thiệu</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="description" size={20} color="#E50914" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={formData.bio}
                                onChangeText={(text) => handleInputChange('bio', text)}
                                placeholder="Viết vài dòng về bản thân..."
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButtonLarge, updating && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={updating}
                >
                    <LinearGradient
                        colors={updating ? ['#666', '#444'] : ['#E50914', '#8B0000']}
                        style={styles.saveGradient}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Icon name="save" size={24} color="#fff" />
                        )}
                        <Text style={styles.saveButtonText}>
                            {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomSpace} />
            </ScrollView>

                         {/* Custom Date Picker */}
             <CustomDatePicker
                 visible={showDatePicker}
                 onClose={() => setShowDatePicker(false)}
                 onDateSelect={handleDateChange}
                 initialDate={formData.dateOfBirth}
             />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        marginTop: 15,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    saveButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
        flex: 1,
        backgroundColor: '#000',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#E50914',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#E50914',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
    },
    avatarText: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontFamily: FONTS.REGULAR,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontFamily: FONTS.REGULAR,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderOption: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingVertical: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    genderOptionActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    genderText: {
        fontSize: 16,
        color: '#ccc',
        fontFamily: FONTS.REGULAR,
    },
    genderTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButtonLarge: {
        marginHorizontal: 20,
        marginTop: 30,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 10,
    },
    bottomSpace: {
        height: 50,
    },
});

export default EditProfileScreen; 