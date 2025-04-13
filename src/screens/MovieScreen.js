import { StatusBar } from "expo-status-bar";
import { Text,View,StyleSheet } from "react-native"
import React  from "react";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* <StatusBar style="auto"/> */}
      <Text>MovieScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;