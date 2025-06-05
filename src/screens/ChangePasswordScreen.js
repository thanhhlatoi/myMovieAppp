// 📄 src/screens/ChangePasswordScreen.js - Netflix-Style Change Password Screen
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/Colors';
import { FONTS } from '../constants/Fonts';
import ProfileService from '../services/ProfileService';

const ChangePasswordScreen = ({ navigation }) => {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!passwords.currentPassword) {
            newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!passwords.newPassword) {
            newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (passwords.newPassword.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.newPassword)) {
            newErrors.newPassword = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
        }

        if (!passwords.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (passwords.newPassword !== passwords.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (passwords.currentPassword === passwords.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            await ProfileService.changePassword(passwords.currentPassword, passwords.newPassword);
            
            Alert.alert(
                '🎉 Thành công',
                'Mật khẩu đã được thay đổi thành công!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error changing password:', error);
            
            let errorMessage = 'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
            
            if (error.message.includes('current password')) {
                errorMessage = 'Mật khẩu hiện tại không đúng';
                setErrors({ currentPassword: errorMessage });
            } else if (error.message.includes('same')) {
                errorMessage = 'Mật khẩu mới phải khác mật khẩu hiện tại';
                setErrors({ newPassword: errorMessage });
            }
            
            Alert.alert('❌ Lỗi', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, text: '', color: '#666' };
        
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password)
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        if (score < 2) return { level: 1, text: 'Yếu', color: '#ff4444' };
        if (score < 4) return { level: 2, text: 'Trung bình', color: '#ffaa00' };
        if (score < 5) return { level: 3, text: 'Mạnh', color: '#00bb00' };
        return { level: 4, text: 'Rất mạnh', color: '#00ff00' };
    };

    const passwordStrength = getPasswordStrength(passwords.newPassword);

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
                    
                    <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                    
                    <View style={styles.placeholder} />
                </LinearGradient>

                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[styles.content, { opacity: fadeAnim }]}
                    >
                        {/* Security Notice */}
                        <View style={styles.securityNotice}>
                            <Icon name="security" size={24} color="#E50914" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>Bảo mật tài khoản</Text>
                                <Text style={styles.securityText}>
                                    Vì lý do bảo mật, bạn cần nhập mật khẩu hiện tại để thay đổi
                                </Text>
                            </View>
                        </View>

                        {/* Current Password */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Mật khẩu hiện tại *</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.currentPassword && styles.inputError]}
                                    value={passwords.currentPassword}
                                    onChangeText={(text) => {
                                        setPasswords(prev => ({ ...prev, currentPassword: text }));
                                        if (errors.currentPassword) {
                                            setErrors(prev => ({ ...prev, currentPassword: null }));
                                        }
                                    }}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPasswords.current}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => togglePasswordVisibility('current')}
                                >
                                    <Icon 
                                        name={showPasswords.current ? "visibility" : "visibility-off"} 
                                        size={20} 
                                        color="#999" 
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword && (
                                <Text style={styles.errorText}>{errors.currentPassword}</Text>
                            )}
                        </View>

                        {/* New Password */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Mật khẩu mới *</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                                    value={passwords.newPassword}
                                    onChangeText={(text) => {
                                        setPasswords(prev => ({ ...prev, newPassword: text }));
                                        if (errors.newPassword) {
                                            setErrors(prev => ({ ...prev, newPassword: null }));
                                        }
                                    }}
                                    placeholder="Nhập mật khẩu mới"
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPasswords.new}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => togglePasswordVisibility('new')}
                                >
                                    <Icon 
                                        name={showPasswords.new ? "visibility" : "visibility-off"} 
                                        size={20} 
                                        color="#999" 
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            {/* Password Strength */}
                            {passwords.newPassword.length > 0 && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBar}>
                                        {[1, 2, 3, 4].map(level => (
                                            <View
                                                key={level}
                                                style={[
                                                    styles.strengthSegment,
                                                    {
                                                        backgroundColor: level <= passwordStrength.level 
                                                            ? passwordStrength.color 
                                                            : '#333'
                                                    }
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                                        {passwordStrength.text}
                                    </Text>
                                </View>
                            )}
                            
                            {errors.newPassword && (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Xác nhận mật khẩu mới *</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                                    value={passwords.confirmPassword}
                                    onChangeText={(text) => {
                                        setPasswords(prev => ({ ...prev, confirmPassword: text }));
                                        if (errors.confirmPassword) {
                                            setErrors(prev => ({ ...prev, confirmPassword: null }));
                                        }
                                    }}
                                    placeholder="Nhập lại mật khẩu mới"
                                    placeholderTextColor="#666"
                                    secureTextEntry={!showPasswords.confirm}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => togglePasswordVisibility('confirm')}
                                >
                                    <Icon 
                                        name={showPasswords.confirm ? "visibility" : "visibility-off"} 
                                        size={20} 
                                        color="#999" 
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsContainer}>
                            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
                            <View style={styles.requirement}>
                                <Icon 
                                    name={passwords.newPassword.length >= 6 ? "check" : "close"} 
                                    size={16} 
                                    color={passwords.newPassword.length >= 6 ? "#00bb00" : "#999"} 
                                />
                                <Text style={styles.requirementText}>Ít nhất 6 ký tự</Text>
                            </View>
                            <View style={styles.requirement}>
                                <Icon 
                                    name={/(?=.*[a-z])(?=.*[A-Z])/.test(passwords.newPassword) ? "check" : "close"} 
                                    size={16} 
                                    color={/(?=.*[a-z])(?=.*[A-Z])/.test(passwords.newPassword) ? "#00bb00" : "#999"} 
                                />
                                <Text style={styles.requirementText}>Chữ hoa và chữ thường</Text>
                            </View>
                            <View style={styles.requirement}>
                                <Icon 
                                    name={/\d/.test(passwords.newPassword) ? "check" : "close"} 
                                    size={16} 
                                    color={/\d/.test(passwords.newPassword) ? "#00bb00" : "#999"} 
                                />
                                <Text style={styles.requirementText}>Ít nhất 1 số</Text>
                            </View>
                        </View>

                        {/* Change Password Button */}
                        <TouchableOpacity
                            style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#666', '#444'] : ['#E50914', '#B20710']}
                                style={styles.changeGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <View style={styles.changeContent}>
                                        <Icon name="lock" size={20} color="#fff" />
                                        <Text style={styles.changeText}>Đổi mật khẩu</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Tips */}
                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipsTitle}>💡 Lời khuyên bảo mật:</Text>
                            <Text style={styles.tipsText}>
                                • Sử dụng mật khẩu khác nhau cho các tài khoản{'\n'}
                                • Không chia sẻ mật khẩu với ai{'\n'}
                                • Thay đổi mật khẩu định kỳ{'\n'}
                                • Sử dụng trình quản lý mật khẩu
                            </Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    securityNotice: {
        flexDirection: 'row',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(229, 9, 20, 0.3)',
    },
    securityTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    securityTitle: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 4,
    },
    securityText: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        lineHeight: 20,
    },
    fieldContainer: {
        marginBottom: 24,
    },
    fieldLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.REGULAR,
    },
    eyeButton: {
        padding: 16,
    },
    inputError: {
        borderColor: '#E50914',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    strengthBar: {
        flexDirection: 'row',
        flex: 1,
        height: 4,
        borderRadius: 2,
        marginRight: 12,
    },
    strengthSegment: {
        flex: 1,
        height: '100%',
        marginRight: 2,
        borderRadius: 1,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    requirementsContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    requirementsTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 12,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
        marginLeft: 8,
    },
    changeButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    changeButtonDisabled: {
        opacity: 0.6,
    },
    changeGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    changeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    changeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginLeft: 8,
    },
    tipsContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
    },
    tipsTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
        marginBottom: 8,
    },
    tipsText: {
        color: '#999',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        lineHeight: 18,
    },
    errorText: {
        color: '#E50914',
        fontSize: 12,
        fontFamily: FONTS.REGULAR,
        marginTop: 4,
    },
});

export default ChangePasswordScreen; 