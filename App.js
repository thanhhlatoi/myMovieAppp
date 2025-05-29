import { LogBox } from 'react-native';

// Chặn warning liên quan đến expo-av
LogBox.ignoreLogs([
  '[expo-av]: Video component from `expo-av` is deprecated',
]);

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import MovieScreen from "./src/screens/MovieScreen";
import VideoPlayerScreen from "./src/screens/VideoPlayerScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SearchScreen from "./src/screens/SearchScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import WriteReviewScreen from "./src/screens/WriteReviewScreen";
import MovieReviewsScreen from "./src/screens/MovieReviewsScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Regular: require("./assets/fonts/NunitoSans-Regular.ttf"),
    Bold: require("./assets/fonts/NunitoSans-Bold.ttf"),
    Black: require("./assets/fonts/NunitoSans-Black.ttf"),
    ExtraBold: require("./assets/fonts/NunitoSans-ExtraBold.ttf"),
    ExtraLight: require("./assets/fonts/NunitoSans-ExtraLight.ttf"),
    Light: require("./assets/fonts/NunitoSans-Light.ttf"),
    SemiBold: require("./assets/fonts/NunitoSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="movie"
          component={MovieScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WriteReviewScreen" component={WriteReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MovieReviewsScreen" component={MovieReviewsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
