// 📄 src/screens/EditProfileScreen.js - Netflix-Style Edit Profile Screen
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants/Colors';
import { FONTS } from '../constants/Fonts';
import ProfileService from '../services/ProfileService';

// Custom Date Picker Component
const CustomDatePicker = ({ visible, onClose, onDateSelect, initialDate }) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [day, setDay] = useState(initialDate?.getDate() || new Date().getDate());
    const [month, setMonth] = useState(initialDate?.getMonth() || new Date().getMonth());
    const [year, setYear] = useState(initialDate?.getFullYear() || new Date().getFullYear());

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1);
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    const handleConfirm = () => {
        const newDate = new Date(year, month, day);
        onDateSelect(newDate);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                        <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.datePickerContent}>
                        <View style={styles.datePickerRow}>
                            <View style={styles.datePickerColumn}>
                                <Text style={styles.datePickerLabel}>Ngày</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={day}
                                        onValueChange={setDay}
                                        style={styles.datePicker}
                                        dropdownIconColor="#999"
                                    >
                                        {days.map(d => (
                                            <Picker.Item key={d} label={d.toString()} value={d} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                            
                            <View style={styles.datePickerColumn}>
                                <Text style={styles.datePickerLabel}>Tháng</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={month}
                                        onValueChange={setMonth}
                                        style={styles.datePicker}
                                        dropdownIconColor="#999"
                                    >
                                        {months.map((m, i) => (
                                            <Picker.Item key={i} label={m} value={i} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                            
                            <View style={styles.datePickerColumn}>
                                <Text style={styles.datePickerLabel}>Năm</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={year}
                                        onValueChange={setYear}
                                        style={styles.datePicker}
                                        dropdownIconColor="#999"
                                    >
                                        {years.map(y => (
                                            <Picker.Item key={y} label={y.toString()} value={y} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.datePickerActions}>
                        <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
                            <Text style={styles.datePickerButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.datePickerButton, styles.datePickerConfirm]} onPress={handleConfirm}>
                            <Text style={[styles.datePickerButtonText, styles.datePickerConfirmText]}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const EditProfileScreen = ({ navigation }) => {
    // Profile states
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        username: '',
        bio: '',
        dateOfBirth: new Date(),
        gender: '',
        country: '',
        phone: '',
        avatar: null
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const countries = [
        'Việt Nam', 'United States', 'Canada', 'United Kingdom', 
        'Australia', 'Germany', 'France', 'Japan', 'South Korea', 'Other'
    ];

    const genders = [
        { label: 'Nam', value: 'male' },
        { label: 'Nữ', value: 'female' },
        { label: 'Khác', value: 'other' },
        { label: 'Không muốn tiết lộ', value: 'prefer_not_to_say' }
    ];

    useEffect(() => {
        loadProfile();
        
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const profileData = await ProfileService.getCurrentProfile();
            setProfile({
                fullName: profileData.fullName || '',
                email: profileData.email || '',
                username: profileData.username || '',
                bio: profileData.bio || '',
                dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date(),
                gender: profileData.gender || '',
                country: profileData.country || '',
                phone: profileData.phone || '',
                avatar: profileData.avatar
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin profile');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!profile.fullName.trim()) {
            newErrors.fullName = 'Họ tên không được để trống';
        }

        if (!profile.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!profile.username.trim()) {
            newErrors.username = 'Username không được để trống';
        } else if (profile.username.length < 3) {
            newErrors.username = 'Username phải có ít nhất 3 ký tự';
        }

        if (profile.phone && !/^[0-9+\-\s()]*$/.test(profile.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            
            const updateData = {
                fullName: profile.fullName.trim(),
                email: profile.email.trim(),
                username: profile.username.trim(),
                bio: profile.bio.trim(),
                dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
                gender: profile.gender,
                country: profile.country,
                phone: profile.phone.trim()
            };

            await ProfileService.updateProfile(updateData);
            
            Alert.alert(
                'Thành công',
                'Thông tin profile đã được cập nhật!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Lỗi', 'Không thể lưu thông tin profile. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarPress = () => {
        Alert.alert(
            'Chọn ảnh đại diện',
            'Chọn từ đâu?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Camera', onPress: () => pickImage('camera') },
                { text: 'Thư viện', onPress: () => pickImage('library') }
            ]
        );
    };

    const pickImage = async (source) => {
        try {
            let result;
            
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Lỗi', 'Cần quyền truy cập camera');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets[0]) {
                await uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const uploadAvatar = async (imageUri) => {
        try {
            setUploadingAvatar(true);
            const response = await ProfileService.uploadAvatar(imageUri);
            setProfile(prev => ({ ...prev, avatar: response.avatarUrl }));
            Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Lỗi', 'Không thể upload ảnh đại diện');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDateSelect = (selectedDate) => {
        setProfile(prev => ({ ...prev, dateOfBirth: selectedDate }));
    };

    const getAvatarSource = () => {
        return { uri: ProfileService.getAvatarUrl(profile.avatar, profile.fullName) };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.loadingText}>Đang tải thông tin profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <KeyboardAvoidingView 
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Chỉnh sửa Profile</Text>
                    
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Lưu</Text>
                        )}
                    </TouchableOpacity>
                </LinearGradient>

                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Avatar Section */}
                        <View style={styles.avatarSection}>
                            <TouchableOpacity 
                                style={styles.avatarContainer}
                                onPress={handleAvatarPress}
                                disabled={uploadingAvatar}
                            >
                                <Image 
                                    source={getAvatarSource()} 
                                    style={styles.avatar}
                                />
                                {uploadingAvatar && (
                                    <View style={styles.avatarLoading}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                )}
                                <View style={styles.avatarOverlay}>
                                    <Icon name="camera-alt" size={24} color="#fff" />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.avatarHelp}>Nhấn để thay đổi ảnh đại diện</Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            {/* Full Name */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Họ và tên *</Text>
                                <TextInput
                                    style={[styles.textInput, errors.fullName && styles.textInputError]}
                                    value={profile.fullName}
                                    onChangeText={(text) => {
                                        setProfile(prev => ({ ...prev, fullName: text }));
                                        if (errors.fullName) {
                                            setErrors(prev => ({ ...prev, fullName: null }));
                                        }
                                    }}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor="#666"
                                />
                                {errors.fullName && (
                                    <Text style={styles.errorText}>{errors.fullName}</Text>
                                )}
                            </View>

                            {/* Email */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Email *</Text>
                                <TextInput
                                    style={[styles.textInput, errors.email && styles.textInputError]}
                                    value={profile.email}
                                    onChangeText={(text) => {
                                        setProfile(prev => ({ ...prev, email: text }));
                                        if (errors.email) {
                                            setErrors(prev => ({ ...prev, email: null }));
                                        }
                                    }}
                                    placeholder="Nhập email"
                                    placeholderTextColor="#666"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {errors.email && (
                                    <Text style={styles.errorText}>{errors.email}</Text>
                                )}
                            </View>

                            {/* Username */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Username *</Text>
                                <TextInput
                                    style={[styles.textInput, errors.username && styles.textInputError]}
                                    value={profile.username}
                                    onChangeText={(text) => {
                                        setProfile(prev => ({ ...prev, username: text }));
                                        if (errors.username) {
                                            setErrors(prev => ({ ...prev, username: null }));
                                        }
                                    }}
                                    placeholder="Nhập username"
                                    placeholderTextColor="#666"
                                    autoCapitalize="none"
                                />
                                {errors.username && (
                                    <Text style={styles.errorText}>{errors.username}</Text>
                                )}
                            </View>

                            {/* Bio */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Giới thiệu bản thân</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textInputMultiline]}
                                    value={profile.bio}
                                    onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                                    placeholder="Viết vài dòng về bản thân..."
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={3}
                                    maxLength={200}
                                />
                                <Text style={styles.characterCount}>
                                    {profile.bio.length}/200
                                </Text>
                            </View>

                            {/* Date of Birth */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Ngày sinh</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateText}>
                                        {profile.dateOfBirth.toLocaleDateString('vi-VN')}
                                    </Text>
                                    <Icon name="calendar-today" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>

                            {/* Gender */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Giới tính</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={profile.gender}
                                        onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                                        style={styles.picker}
                                        dropdownIconColor="#999"
                                    >
                                        <Picker.Item label="Chọn giới tính" value="" />
                                        {genders.map(gender => (
                                            <Picker.Item 
                                                key={gender.value}
                                                label={gender.label} 
                                                value={gender.value} 
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Country */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Quốc gia</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={profile.country}
                                        onValueChange={(value) => setProfile(prev => ({ ...prev, country: value }))}
                                        style={styles.picker}
                                        dropdownIconColor="#999"
                                    >
                                        <Picker.Item label="Chọn quốc gia" value="" />
                                        {countries.map(country => (
                                            <Picker.Item 
                                                key={country}
                                                label={country} 
                                                value={country} 
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Phone */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                                <TextInput
                                    style={[styles.textInput, errors.phone && styles.textInputError]}
                                    value={profile.phone}
                                    onChangeText={(text) => {
                                        setProfile(prev => ({ ...prev, phone: text }));
                                        if (errors.phone) {
                                            setErrors(prev => ({ ...prev, phone: null }));
                                        }
                                    }}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                                {errors.phone && (
                                    <Text style={styles.errorText}>{errors.phone}</Text>
                                )}
                            </View>
                        </View>

                        {/* Required Fields Note */}
                        <Text style={styles.requiredNote}>
                            * Các trường bắt buộc
                        </Text>
                    </Animated.View>
                </ScrollView>

                {/* Custom Date Picker Modal */}
                <CustomDatePicker
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onDateSelect={handleDateSelect}
                    initialDate={profile.dateOfBirth}
                />
            </KeyboardAvoidingView>
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
        marginTop: 16,
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    saveButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#E50914',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#E50914',
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    avatarLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHelp: {
        color: '#999',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
    },
    formSection: {
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
        borderWidth: 1,
        borderColor: '#333',
    },
    textInputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    textInputError: {
        borderColor: '#E50914',
    },
    dateInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    dateText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
    },
    pickerContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        backgroundColor: 'transparent',
    },
    characterCount: {
        color: '#666',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        textAlign: 'right',
        marginTop: 4,
    },
    errorText: {
        color: '#E50914',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        marginTop: 4,
    },
    requiredNote: {
        color: '#999',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    
    // Custom Date Picker Styles
    datePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    datePickerContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        margin: 20,
        width: '90%',
        maxWidth: 400,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    datePickerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    datePickerContent: {
        padding: 20,
    },
    datePickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    datePickerLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
        textAlign: 'center',
    },
    pickerWrapper: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        overflow: 'hidden',
    },
    datePicker: {
        color: '#fff',
        backgroundColor: 'transparent',
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    datePickerButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    datePickerConfirm: {
        backgroundColor: '#E50914',
    },
    datePickerButtonText: {
        color: '#999',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    datePickerConfirmText: {
        color: '#fff',
    },
});

export default EditProfileScreen; 