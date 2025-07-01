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
} from 'react-native';
import { jwtDecode } from 'jwt-decode';
import AuthService from '../services/AuthService';
import { useUser } from '../contexts/UserContext';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login, isAuthenticated, isLoading: contextLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    checkExistingToken();
    testServerConnection();
  }, []);

  // Check if user is already authenticated via UserContext
  useEffect(() => {
    if (isAuthenticated && !contextLoading) {
      console.log('User already authenticated, navigating to home');
      navigation.navigate('home');
    }
  }, [isAuthenticated, contextLoading]);

  const checkExistingToken = async () => {
    try {
      const token = await AuthService.getToken();

      if (token && AuthService.isTokenValid(token)) {
        const decoded = jwtDecode(token);
        const scope = decoded?.scope;

        if (scope && scope.includes('ROLE_USERS')) {
          console.log('Auto-login successful');
          navigation.navigate('home');
          return;
        } else {
          await AuthService.removeToken();
        }
      }
    } catch (error) {
      console.error('Token check error:', error);
      await AuthService.removeToken();
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const testServerConnection = async () => {
    try {
      const result = await AuthService.testConnection();
      if (!result) {
        Alert.alert(
            '🔌 Lỗi kết nối',
            'Không thể kết nối đến server phim.\n\n• Kiểm tra kết nối internet\n• Server có thể đang bảo trì\n• Thử lại sau vài phút',
            [{ text: 'Đã hiểu', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('📧 Thiếu email', 'Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    if (!password.trim()) {
      Alert.alert('🔒 Thiếu mật khẩu', 'Vui lòng nhập mật khẩu của bạn');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('📧 Email không hợp lệ', 'Vui lòng nhập đúng định dạng email');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🎬 Starting movie app login...');

      const data = await AuthService.login(email.trim(), password);
      console.log('✅ Login response received:', data);

      const token = data?.token;
      const refreshToken = data?.refreshToken;
      const user = data?.user;

      if (!token) {
        const availableFields = Object.keys(data || {});
        Alert.alert(
            '🚫 Lỗi đăng nhập',
            `Server không trả về thông tin xác thực.\n\nDữ liệu: ${availableFields.join(', ')}\n\n💡 Vui lòng liên hệ hỗ trợ`
        );
        return;
      }

      if (!AuthService.isTokenValid(token)) {
        Alert.alert('⏰ Token hết hạn', 'Phiên đăng nhập không hợp lệ, vui lòng thử lại');
        return;
      }

      const decoded = jwtDecode(token);
      const scope = decoded?.scope;

      console.log('🎭 User authenticated:', decoded);

      if (scope && scope.includes('ROLE_USERS')) {
        // Use UserContext login method instead of direct AuthService
        const loginSuccess = await login({
          token: token,
          refreshToken: refreshToken,
          user: user
        });

        if (loginSuccess) {
          Alert.alert(
              '🎉 Chào mừng trở lại!',
              `Xin chào ${user?.fullName || decoded?.name || 'Cinephile'}!\n\n🎬 Sẵn sàng khám phá thế giới điện ảnh?\n\n⏰ Phiên làm việc hết hạn: ${new Date(decoded.exp * 1000).toLocaleString('vi-VN')}`,
              [
                {
                  text: '🍿 Bắt đầu xem phim',
                  onPress: () => navigation.navigate('home'),
                  style: 'default'
                }
              ]
          );
        } else {
          Alert.alert('❌ Lỗi', 'Không thể đăng nhập vào hệ thống');
        }
      } else {
        Alert.alert(
            '🚫 Quyền truy cập bị từ chối',
            `Tài khoản của bạn chưa được cấp quyền xem phim.\n\n🔑 Quyền hiện tại: ${scope || 'Không có'}\n✅ Cần quyền: ROLE_USERS\n\n📞 Liên hệ admin để được hỗ trợ`,
            [{ text: 'Đã hiểu', style: 'cancel' }]
        );
      }

    } catch (error) {
      console.error('🔥 Login error:', error);

      let errorTitle = '🚨 Đăng nhập thất bại';
      let errorMessage = 'Có lỗi xảy ra khi đăng nhập vào MovieApp';

      if (error?.message) {
        if (error.message.includes('Network request failed')) {
          errorTitle = '🌐 Lỗi mạng';
          errorMessage = 'Không thể kết nối internet.\nVui lòng kiểm tra kết nối và thử lại.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorTitle = '🔐 Sai thông tin';
          errorMessage = 'Email hoặc mật khẩu không đúng.\nVui lòng kiểm tra lại thông tin đăng nhập.';
        } else if (error.message.includes('404')) {
          errorTitle = '🔍 Không tìm thấy';
          errorMessage = 'Server MovieApp không phản hồi.\nVui lòng thử lại sau.';
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

  const handleForgotPassword = () => {
    Alert.alert(
        '🔑 Quên mật khẩu?',
        'Tính năng khôi phục mật khẩu sẽ có trong phiên bản tiếp theo.\n\n📧 Tạm thời liên hệ admin qua email để được hỗ trợ.',
        [{ text: 'Đã hiểu', style: 'default' }]
    );
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  if (isCheckingAuth) {
    return (
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingTitle}>🎬 MovieApp</Text>
            <Text style={styles.loadingText}>Đang kiểm tra đăng nhập...</Text>
          </View>
        </View>
    );
  }

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

          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Logo và tiêu đề */}
            <View style={styles.header}>
              <Text style={styles.logo}>🎬</Text>
              <Text style={styles.appName}>MovieApp</Text>
              <Text style={styles.tagline}>Khám phá thế giới điện ảnh</Text>
            </View>

            {/* Form đăng nhập */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Đăng nhập</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    placeholder="Email của bạn"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    editable={!isLoading}
                    autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                    placeholder="Mật khẩu"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
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

              {/* Login Button */}
              <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
              >
                {isLoading ? (
                    <View style={styles.loadingButtonContent}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.loadingButtonText}>Đang đăng nhập...</Text>
                    </View>
                ) : (
                    <Text style={styles.buttonText}>🎬 Đăng nhập</Text>
                )}
              </TouchableOpacity>

              {/* Footer Links */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.footerLink}>🔑 Quên mật khẩu?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister}>
                  <Text style={styles.footerLink}>📝 Tạo tài khoản mới</Text>
                </TouchableOpacity>
              </View>

              {/* Debug info chỉ hiển thị khi development */}
             
            </View>
          </Animated.View>
        </ImageBackground>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 28,
    color: '#E50914',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
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
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  loginButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
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
  footerLink: {
    color: '#E50914',
    fontSize: 16,
    marginVertical: 8,
    textDecorationLine: 'underline',
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

export default LoginScreen;
