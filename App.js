import React from "react";
import { withIAPContext } from "react-native-iap";
import { Subscriptions } from "./screens/Subscriptions";

const WrappedSubscriptions = withIAPContext(Subscriptions);

export default function App() {
  return <WrappedSubscriptions />;
}