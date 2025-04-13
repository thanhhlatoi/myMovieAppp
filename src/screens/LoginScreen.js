import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity
} from 'react-native';
import AuthService from '../services/AuthService'; // Đảm bảo file này tồn tại và export đúng

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const data = await AuthService.login(email, password);

      if (data?.user?.roles?.[0]?.name === 'USERS') {
        Alert.alert('Đăng nhập thành công');
        console.log('Token:', data.token);

        // CHUYỂN MÀN HÌNH HOME
        navigation.navigate('home'); 
      } else {
        Alert.alert('Bạn không có quyền đăng nhập');
      }
    } catch (error) {
      Alert.alert('Lỗi', error?.message || 'Đã có lỗi xảy ra');
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Đăng nhập</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu')}>
            <Text style={styles.footerText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Đăng ký')}>
            <Text style={styles.footerText}>Chưa có tài khoản? Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', // Màu nền xanh nhạt
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay tối để tăng độ rõ nét của văn bản
    padding: 30,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    color: '#ffffff', // Màu chữ trắng
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#ffffff', // Màu nền trắng cho input
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4CAF50', // Màu xanh lá cây cho nút đăng nhập
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff', // Màu chữ trắng cho nút
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#42A5F5', // Màu xanh dương cho văn bản footer
    fontSize: 14,
    marginVertical: 5,
  },
});

export default LoginScreen;
