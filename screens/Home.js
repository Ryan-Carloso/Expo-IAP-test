import React from "react";

import {
  SafeAreaView,
  View,
  Image,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";

export const Home = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to my app</Text>
      {/* <Image
        style={styles.image}
        source={require('../assets/trail-laguna.png')}
      /> */}

      <Text style={styles.paragraph}>
        Get access to 100s of delicious low calorie nutritious and easy to make
        recipes. Get daily updates and tips to eat healthy.
      </Text>
      <View style={styles.button}>
        <Pressable
        //navigate to some other paid content here.
        //onPress={() => navigation.navigate("Home")}
        >
          {({ pressed }) => (
            <Text style={styles.buttonText}>
              {pressed ? "Loading!" : "GET STARTED"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 70,
    width: "100%",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    paddingBottom: 15,
    color: "black",
    fontWeight: "bold",
  },
  paragraph: {
    fontSize: 16,
    paddingLeft: 8,
    paddingBottom: 3,
    textAlign: "center",
    color: "black",
    marginTop: 10,
  },
  button: {
    margin: 10,
    padding: 10,
    borderRadius: 7,
    alignSelf: "stretch",
    width: "auto",
    backgroundColor: "dodgerblue",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
    textAlign: "center",
  },
  image: { width: "100%", height: 258, resizeMode: "contain" },
});