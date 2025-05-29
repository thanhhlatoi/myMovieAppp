import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

// ✨ ENHANCED: Netflix-style HeaderBar with search, notifications and user profile
const HeaderBar = ({ 
  setMenuVisible, 
  onSearchPress, 
  onNotificationPress,
  searchVisible = false,
  onSearchClose,
  onSearchChange,
  notificationCount = 0,
  userProfile = null 
}) => {
  const [isSearchActive, setIsSearchActive] = useState(searchVisible);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  
  // Animations
  const searchWidthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ✨ NETFLIX FEATURE: Smooth search animation
  useEffect(() => {
    if (isSearchActive) {
      // Expand search
      Animated.parallel([
        Animated.timing(searchWidthAnim, {
          toValue: screenWidth - 100,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        searchInputRef.current?.focus();
      });
    } else {
      // Collapse search
      Animated.parallel([
        Animated.timing(searchWidthAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSearchActive]);

  const handleSearchToggle = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery('');
      onSearchClose?.();
    } else {
      setIsSearchActive(true);
      onSearchPress?.();
    }
  };

  const handleSearchSubmit = () => {
    onSearchChange?.(searchQuery);
  };

  const handleUserPress = () => {
    setMenuVisible(true);
  };

  // ✨ NETFLIX FEATURE: Dynamic header based on scroll or context
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'transparent']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          
          {/* ✨ NETFLIX FEATURE: Logo and branding */}
          <Animated.View style={[styles.left, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
              <View style={styles.netflixLogo}>
                <Text style={styles.netflixText}>N</Text>
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.appTitle}>Netflix</Text>
                <Text style={styles.greeting}>Khám phá điện ảnh</Text>
              </View>
            </View>
          </Animated.View>

          {/* ✨ NETFLIX FEATURE: Animated search bar */}
          <Animated.View style={[styles.searchContainer, { width: searchWidthAnim }]}>
            {isSearchActive && (
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color="#ccc" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Icon name="clear" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* ✨ NETFLIX FEATURE: Enhanced action buttons */}
          <Animated.View style={[styles.right, { opacity: fadeAnim }]}>
            
            {/* Search toggle */}
            <TouchableOpacity 
              style={[styles.actionButton, isSearchActive && styles.activeButton]} 
              onPress={handleSearchToggle}
            >
              <Icon 
                name={isSearchActive ? "close" : "search"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>

            {/* ✨ NETFLIX FEATURE: Smart notifications with badge */}
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onNotificationPress}
            >
              <View style={styles.notificationContainer}>
                <Icon name="notifications" size={24} color="#fff" />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* ✨ NETFLIX FEATURE: User profile with avatar */}
            <TouchableOpacity
              onPress={handleUserPress}
              style={styles.profileButton}
            >
              {userProfile?.avatar ? (
                <Image 
                  source={{ uri: userProfile.avatar }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfile}>
                  <Icon name="account-circle" size={32} color="#E50914" />
                </View>
              )}
              
              {/* Online indicator */}
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
          </Animated.View>

        </View>
      </LinearGradient>
      
      {/* ✨ NETFLIX FEATURE: Quick search suggestions (when search is active) */}
      {isSearchActive && searchQuery.length > 0 && (
        <View style={styles.searchSuggestions}>
          <Text style={styles.suggestionsHeader}>Gợi ý tìm kiếm</Text>
          {/* Add search suggestions here */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  gradient: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 50,
  },
  
  // ✨ NETFLIX FEATURE: Enhanced logo section
  left: {
    flex: 1,
    maxWidth: '40%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netflixLogo: {
    backgroundColor: '#E50914',
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  netflixText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    fontFamily: FONTS.BOLD,
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 1,
    fontFamily: FONTS.REGULAR,
    fontWeight: '400',
  },
  
  // ✨ NETFLIX FEATURE: Animated search container
  searchContainer: {
    position: 'absolute',
    left: 20,
    right: 100,
    height: 40,
    justifyContent: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  
  // ✨ NETFLIX FEATURE: Enhanced action buttons
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 120,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeButton: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    borderColor: 'rgba(229,9,20,0.5)',
  },
  
  // ✨ NETFLIX FEATURE: Smart notification badge
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E50914',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  
  // ✨ NETFLIX FEATURE: Enhanced user profile
  profileButton: {
    position: 'relative',
    marginLeft: 12,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E50914',
  },
  defaultProfile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E50914',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  
  // ✨ NETFLIX FEATURE: Search suggestions
  searchSuggestions: {
    position: 'absolute',
    top: '100%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  suggestionsHeader: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.BOLD,
    marginBottom: 10,
  },
});

export default HeaderBar;
