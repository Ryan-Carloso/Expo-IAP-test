/**
 * React Native App Iap Example
 *
 * @format
 */
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import { withIAPContext } from "react-native-iap";
import { createStackNavigator } from "@react-navigation/stack";

import { Home } from "./screens/Home";
import { Subscriptions } from "./screens/Subscriptions";

export const screens = [
  {
    name: "Subscriptions",
    title: "Subscriptions",
    component: withIAPContext(Subscriptions),
    section: "Context",
    color: "#cebf38",
  },
  {
    name: "Home",
    component: Home,
    section: "Context",
    color: "#cebf38",
  },
];

const Stack = createStackNavigator();

export const StackNavigator = () => (
  <Stack.Navigator screenOptions={{ title: "MainlyPaleo Subscriptions" }}>
    {screens.map(({ name, component, title }) => (
      <Stack.Screen
        key={name}
        name={name}
        component={component}
        //hide the header on these screens
        options={{
          title: title,
          headerShown:
            name === "Home" || name === "Subscriptions" ? false : true,
        }}
      />
    ))}
  </Stack.Navigator>
);

function App() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}

export default App;