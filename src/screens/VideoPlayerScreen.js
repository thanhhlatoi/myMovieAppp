import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-video'; // Thay thế expo-av bằng expo-video

export default function VideoPlayerScreen() {
  return (
    <View style={styles.container}>
      <Video
        source={{
          uri: 'http://192.168.0.125:8082/api/videos/hls-stream?bucketName=thanh&path=cc/output.m3u8', // Đường dẫn video HLS
        }}
        style={styles.video}
        useNativeControls // Hiển thị các điều khiển gốc
        resizeMode="contain" // Điều chỉnh tỷ lệ khung hình
        isLooping // Lặp lại video
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 200,
  },
});
