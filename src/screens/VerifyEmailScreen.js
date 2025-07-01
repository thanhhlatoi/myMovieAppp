import React, { useState, useEffect, useRef } from 'react';
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
import AuthService from '../services/AuthService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const VerifyEmailScreen = ({ navigation, route }) => {
  const { email, userData } = route.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Refs for OTP inputs
  const inputRefs = useRef([]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Start countdown timer
    startCountdown();
  }, []);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (value, index) => {
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('❌ Mã không hợp lệ', 'Vui lòng nhập đầy đủ 6 số');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verifying OTP code...');

      const verificationData = {
        email: email,
        otp: otpCode  // This will be transformed to 'code' in AuthService
      };

      const data = await AuthService.verifyEmail(verificationData);
      console.log('✅ Email verification successful:', data);

      Alert.alert(
        '🎉 Xác thực thành công!',
        `Chào mừng bạn đến với MovieApp!\n\n✅ Email ${email} đã được xác thực.\n\n🎬 Bây giờ bạn có thể đăng nhập để khám phá thế giới điện ảnh!`,
        [
          {
            text: '🔐 Đăng nhập ngay',
            onPress: () => navigation.navigate('login'),
            style: 'default'
          }
        ]
      );

    } catch (error) {
      console.error('🔥 OTP verification error:', error);

      let errorTitle = '🚨 Xác thực thất bại';
      let errorMessage = 'Có lỗi xảy ra khi xác thực mã OTP';

      if (error?.message) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          errorTitle = '⏰ Mã không hợp lệ';
          errorMessage = 'Mã OTP không đúng hoặc đã hết hạn.\nVui lòng kiểm tra lại hoặc yêu cầu mã mới.';
        } else if (error.message.includes('Mã xác minh không được để trống') || error.message.includes('400')) {
          errorTitle = '❌ Dữ liệu không hợp lệ';
          errorMessage = 'Mã xác thực không đúng định dạng.\nVui lòng nhập đầy đủ 6 số và thử lại.';
        } else if (error.message.includes('Network request failed')) {
          errorTitle = '🌐 Lỗi mạng';
          errorMessage = 'Không thể kết nối internet.\nVui lòng kiểm tra kết nối và thử lại.';
        } else if (error.message.includes('429')) {
          errorTitle = '⏱️ Quá nhiều yêu cầu';
          errorMessage = 'Bạn đã thử quá nhiều lần.\nVui lòng đợi ít phút rồi thử lại.';
        } else if (error.message.includes('500')) {
          errorTitle = '⚙️ Lỗi server';
          errorMessage = 'Server đang gặp sự cố.\nVui lòng thử lại sau ít phút.';
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

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);

    try {
      console.log('📧 Resending OTP...');

      await AuthService.resendOtp({ email });
      
      Alert.alert(
        '📧 Đã gửi lại mã',
        `Mã xác thực mới đã được gửi đến ${email}\n\n⏰ Vui lòng kiểm tra hộp thư và thư mục spam.`,
        [{ text: 'Đã hiểu', style: 'default' }]
      );

      // Clear current OTP and restart countdown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      startCountdown();

    } catch (error) {
      console.error('🔥 Resend OTP error:', error);
      Alert.alert(
        '❌ Không thể gửi lại',
        'Có lỗi xảy ra khi gửi lại mã xác thực.\nVui lòng thử lại sau.',
        [{ text: 'Đã hiểu', style: 'default' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    Alert.alert(
      '🔙 Quay lại đăng nhập?',
      'Bạn sẽ cần đăng ký lại để nhận mã xác thực mới.\n\nBạn có chắc muốn quay lại?',
      [
        { text: 'Ở lại', style: 'cancel' },
        { 
          text: 'Quay lại', 
          style: 'destructive',
          onPress: () => navigation.navigate('login')
        }
      ]
    );
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

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>📧</Text>
            <Text style={styles.appName}>MovieApp</Text>
            <Text style={styles.tagline}>Xác thực email</Text>
          </View>

          {/* Main Content */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Nhập mã xác thực</Text>
            
            <Text style={styles.description}>
              Mã xác thực 6 số đã được gửi đến:{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => inputRefs.current[index] = ref}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(digit, index);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!isLoading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.loadingButtonText}>Đang xác thực...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>🔐 Xác thực</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Không nhận được mã?</Text>
              
              {canResend ? (
                <TouchableOpacity 
                  onPress={handleResendOtp}
                  disabled={isResending}
                  style={styles.resendButton}
                >
                  {isResending ? (
                    <View style={styles.resendingContent}>
                      <ActivityIndicator size="small" color="#E50914" />
                      <Text style={styles.resendingText}>Đang gửi...</Text>
                    </View>
                  ) : (
                    <Text style={styles.resendLink}>📧 Gửi lại mã</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.countdownText}>
                  Gửi lại sau {countdown}s
                </Text>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.footerLink}>🔙 Quay lại đăng nhập</Text>
              </TouchableOpacity>
            </View>

          
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
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#E50914',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#E50914',
    backgroundColor: '#fff',
  },
  verifyButton: {
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
  resendContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 5,
  },
  resendLink: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendingText: {
    color: '#E50914',
    fontSize: 14,
    marginLeft: 8,
  },
  countdownText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
  },
  footerLink: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
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

export default VerifyEmailScreen; 