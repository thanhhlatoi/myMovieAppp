import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  StatusBar,
  Animated
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPlayerScreen({ route, navigation }) {
  const videoId = route?.params?.videoId || 2;
  const movieData = route?.params?.movie || route?.params?.movieData;
  const movieTitle = route?.params?.movieTitle || movieData?.title || `Video ${videoId}`;

  // ✨ ENHANCED: Add validation for video existence
  useEffect(() => {
    const validateVideoExists = async () => {
      try {
        console.log('🔍 Validating video existence for ID:', videoId);
        
        // Check if video exists in database
        const response = await fetch(`http://192.168.100.193:8082/api/videos/${videoId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`❌ Video ID ${videoId} not found in database`);
          setError(`Video không tồn tại (ID: ${videoId})`);
          return;
        }

        const videoData = await response.json();
        console.log('✅ Video validation successful:', videoData.data?.id);

        // Check if video has movieProduct
        if (!videoData.data?.movieProduct) {
          console.warn(`⚠️ Video ID ${videoId} has no associated movieProduct`);
          // Still allow playback but show warning
        }

      } catch (error) {
        console.error('❌ Error validating video:', error);
        setError(`Lỗi khi kiểm tra video: ${error.message}`);
      }
    };

    validateVideoExists();
  }, [videoId]);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [masterPlaylist, setMasterPlaylist] = useState(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Advanced Netflix-style features
  const [volume, setVolume] = useState(1.0);
  const [brightness, setBrightness] = useState(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);

  // Gesture states
  const [lastTap, setLastTap] = useState(null);
  const [isDoubleTap, setIsDoubleTap] = useState(false);

  // Animation states for Netflix-style UI
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [controlsVisible, setControlsVisible] = useState(true);

  // Speed options like Netflix
  const speedOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: 'Bình thường', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2.0 },
  ];

  // Debug logs
  useEffect(() => {
    console.log("🎬 VideoPlayerScreen started with:");
    console.log("📹 Video ID:", videoId);
    console.log("🎭 Movie Title:", movieTitle);
    console.log("📦 Movie Data:", movieData ? "Available" : "Not available");
    if (movieData) {
      console.log("🎦 Movie Details:", {
        id: movieData.id,
        title: movieData.title,
        description: movieData.description?.substring(0, 100) + "..."
      });
    }
  }, []);

  // Refs
  const seekTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const bufferCheckRef = useRef(null);
  const hideControlsTimeout = useRef(null);

  // Server configuration
  const serverConfig = {
    baseURL: 'http://192.168.100.193:8082/api/videofilm',
    masterEndpoint: `/stream/mobile/${videoId}`,
  };

  // Detect if running on virtual machine or low-performance device
  const isLowPerformanceDevice = () => {
    // TODO: Add more sophisticated detection
    // - Check available memory
    // - Detect VM environment variables
    // - Performance benchmarking

    // For now, assume VM/low performance for safety
    // You can set this to false for testing on physical devices
    return true; // Change to false for physical device testing
  };

  // Initialize video player with enhanced error handling
  const player = useVideoPlayer(currentStreamUrl, (player) => {
    // ✨ ENHANCED: Better type and null checks
    console.log('🎬 VideoPlayer initialization callback triggered');
    console.log('🔍 Player object type:', typeof player);
    console.log('🔍 Player object value:', player);
    
    if (!player) {
      console.warn('⚠️ Player object is null during initialization');
      return;
    }
    
    // Ensure we have a valid player object, not an integer or other type
    if (typeof player !== 'object' || player === null || Number.isInteger(player)) {
      console.error('❌ Invalid player object type during initialization:', typeof player, player);
      return;
    }
    
    try {
      // Additional safety checks for player methods and properties
      if (typeof player.pause !== 'function') {
        console.error('❌ Player object missing required methods');
        return;
      }
      
      console.log('🎬 Setting up valid VideoPlayer object...');
      
      // Basic player configuration
      if ('loop' in player) player.loop = false;
      if ('muted' in player) player.muted = false;

      // Virtual machine optimizations
      if (isLowPerformanceDevice()) {
        console.log('🖥️ Applying VM optimizations...');
        
        // Reduce buffer sizes for VM
        if ('allowsExternalPlayback' in player) {
          player.allowsExternalPlayback = false;
        }
        if ('preventsDisplaySleepDuringVideoPlayback' in player) {
          player.preventsDisplaySleepDuringVideoPlayback = false; // Save resources
        }

        // Set lower quality defaults if supported
        try {
          if ('preferredPeakBitRate' in player && player.preferredPeakBitRate !== undefined) {
            player.preferredPeakBitRate = 500000; // 500kbps max for VM
          }
          if ('preferredMaximumResolution' in player && player.preferredMaximumResolution !== undefined) {
            player.preferredMaximumResolution = { width: 640, height: 360 }; // Max 360p
          }
        } catch (optimizationError) {
          console.warn('⚠️ Could not apply some VM optimizations:', optimizationError);
        }
      } else {
        console.log('📱 Applying standard device optimizations...');
        
        if ('allowsExternalPlayback' in player) {
          player.allowsExternalPlayback = false;
        }
        if ('preventsDisplaySleepDuringVideoPlayback' in player) {
          player.preventsDisplaySleepDuringVideoPlayback = true;
        }
      }
      
      console.log('✅ VideoPlayer initialized successfully with type:', typeof player);
    } catch (error) {
      console.error('❌ Error during VideoPlayer configuration:', error);
    }
  });

  // Initialize player on component mount
  useEffect(() => {
    console.log('🚀 VideoPlayerScreen component mounted');
    initializePlayer();
    
    return () => {
      console.log('🧹 VideoPlayerScreen component unmounting...');
    };
  }, []);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkInfo(state);
      console.log('📶 Network changed:', state.type, state.isConnected);

      // Auto adjust quality based on network
      if (state.isConnected && qualityOptions.length > 0) {
        autoSelectQuality(state);
      }
    });

    return () => unsubscribe();
  }, [qualityOptions]);

  // Auto select quality based on network
  const autoSelectQuality = (networkState) => {
    if (!networkState || !qualityOptions.length) return;

    let recommendedQuality = qualityOptions[0]; // Auto by default

    // Virtual machine optimization - force lower quality
    if (isLowPerformanceDevice()) {
      // For VM: always select lowest quality available (240p or 360p max)
      const vmQuality = qualityOptions.find(q =>
          q.label.includes('240p') || q.label.includes('360p')
      ) || qualityOptions.find(q =>
          q.label !== 'Auto (Adaptive)' && q.bandwidth < 800000 // Under 800kbps
      );

      if (vmQuality) {
        recommendedQuality = vmQuality;
        console.log('🖥️ VM mode: Selected low quality:', recommendedQuality.label);
      }
      return;
    }

    // Network-based quality selection (original logic for physical devices)
    if (networkState.type === 'wifi') {
      // WiFi: chọn 720p hoặc cao hơn
      const wifiQuality = qualityOptions.find(q =>
          q.label.includes('720p') || q.label.includes('1080p')
      );
      if (wifiQuality) recommendedQuality = wifiQuality;
    } else if (networkState.type === 'cellular') {
      // Mobile data: chọn quality thấp hơn
      const details = networkState.details;
      if (details?.cellularGeneration === '3g') {
        // 3G: 360p max
        const quality3g = qualityOptions.find(q => q.label.includes('360p'));
        if (quality3g) recommendedQuality = quality3g;
      } else if (details?.cellularGeneration === '4g') {
        // 4G: 480p recommended
        const quality4g = qualityOptions.find(q => q.label.includes('480p'));
        if (quality4g) recommendedQuality = quality4g;
      }
    }

    // Chỉ thay đổi nếu khác với quality hiện tại
    if (selectedQuality?.id !== recommendedQuality.id) {
      console.log('🎯 Auto-selecting quality based on network:', recommendedQuality.label);
      selectQuality(recommendedQuality, false); // false = không reset position
    }
  };

  // Parse M3U8 master playlist với mobile optimization
  const parseMasterPlaylist = (m3u8Content) => {
    const lines = m3u8Content.split('\n');
    const qualities = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        const frameRateMatch = line.match(/FRAME-RATE=([\d.]+)/);

        const nextLine = lines[i + 1]?.trim();

        if (nextLine && !nextLine.startsWith('#')) {
          const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
          const resolution = resolutionMatch ? resolutionMatch[1] : 'Unknown';
          const frameRate = frameRateMatch ? parseFloat(frameRateMatch[1]) : 30;

          // Determine quality label
          let qualityLabel = 'Auto';
          const [width, height] = resolution.split('x').map(Number);

          if (height >= 1080) qualityLabel = '1080p';
          else if (height >= 720) qualityLabel = '720p';
          else if (height >= 480) qualityLabel = '480p';
          else if (height >= 360) qualityLabel = '360p';
          else if (height >= 240) qualityLabel = '240p';
          else qualityLabel = `${height}p`;

          // Build full URL
          const streamUrl = nextLine.startsWith('http')
              ? nextLine
              : `${serverConfig.baseURL}/${nextLine}`;

          qualities.push({
            id: qualities.length,
            label: qualityLabel,
            resolution,
            bandwidth,
            url: streamUrl,
            bitrate: Math.round(bandwidth / 1000) + ' kbps',
            frameRate: frameRate,
            // Mobile optimization score (lower is better for mobile)
            mobileScore: calculateMobileScore(bandwidth, height, frameRate)
          });
        }
      }
    }

    // Sort by mobile optimization score for mobile
    qualities.sort((a, b) => a.mobileScore - b.mobileScore);

    // Add auto option
    qualities.unshift({
      id: -1,
      label: 'Auto (Adaptive)',
      resolution: 'Adaptive',
      bandwidth: 0,
      url: `${serverConfig.baseURL}${serverConfig.masterEndpoint}`,
      bitrate: 'Adaptive',
      frameRate: 'Variable',
      mobileScore: 0
    });

    return qualities;
  };

  // Calculate mobile optimization score
  const calculateMobileScore = (bandwidth, height, frameRate) => {
    let score = 0;

    // Bandwidth penalty (higher bandwidth = higher score)
    score += bandwidth / 100000; // Convert to manageable number

    // Resolution penalty (higher resolution = higher score for mobile)
    if (height > 720) score += 50;
    else if (height > 480) score += 20;
    else if (height > 360) score += 10;

    // Frame rate penalty (higher fps = more processing power)
    if (frameRate > 30) score += 15;

    return score;
  };

  // Enhanced player initialization
  const initializePlayer = async () => {
    try {
      setLoading(true);
      setError(null);

      const masterUrl = `${serverConfig.baseURL}${serverConfig.masterEndpoint}`;
      console.log('🎬 Loading master playlist:', masterUrl);

      // Add timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(masterUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
          'User-Agent': 'VideoPlayer/1.0 (Mobile)',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const m3u8Content = await response.text();
      console.log('📋 Master playlist loaded, parsing...');

      // Parse qualities
      const qualities = parseMasterPlaylist(m3u8Content);
      console.log('🎯 Available qualities:', qualities);

      setQualityOptions(qualities);
      setMasterPlaylist(m3u8Content);

      // Set default quality for mobile (480p or lower if available)
      let defaultQuality = qualities[0]; // Auto fallback

      // Try to find mobile-friendly quality
      const mobileQuality = qualities.find(q =>
          q.label.includes('480p') || q.label.includes('360p')
      );

      if (mobileQuality) {
        defaultQuality = mobileQuality;
        console.log('📱 Selected mobile-optimized quality:', defaultQuality.label);
      }

      // Virtual machine specific optimization
      if (isLowPerformanceDevice()) {
        // For VM: prioritize 240p or 360p for smooth playback
        const vmQuality = qualities.find(q =>
            q.label.includes('240p')
        ) || qualities.find(q =>
            q.label.includes('360p')
        ) || qualities.find(q =>
            q.label !== 'Auto (Adaptive)' && q.bandwidth < 600000
        );

        if (vmQuality) {
          defaultQuality = vmQuality;
          console.log('🖥️ VM optimization: Selected low-performance quality:', defaultQuality.label);
        }
      }

      setSelectedQuality(defaultQuality);
      setCurrentStreamUrl(defaultQuality.url);

    } catch (err) {
      console.error('❌ Error:', err);

      if (err.name === 'AbortError') {
        setError('Lỗi: Kết nối quá chậm, vui lòng thử lại');
      } else if (err.message.includes('network')) {
        setError('Lỗi mạng: Kiểm tra kết nối internet của bạn');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePlayer();
  }, [videoId]);

  // Enhanced video player event listeners
  useEffect(() => {
    // ✨ ENHANCED: Better null checks and validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player object not available for event listeners');
      return;
    }

    // Check if player has been released
    if (player._isReleased === true) {
      console.warn('⚠️ Player object has been released, skipping event listeners');
      return;
    }

    // ✨ FIXED: Enhanced null checks before adding listeners
    let statusListener, timeUpdateListener, playbackEndListener, volumeChangeListener;

    try {
      // Reduce update frequency for VM
      let lastTimeUpdate = 0;
      const timeUpdateThrottle = isLowPerformanceDevice() ? 1000 : 500; // 1s for VM, 0.5s for normal

      statusListener = player.addListener('statusChange', (status, oldStatus, error) => {
        // Check if player is still valid in callback
        if (!player || player._isReleased) {
          console.warn('⚠️ Player released during statusChange callback');
          return;
        }
        
      console.log('Status changed:', oldStatus, '->', status);

      if (status === 'error' && error) {
        console.error('❌ Video error:', error);
        handleVideoError(error);
      }

      if (status === 'loaded') {
        console.log('✅ Video loaded successfully');
        setLoading(false);
        setError(null);
          // Safe access to player.duration
          try {
            if (player && player.duration !== undefined) {
        setDuration(player.duration);
            }
          } catch (e) {
            console.warn('⚠️ Could not access player.duration:', e);
          }
        setIsBuffering(false);
      }

      if (status === 'loading') {
        console.log('📡 Video loading...');
        setIsBuffering(true);
      }

      if (status === 'readyToPlay') {
        console.log('🎬 Ready to play');
        setIsBuffering(false);
      }
    });

      timeUpdateListener = player.addListener('timeUpdate', (payload) => {
        // Check if player is still valid in callback
        if (!player || player._isReleased) {
          console.warn('⚠️ Player released during timeUpdate callback');
          return;
        }
        
        // Throttle time updates for VM performance
        const now = Date.now();
        if (now - lastTimeUpdate < timeUpdateThrottle) {
          return;
        }
        lastTimeUpdate = now;

        if (payload && payload.currentTime !== undefined) {
      setCurrentTime(payload.currentTime);

          // Simplified buffer health calculation for VM
          try {
            if (player && player.duration && payload.currentTime) {
              if (isLowPerformanceDevice()) {
                // Simpler calculation for VM
                const bufferRatio = Math.min(95, (payload.currentTime / player.duration) * 100);
                setBufferHealth(bufferRatio);
              } else {
        const bufferRatio = (payload.currentTime / player.duration) * 100;
        setBufferHealth(bufferRatio);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not calculate buffer health:', e);
          }
        }
      });

      playbackEndListener = player.addListener('playbackEnd', () => {
        // Check if player is still valid in callback
        if (!player || player._isReleased) {
          console.warn('⚠️ Player released during playbackEnd callback');
          return;
        }
        
      console.log('📹 Video ended');
      setShowControls(true);
    });

      // Simplified listeners for VM
      if (!isLowPerformanceDevice()) {
        volumeChangeListener = player.addListener('volumeChange', () => {
          // Check if player is still valid in callback
          if (!player || player._isReleased) {
            console.warn('⚠️ Player released during volumeChange callback');
            return;
          }
          
      console.log('🔊 Volume changed');
    });
      }

    } catch (error) {
      console.error('❌ Error setting up video player listeners:', error);
    }

    return () => {
      try {
        // Safe cleanup of listeners
        if (statusListener && typeof statusListener.remove === 'function') {
          statusListener.remove();
        }
        if (timeUpdateListener && typeof timeUpdateListener.remove === 'function') {
          timeUpdateListener.remove();
        }
        if (playbackEndListener && typeof playbackEndListener.remove === 'function') {
          playbackEndListener.remove();
        }
        if (volumeChangeListener && typeof volumeChangeListener.remove === 'function') {
          volumeChangeListener.remove();
        }
        console.log('✅ Video player listeners cleaned up successfully');
      } catch (error) {
        console.error('❌ Error removing video player listeners:', error);
      }
    };
  }, [player]);

  // Enhanced error handling
  const handleVideoError = (error) => {
    let errorMessage = 'Lỗi phát video không xác định';
    let shouldRetry = false;

    if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = 'Lỗi mạng: Kết nối không ổn định';
      shouldRetry = true;
    } else if (error.message.includes('format') || error.message.includes('codec')) {
      errorMessage = 'Lỗi: Định dạng video không được hỗ trợ trên thiết bị này';
    } else if (error.message.includes('404')) {
      errorMessage = 'Lỗi: Không tìm thấy video trên server';
    } else {
      errorMessage = `Lỗi video: ${error.message}`;
      shouldRetry = true;
    }

    setError(errorMessage);
    setLoading(false);

    // Auto retry for network errors
    if (shouldRetry) {
      console.log('🔄 Auto-retry in 3 seconds...');
      retryTimeoutRef.current = setTimeout(() => {
        initializePlayer();
      }, 3000);
    }
  };

  // Optimized quality selection
  const selectQuality = (quality, resetPosition = true) => {
    console.log('🎯 Selecting quality:', quality);

    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    const currentPosition = resetPosition ? 0 : currentTime;
    const wasPlaying = player?.playing || false;

    setSelectedQuality(quality);
    setCurrentStreamUrl(quality.url);
    setShowQualityModal(false);
    setIsBuffering(true);

    // Pause before switching
    if (player && wasPlaying) {
      player.pause();
    }

    // VM optimization: reduced delay and simpler logic
    if (!resetPosition && currentPosition > 0) {
      const seekDelay = isLowPerformanceDevice() ? 1000 : 2000; // Faster for VM

      seekTimeoutRef.current = setTimeout(() => {
        if (player) {
          console.log('🔄 Restoring position:', currentPosition);

          if (isLowPerformanceDevice()) {
            // Simpler seek for VM
            player.currentTime = currentPosition;
          } else {
          player.seekBy(currentPosition - (player.currentTime || 0));
          }

          // Resume playback if was playing
          if (wasPlaying) {
            const resumeDelay = isLowPerformanceDevice() ? 200 : 500;
            setTimeout(() => {
              player.play();
            }, resumeDelay);
          }
        }
      }, seekDelay);
    }
  };

  // Smooth seek function với enhanced error handling
  const smoothSeek = (targetTime) => {
    // ✨ ENHANCED: Better validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for smooth seek');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot smooth seek');
      return;
    }
    
    if (!duration || typeof targetTime !== 'number') {
      console.warn('⚠️ Invalid parameters for smooth seek');
      return;
    }

    // Clear any pending seeks
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    const clampedTime = Math.max(0, Math.min(targetTime, duration));

    console.log('🎯 Smooth seeking to:', clampedTime);

    setIsBuffering(true);

    try {
      // VM optimization: use direct time setting instead of seekBy
      if (isLowPerformanceDevice()) {
        // For VM: direct time assignment (more reliable)
        if (player.currentTime !== undefined) {
          player.currentTime = clampedTime;
        } else {
          console.warn('⚠️ Player.currentTime not available, using seekBy');
          player.seekBy(clampedTime - (player.currentTime || 0));
        }
      } else {
        // For physical devices: use seekBy for smoother experience
        const currentTimeValue = player.currentTime || 0;
        const seekDelta = clampedTime - currentTimeValue;
        
        if (Math.abs(seekDelta) > 0.1) { // Only seek if difference > 0.1s
          player.seekBy(seekDelta);
        }
      }

      // Set buffering state with timeout fallback
      const bufferTimeout = isLowPerformanceDevice() ? 2000 : 1000;
    seekTimeoutRef.current = setTimeout(() => {
      setIsBuffering(false);
      }, bufferTimeout);

    } catch (error) {
      console.error('❌ Error during smooth seek:', error);
      setIsBuffering(false);
    }
  };

  // Netflix-style control functions
  const toggleControls = () => {
    if (controlsVisible) {
      // Hide controls with fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setControlsVisible(false);
        setShowControls(false);
      });
    } else {
      // Show controls with fade in
      setControlsVisible(true);
      setShowControls(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide controls after 4 seconds (Netflix style)
      resetHideControlsTimer();
    }
  };

  const resetHideControlsTimer = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    hideControlsTimeout.current = setTimeout(() => {
      if (player?.playing && !isBuffering && !isLocked) {
        toggleControls();
      }
    }, 4000); // Netflix typically hides after 4 seconds
  };

  const togglePlayPause = () => {
    // ✨ ENHANCED: Better null checks and validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for play/pause');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot toggle play/pause');
      return;
    }
    
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      resetHideControlsTimer();
    } catch (error) {
      console.error('❌ Error toggling play/pause:', error);
    }
  };

  const seekTo = (timeInSeconds) => {
    // ✨ ENHANCED: Better validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for seek');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot seek');
      return;
    }
    
    if (typeof timeInSeconds === 'number' && timeInSeconds >= 0) {
      smoothSeek(timeInSeconds);
    }
  };
  
  const resetVideo = () => {
    // ✨ ENHANCED: Better validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for reset');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot reset');
      return;
    }
    
    smoothSeek(0);
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-hide controls with longer delay
  useEffect(() => {
    let timer;
    if (showControls && player?.playing && !isBuffering) {
      // VM optimization: longer delay to reduce UI updates
      const hideDelay = isLowPerformanceDevice() ? 8000 : 5000; // 8s for VM, 5s for normal

      timer = setTimeout(() => {
        setShowControls(false);
      }, hideDelay);
    }
    return () => clearTimeout(timer);
  }, [showControls, player?.playing, isBuffering]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (bufferCheckRef.current) clearTimeout(bufferCheckRef.current);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  // ✨ Component cleanup useEffect (ENHANCED: better error handling)
  useEffect(() => {
    return () => {
      // Cleanup player on component unmount
      try {
        console.log('🧹 Starting VideoPlayer cleanup process...');
        
        // Enhanced null and type checking
        if (player && 
            typeof player === 'object' && 
            player !== null &&
            !Number.isInteger(player) && // Prevent integer being passed as player
            typeof player.pause === 'function') {
          
          console.log('🧹 Valid player object found, proceeding with cleanup');
          
          // Safely pause player before cleanup
          try {
            if (player.playing === true) {
              player.pause();
              console.log('⏸️ Player paused during cleanup');
            }
          } catch (pauseError) {
            console.warn('⚠️ Could not pause player during cleanup:', pauseError);
          }
          
          // Clear any pending timeouts
          if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = null;
          }
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          if (bufferCheckRef.current) {
            clearInterval(bufferCheckRef.current);
            bufferCheckRef.current = null;
          }
          if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
            hideControlsTimeout.current = null;
          }
          
          console.log('✅ VideoPlayer cleanup completed successfully');
        } else {
          console.log('⚠️ Player object is invalid or already cleaned up');
          if (player) {
            console.log('🔍 Player type:', typeof player, 'Value:', player);
          }
        }
      } catch (error) {
        console.error('❌ Error during VideoPlayer cleanup:', error);
        // Don't re-throw - allow component to unmount gracefully
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Netflix-style Quality Modal
  const renderNetflixQualityModal = () => (
      <Modal
          visible={showQualityModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowQualityModal(false)}
      >
        <View style={styles.netflixModalOverlay}>
          <View style={styles.netflixModalContent}>
            {/* Netflix-style Modal Header */}
            <View style={styles.netflixModalHeader}>
              <Text style={styles.netflixModalTitle}>Chọn Chất Lượng</Text>
              <TouchableOpacity
                  style={styles.netflixCloseButton}
                  onPress={() => setShowQualityModal(false)}
              >
                <Text style={styles.netflixCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Network Status - Netflix style */}
            {networkInfo && (
                <View style={styles.netflixNetworkCard}>
                  <Text style={styles.netflixNetworkTitle}>
                    📶 {networkInfo.type === 'wifi' ? 'Wi-Fi' : 'Mobile Data'}
                  </Text>
                  <Text style={styles.netflixNetworkStatus}>
                    {networkInfo.isConnected ? '✅ Kết nối tốt' : '❌ Mất kết nối'}
                      </Text>
                </View>
            )}

            {/* Netflix-style Quality List */}
            <FlatList
                data={qualityOptions}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                          styles.netflixQualityOption,
                          selectedQuality?.id === item.id && styles.netflixQualitySelected
                        ]}
                        onPress={() => selectQuality(item)}
                    >
                      <View style={styles.netflixQualityContent}>
                        <View style={styles.netflixQualityInfo}>
                          <Text style={styles.netflixQualityLabel}>{item.label}</Text>
                          <Text style={styles.netflixQualityDetails}>
                          {item.resolution} • {item.bitrate}
                          {item.frameRate !== 'Variable' && ` • ${item.frameRate}fps`}
                        </Text>
                          {/* Netflix-style quality indicator */}
                        {item.mobileScore > 0 && item.mobileScore < 30 && (
                              <View style={styles.netflixOptimizedBadge}>
                                <Text style={styles.netflixOptimizedText}>MOBILE</Text>
                              </View>
                        )}
                      </View>
                      {selectedQuality?.id === item.id && (
                            <View style={styles.netflixCheckContainer}>
                              <Text style={styles.netflixCheckmark}>✓</Text>
                            </View>
                      )}
                      </View>
                    </TouchableOpacity>
                )}
            />

            {/* Netflix-style Close Button */}
            <TouchableOpacity
                style={styles.netflixModalCloseButton}
                onPress={() => setShowQualityModal(false)}
            >
              <Text style={styles.netflixModalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  // Speed Control Modal
  const renderSpeedControlModal = () => (
      <Modal
          visible={showSpeedModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSpeedModal(false)}
      >
        <View style={styles.netflixModalOverlay}>
          <View style={styles.netflixModalContent}>
            <View style={styles.netflixModalHeader}>
              <Text style={styles.netflixModalTitle}>Tốc độ phát</Text>
              <TouchableOpacity
                  style={styles.netflixCloseButton}
                  onPress={() => setShowSpeedModal(false)}
              >
                <Text style={styles.netflixCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
                data={speedOptions}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                          styles.netflixSpeedOption,
                          playbackSpeed === item.value && styles.netflixQualitySelected
                        ]}
                        onPress={() => handlePlaybackSpeedChange(item.value)}
                    >
                      <Text style={styles.netflixSpeedLabel}>{item.label}</Text>
                      {playbackSpeed === item.value && (
                          <Text style={styles.netflixCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                )}
            />
          </View>
        </View>
      </Modal>
  );

  // Advanced Menu Modal
  const renderAdvancedMenuModal = () => (
      <Modal
          visible={showAdvancedMenu}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAdvancedMenu(false)}
      >
        <View style={styles.netflixModalOverlay}>
          <View style={styles.netflixModalContent}>
            <View style={styles.netflixModalHeader}>
              <Text style={styles.netflixModalTitle}>Tùy chọn nâng cao</Text>
              <TouchableOpacity
                  style={styles.netflixCloseButton}
                  onPress={() => setShowAdvancedMenu(false)}
              >
                <Text style={styles.netflixCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.netflixAdvancedMenu}>
              {/* Video Info */}
              <TouchableOpacity style={styles.netflixMenuOption}>
                <Text style={styles.netflixMenuIcon}>📊</Text>
                <View style={styles.netflixMenuTextContainer}>
                  <Text style={styles.netflixMenuTitle}>Thông tin video</Text>
                  <Text style={styles.netflixMenuSubtitle}>
                    {selectedQuality?.resolution} • {selectedQuality?.bitrate}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Download */}
              <TouchableOpacity style={styles.netflixMenuOption}>
                <Text style={styles.netflixMenuIcon}>💾</Text>
                <View style={styles.netflixMenuTextContainer}>
                  <Text style={styles.netflixMenuTitle}>Tải xuống</Text>
                  <Text style={styles.netflixMenuSubtitle}>Lưu để xem offline</Text>
                </View>
              </TouchableOpacity>

              {/* Report Problem */}
              <TouchableOpacity style={styles.netflixMenuOption}>
                <Text style={styles.netflixMenuIcon}>⚠️</Text>
                <View style={styles.netflixMenuTextContainer}>
                  <Text style={styles.netflixMenuTitle}>Báo cáo sự cố</Text>
                  <Text style={styles.netflixMenuSubtitle}>Gửi phản hồi về video</Text>
                </View>
              </TouchableOpacity>

              {/* Picture in Picture */}
              <TouchableOpacity style={styles.netflixMenuOption}>
                <Text style={styles.netflixMenuIcon}>📱</Text>
                <View style={styles.netflixMenuTextContainer}>
                  <Text style={styles.netflixMenuTitle}>Picture-in-Picture</Text>
                  <Text style={styles.netflixMenuSubtitle}>Xem trong cửa sổ nhỏ</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.netflixModalCloseButton}
                onPress={() => setShowAdvancedMenu(false)}
            >
              <Text style={styles.netflixModalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );

  // Advanced Netflix-style functions với enhanced error handling
  const skipForward = (seconds = 10) => {
    // ✨ ENHANCED: Better validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for skip forward');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot skip forward');
      return;
    }
    
    if (duration && typeof seconds === 'number') {
      try {
        const newTime = Math.min((currentTime || 0) + seconds, duration);
        smoothSeek(newTime);
        showSkipFeedback(`+${seconds}s`);
      } catch (error) {
        console.error('❌ Error skipping forward:', error);
      }
    }
  };

  const skipBackward = (seconds = 10) => {
    // ✨ ENHANCED: Better validation
    if (!player || typeof player !== 'object') {
      console.warn('⚠️ Player not available for skip backward');
      return;
    }
    
    if (player._isReleased === true) {
      console.warn('⚠️ Player has been released, cannot skip backward');
      return;
    }
    
    if (typeof seconds === 'number') {
      try {
        const newTime = Math.max((currentTime || 0) - seconds, 0);
        smoothSeek(newTime);
        showSkipFeedback(`-${seconds}s`);
      } catch (error) {
        console.error('❌ Error skipping backward:', error);
      }
    }
  };

  const showSkipFeedback = (text) => {
    // TODO: Implement skip feedback animation
    console.log(`Skip: ${text}`);
  };

  const handleVolumeChange = (newVolume) => {
    if (typeof newVolume === 'number' && newVolume >= 0 && newVolume <= 1) {
      setVolume(newVolume);
      
      // ✨ ENHANCED: Better validation
      if (!player || typeof player !== 'object') {
        console.warn('⚠️ Player not available for volume change');
        return;
      }
      
      if (player._isReleased === true) {
        console.warn('⚠️ Player has been released, cannot change volume');
        return;
      }
      
      try {
        if (player.volume !== undefined) {
          player.volume = newVolume;
        }
      } catch (error) {
        console.error('❌ Error changing volume:', error);
      }
    }
  };

  const handleBrightnessChange = (newBrightness) => {
    if (typeof newBrightness === 'number' && newBrightness >= 0 && newBrightness <= 1) {
      setBrightness(newBrightness);
      // TODO: Implement brightness control for Android/iOS
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    if (typeof speed === 'number' && speed > 0) {
      setPlaybackSpeed(speed);
      
      // ✨ ENHANCED: Better validation
      if (!player || typeof player !== 'object') {
        console.warn('⚠️ Player not available for speed change');
        setShowSpeedModal(false);
        return;
      }
      
      if (player._isReleased === true) {
        console.warn('⚠️ Player has been released, cannot change speed');
        setShowSpeedModal(false);
        return;
      }
      
      try {
        if (player.playbackRate !== undefined) {
          player.playbackRate = speed;
        }
      } catch (error) {
        console.error('❌ Error changing playback speed:', error);
      }
      setShowSpeedModal(false);
    }
  };

  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
    // TODO: Implement subtitle toggle
  };

  const toggleScreenLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      // Hide controls when locking
      setControlsVisible(false);
      setShowControls(false);
    }
  };

  // Double tap to skip (Netflix-style)
  const handleVideoTap = (event) => {
    if (isLocked) return;

    const now = Date.now();
    const tapX = event.nativeEvent.locationX;
    const screenCenterX = screenWidth / 2;

    if (lastTap && (now - lastTap) < 300) {
      // Double tap detected
      setIsDoubleTap(true);
      if (tapX < screenCenterX) {
        skipBackward(10);
      } else {
        skipForward(10);
      }
      setLastTap(null);
    } else {
      // Single tap
      setLastTap(now);
      setTimeout(() => {
        if (!isDoubleTap) {
          toggleControls();
        }
        setIsDoubleTap(false);
      }, 300);
    }
  };

  // Netflix-style Loading Screen
  if (loading) {
    return (
        <View style={styles.netflixLoadingContainer}>
          <StatusBar hidden={true} />
          <View style={styles.netflixLoadingContent}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.netflixLoadingTitle}>
              {isBuffering ? 'Đang tải...' : 'Netflix'}
          </Text>
            <Text style={styles.netflixLoadingSubtitle}>
              {movieTitle}
              </Text>
          </View>
        </View>
    );
  }

  // Netflix-style Error Screen
  if (error) {
    return (
        <View style={styles.netflixErrorContainer}>
          <StatusBar hidden={true} />
          <View style={styles.netflixErrorContent}>
            <Text style={styles.netflixErrorIcon}>⚠️</Text>
            <Text style={styles.netflixErrorTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.netflixErrorText}>{error}</Text>

            <TouchableOpacity style={styles.netflixRetryButton} onPress={initializePlayer}>
              <Text style={styles.netflixRetryText}>Thử lại</Text>
          </TouchableOpacity>

            <TouchableOpacity
                style={styles.netflixBackToHomeButton}
                onPress={() => navigation.goBack()}
            >
              <Text style={styles.netflixBackToHomeText}>Quay lại</Text>
            </TouchableOpacity>
              </View>
        </View>
    );
  }

  // Main render
  return (
      <View style={styles.netflixContainer}>
        <StatusBar hidden={true} />

        <TouchableOpacity
            style={styles.videoContainer}
            onPress={handleVideoTap}
            activeOpacity={1}
        >
          {currentStreamUrl && (
              <VideoView
                  style={styles.video}
                  player={player}
                  allowsFullscreen={true}
                  allowsPictureInPicture={false}
                  contentFit="contain"
                  nativeControls={false}
              />
          )}

          {/* Netflix-style Buffering indicator */}
          {isBuffering && (
              <View style={styles.netflixBufferingOverlay}>
                <ActivityIndicator size="large" color="#E50914" />
              </View>
          )}

          {/* Netflix-style Controls */}
          {controlsVisible && !isLocked && (
              <Animated.View
                  style={[styles.netflixControls, { opacity: fadeAnim }]}
                  pointerEvents={showControls ? 'auto' : 'none'}
              >
                {/* Top Gradient with Controls */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                    style={styles.topGradient}
                >
                  <View style={styles.netflixTopControls}>
                  <TouchableOpacity
                        style={styles.netflixBackButton}
                        onPress={() => navigation.goBack()}
                    >
                      <Text style={styles.netflixBackIcon}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.netflixTitleContainer}>
                      <Text style={styles.netflixTitle} numberOfLines={1}>
                        {movieTitle}
                    </Text>
                    </View>

                    <View style={styles.netflixTopRightControls}>
                      {/* Screen Lock */}
                      <TouchableOpacity
                          style={styles.netflixIconButton}
                          onPress={toggleScreenLock}
                      >
                        <Text style={styles.netflixIconText}>🔒</Text>
                      </TouchableOpacity>

                      {/* Advanced Menu */}
                      <TouchableOpacity
                          style={styles.netflixIconButton}
                          onPress={() => setShowAdvancedMenu(true)}
                      >
                        <Text style={styles.netflixIconText}>⋮</Text>
                  </TouchableOpacity>
                </View>
                  </View>
                </LinearGradient>

                {/* Center Controls with Skip Buttons */}
                <View style={styles.netflixCenterControls}>
                  <View style={styles.netflixCenterButtonsRow}>
                    {/* Skip Backward */}
                  <TouchableOpacity
                        style={styles.netflixSkipButton}
                        onPress={() => skipBackward(10)}
                    >
                      <Text style={styles.netflixSkipIcon}>⏪</Text>
                      <Text style={styles.netflixSkipText}>10</Text>
                    </TouchableOpacity>

                    {/* Main Play Button */}
                    <TouchableOpacity
                        style={styles.netflixPlayButton}
                      onPress={togglePlayPause}
                  >
                      <View style={styles.netflixPlayButtonInner}>
                        <Text style={styles.netflixPlayIcon}>
                          {player?.playing ? '⏸' : '▶'}
                    </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Skip Forward */}
                    <TouchableOpacity
                        style={styles.netflixSkipButton}
                        onPress={() => skipForward(10)}
                    >
                      <Text style={styles.netflixSkipIcon}>⏩</Text>
                      <Text style={styles.netflixSkipText}>10</Text>
                  </TouchableOpacity>
                  </View>
                </View>

                {/* Side Controls */}
                <View style={styles.netflixSideControls}>
                  {/* Volume Control */}
                  {showVolumeSlider && (
                      <View style={styles.netflixVolumeContainer}>
                        <Text style={styles.netflixVolumeIcon}>🔊</Text>
                        {/* Volume Slider */}
                        <View style={styles.netflixSlider}>
                          <View
                              style={[styles.netflixSliderFill, { height: `${volume * 100}%` }]}
                          />
                        </View>
                      </View>
                  )}

                  {/* Brightness Control */}
                  {showBrightnessSlider && (
                      <View style={styles.netflixBrightnessContainer}>
                        <Text style={styles.netflixBrightnessIcon}>☀️</Text>
                        {/* Brightness Slider */}
                        <View style={styles.netflixSlider}>
                          <View
                              style={[styles.netflixSliderFill, { height: `${brightness * 100}%` }]}
                          />
                        </View>
                      </View>
                  )}
                </View>

                {/* Bottom Gradient with Enhanced Controls */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={styles.bottomGradient}
                >
                  <View style={styles.netflixBottomControls}>
                    {/* Netflix-style Progress Bar */}
                    <View style={styles.netflixProgressContainer}>
                      <View style={styles.netflixProgressBar}>
                        {/* Buffer Progress */}
                    <View
                        style={[
                              styles.netflixBufferProgress,
                              {
                                width: `${Math.min(bufferHealth, 100)}%`
                              }
                            ]}
                        />
                        {/* Play Progress */}
                        <View
                            style={[
                              styles.netflixPlayProgress,
                          {
                            width: `${((currentTime || 0) / (duration || 1)) * 100}%`
                          }
                        ]}
                    />
                        {/* Progress Thumb */}
                    <View
                        style={[
                              styles.netflixProgressThumb,
                          {
                                left: `${((currentTime || 0) / (duration || 1)) * 100}%`
                          }
                        ]}
                    />
                      </View>
                  </View>

                    {/* Enhanced Bottom Controls */}
                    <View style={styles.netflixBottomInfo}>
                      <Text style={styles.netflixTimeText}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </Text>

                      <View style={styles.netflixBottomButtons}>
                        {/* Subtitles */}
                        <TouchableOpacity
                            style={[styles.netflixControlButton, subtitlesEnabled && styles.netflixButtonActive]}
                            onPress={toggleSubtitles}
                        >
                          <Text style={styles.netflixControlButtonText}>CC</Text>
                        </TouchableOpacity>

                        {/* Speed Control */}
                        <TouchableOpacity
                            style={styles.netflixControlButton}
                            onPress={() => setShowSpeedModal(true)}
                        >
                          <Text style={styles.netflixControlButtonText}>{playbackSpeed}x</Text>
                        </TouchableOpacity>

                        {/* Quality */}
                        <TouchableOpacity
                            style={styles.netflixControlButton}
                            onPress={() => setShowQualityModal(true)}
                        >
                          <Text style={styles.netflixControlButtonText}>
                            {selectedQuality?.label || 'HD'}
                          </Text>
                        </TouchableOpacity>

                        {/* Volume */}
                        <TouchableOpacity
                            style={styles.netflixControlButton}
                            onPress={() => setShowVolumeSlider(!showVolumeSlider)}
                        >
                          <Text style={styles.netflixControlButtonText}>
                            {volume === 0 ? '🔇' : '🔊'}
                          </Text>
                        </TouchableOpacity>
                </View>
              </View>
                  </View>
                </LinearGradient>
              </Animated.View>
          )}

          {/* Screen Lock Overlay */}
          {isLocked && (
              <View style={styles.netflixLockOverlay}>
                <TouchableOpacity
                    style={styles.netflixUnlockButton}
                    onPress={toggleScreenLock}
                >
                  <Text style={styles.netflixUnlockIcon}>🔓</Text>
                  <Text style={styles.netflixUnlockText}>Chạm để mở khóa</Text>
                </TouchableOpacity>
              </View>
          )}
        </TouchableOpacity>

        {/* Netflix-style Quality Modal */}
        {renderNetflixQualityModal()}

        {/* Speed Control Modal */}
        {renderSpeedControlModal()}

        {/* Advanced Menu Modal */}
        {renderAdvancedMenuModal()}
      </View>
  );
}

// Add new styles for mobile optimization
const styles = StyleSheet.create({
  // ... existing styles ...

  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  bufferProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  networkInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  networkText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  networkIndicator: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  networkStatus: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  networkStatusText: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  mobileOptimized: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Update existing styles with mobile optimization
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  video: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    alignItems: 'center',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  qualityButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  qualityButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playButtonText: {
    fontSize: 32,
    textAlign: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  seekBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    position: 'relative',
    marginVertical: 12,
  },
  seekProgress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
    position: 'absolute',
  },
  // ... rest of existing styles
  infoContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    padding: 8,
  },
  closeIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  networkInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  networkStatusHeader: {
    marginBottom: 8,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  networkDetails: {
    alignItems: 'center',
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedQuality: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  qualityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  qualityDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkmarkContainer: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  loadingInfo: {
    alignItems: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    color: '#dc3545',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  retryIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  networkStatusCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  networkStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  topControlsGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  qualityIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playButtonContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 50,
  },
  bottomControlsGradient: {
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSeparator: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 8,
  },
  seekBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  seekThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkIndicatorContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  qualityIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  qualityIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mobileOptimizedBadge: {
    backgroundColor: '#28a745',
    padding: 4,
    borderRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  netflixBufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  netflixTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  netflixBackButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netflixBackIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixTitleContainer: {
    flex: 1,
  },
  netflixTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  netflixQualityButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  netflixQualityText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  netflixCenterControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixPlayButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  netflixPlayButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixPlayIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  netflixBottomControls: {
    alignItems: 'center',
  },
  netflixProgressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  netflixProgressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    position: 'absolute',
  },
  netflixBufferProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  netflixPlayProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  netflixProgressThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  netflixBottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  netflixTimeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  netflixRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixNetworkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  netflixModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  netflixModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  netflixModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  netflixCloseButton: {
    padding: 8,
  },
  netflixCloseIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  netflixNetworkCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  netflixNetworkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  netflixNetworkStatus: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  netflixQualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  netflixQualitySelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  netflixQualityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netflixQualityInfo: {
    flex: 1,
  },
  netflixQualityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  netflixQualityDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  netflixOptimizedBadge: {
    backgroundColor: '#28a745',
    padding: 4,
    borderRadius: 4,
  },
  netflixOptimizedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  netflixCheckContainer: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  netflixCheckmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  netflixModalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  netflixModalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  netflixLoadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  netflixLoadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixLoadingTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  netflixLoadingSubtitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  netflixErrorContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  netflixErrorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixErrorIcon: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 16,
  },
  netflixErrorTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  netflixErrorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  netflixRetryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  netflixRetryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  netflixBackToHomeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  netflixBackToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  netflixTopRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixIconButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixCenterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixSkipButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixSkipIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixSkipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixSideControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixVolumeContainer: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixVolumeIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixSlider: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  netflixSliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  netflixBrightnessContainer: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixBrightnessIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netflixUnlockButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixUnlockIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netflixUnlockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixBottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixControlButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixControlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixButtonActive: {
    backgroundColor: '#007AFF',
  },
  netflixSpeedOption: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixSpeedLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixAdvancedMenu: {
    padding: 16,
  },
  netflixMenuOption: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  netflixMenuTextContainer: {
    marginLeft: 12,
  },
  netflixMenuTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  netflixMenuSubtitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  netflixMenuIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

