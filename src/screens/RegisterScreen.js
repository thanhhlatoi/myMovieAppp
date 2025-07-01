import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import AuthService from '../services/AuthService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Email không hợp lệ';
      }
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('❌ Thông tin không hợp lệ', 'Vui lòng kiểm tra lại thông tin đăng ký');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🎬 Starting movie app registration...');

      const registrationData = {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
      };

            const data = await AuthService.register(registrationData);
      console.log('✅ Registration response received:', data);

      // Show success message and navigate to verification
      Alert.alert(
        '📧 Kiểm tra email của bạn',
        `Đăng ký thành công!\n\n📨 Mã xác thực đã được gửi đến:\n${formData.email.trim()}\n\n⏰ Vui lòng kiểm tra hộp thư (kể cả thư mục spam) và nhập mã để hoàn tất đăng ký.`,
        [
          {
            text: '✅ Xác thực ngay',
            onPress: () => navigation.navigate('VerifyEmail', {
              email: formData.email.trim(),
              userData: registrationData
            }),
            style: 'default'
          }
        ]
      );

    } catch (error) {
      console.error('🔥 Registration error:', error);

      let errorTitle = '🚨 Đăng ký thất bại';
      let errorMessage = 'Có lỗi xảy ra khi tạo tài khoản';

      if (error?.message) {
        if (error.message.includes('Network request failed')) {
          errorTitle = '🌐 Lỗi mạng';
          errorMessage = 'Không thể kết nối internet.\nVui lòng kiểm tra kết nối và thử lại.';
        } else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorTitle = '📧 Email đã tồn tại';
          errorMessage = 'Email này đã được sử dụng.\nVui lòng sử dụng email khác hoặc đăng nhập.';
        } else if (error.message.includes('400')) {
          errorTitle = '📝 Thông tin không hợp lệ';
          errorMessage = 'Dữ liệu đăng ký không đúng định dạng.\nVui lòng kiểm tra lại thông tin.';
        } else if (error.message.includes('500')) {
          errorTitle = '⚙️ Lỗi server';
          errorMessage = 'Server MovieApp đang gặp sự cố.\nVui lòng thử lại sau ít phút.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'Thử lại', style: 'default' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background với gradient overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Logo và tiêu đề */}
            <View style={styles.header}>
              <Text style={styles.logo}>🎬</Text>
              <Text style={styles.appName}>MovieApp</Text>
              <Text style={styles.tagline}>Tạo tài khoản mới</Text>
            </View>

            {/* Form đăng ký */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Đăng ký tài khoản</Text>

              {/* Full Name Input */}
              <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Họ và tên"
                  placeholderTextColor="#999"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData('fullName', value)}
                  autoCapitalize="words"
                  style={styles.input}
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

              {/* Email Input */}
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email của bạn"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  editable={!isLoading}
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              {/* Password Input */}
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                  editable={!isLoading}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Confirm Password Input */}
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, styles.passwordInput]}
                  editable={!isLoading}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.loadingButtonText}>Đang tạo tài khoản...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>🎬 Tạo tài khoản</Text>
                )}
              </TouchableOpacity>

              {/* Footer Links */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản?</Text>
                <TouchableOpacity onPress={handleLoginNavigation}>
                  <Text style={styles.footerLink}>🔐 Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>

              {/* Terms and conditions */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  Bằng việc đăng ký, bạn đồng ý với{' '}
                  <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                  {' '}và{' '}
                  <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                  {' '}của MovieApp
                </Text>
              </View>

              
            </View>
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  content: {
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#E50914',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  errorText: {
    color: '#E50914',
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
  },
  footerLink: {
    color: '#E50914',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  termsContainer: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#E50914',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default RegisterScreen; 