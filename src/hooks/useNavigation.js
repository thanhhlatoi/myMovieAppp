import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import MovieService from '../services/MovieService';

export const useMovieNavigation = (movies) => {
    const navigation = useNavigation();

    const handleMoviePress = async (movieId) => {
        try {
            console.log("🎬 Opening movie:", movieId);
            const response = await MovieService.getMovieById(movieId);
            navigation.navigate("movie", { movie: response });
        } catch (error) {
            console.error("❌ Lỗi khi lấy chi tiết phim:", error);
            const movie = movies.find(m => m.id === movieId);
            if (movie) {
                navigation.navigate("movie", { movie });
            } else {
                Alert.alert("Lỗi", "Không thể mở phim này");
            }
        }
    };

    const handleMenuAction = (action) => {
        switch(action) {
            case 'Profile':
                // navigation.navigate('Profile');
                console.log("Navigate to Profile");
                break;
            case 'Favorites':
                // navigation.navigate('Favorites');
                console.log("Navigate to Favorites");
                break;
            case 'Settings':
                // navigation.navigate('Settings');
                console.log("Navigate to Settings");
                break;
            case 'Logout':
                Alert.alert(
                    "Đăng xuất",
                    "Bạn có chắc chắn muốn đăng xuất?",
                    [
                        { text: "Hủy", style: "cancel" },
                        { text: "Đăng xuất", onPress: () => console.log("Logged out") }
                    ]
                );
                break;
            default:
                console.log("Unknown action:", action);
        }
    };

    const quickNavigation = {
        trending: () => console.log("Navigate to trending"),
        topRated: () => console.log("Navigate to top rated"),
        favorites: () => console.log("Navigate to favorites"),
        history: () => console.log("Navigate to history"),
        search: () => console.log("Navigate to search"),
        notifications: () => console.log("Navigate to notifications")
    };

    return {
        handleMoviePress,
        handleMenuAction,
        quickNavigation
    };
};
