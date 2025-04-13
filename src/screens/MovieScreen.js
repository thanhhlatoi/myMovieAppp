import { View, Text, Image, StyleSheet } from "react-native";
import React from "react";

const MovieScreen = ({ route }) => {
  const { movie } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: movie.imgMovie }} style={styles.image} />
      <Text style={styles.title}>{movie.title}</Text>
      <Text style={styles.description}>{movie.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    marginTop: 20,
    fontWeight: "bold",
  },
  description: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default MovieScreen;
