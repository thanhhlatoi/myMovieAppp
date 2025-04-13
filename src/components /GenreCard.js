import React from "react";
import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from "react-native";
import COLORS from "../constants/Colors";
import FONTS from "../constants/Fonts";

const { height,width } = Dimensions.get("screen");

const setWidth = (w) => (width / 100) * w;

const GenreCard = () => {
  return (
    <View style={styles.container} >
      <Text>
        Action
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 8,
    elevation: 3,
    marginVertical: 2,
    width: setWidth(25),
  },
  genreText: {
    fontSize: 13,
    color: COLORS.ACTIVE,
    fontFamily: FONTS.BOLD,
  },
});

export default GenreCard;
