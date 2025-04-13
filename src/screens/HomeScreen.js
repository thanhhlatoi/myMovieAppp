import { StatusBar } from "expo-status-bar";
import { Text,View,StyleSheet,ScrollView,FlatList } from "react-native"
import React  from "react";
import COLORS from "../constants/Colors";
import FONTS from "../constants/Fonts";
import GenreCard from "../components /GenreCard";
import ItemSeparator from "../components /ItemSeparator";

const Genres = ["All", "Action", "Comedy", "Romance", "Horror", "Sci-Fi"];
const HomeScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar 
        style="auto"
        translucent={false}
        backgroundColor={COLORS.BASIC_BACKGROUND}
      />
      <View style={styles.headerContainer}>
        <Text style={styles.headerContainer}>Now Playing</Text>
        <Text style={styles.headerSubTitle}>View All</Text>
      </View>
      <View>
        <FlatList 
        data={Genres}
        horizontal
        keyExtractor={(item) => item}
        ItemSeparatorComponent={() => <ItemSeparator with={20} />}
        renderItem={({item}) => <GenreCard/>
      }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BASIC_BACKGROUND,
  },
  headerContainer: {
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    paddingHorizontal:20,
    paddingVertical:10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONTS.REGULAR,
  },
  headerSubTitle: {
    fontSize: 13,
    color: COLORS.ACTIVE,
    fontFamily: FONTS.BOLD,
  },
});

export default HomeScreen;