import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  PurchaseError,
  requestSubscription,
  useIAP,
  validateReceiptIos,
} from "react-native-iap";

const ITUNES_SHARED_SECRET = "0b906b40ae9b491db62b3d47bca358b4";

const errorLog = ({ message, error }) => {
  console.error("An error happened:", message, error);
};

const subscriptionSkus = Platform.select({
  ios: ["testiap299"],
});

export const Subscriptions = ({ navigation }) => {
  const {
    connected,
    subscriptions,
    getSubscriptions,
    currentPurchase,
    finishTransaction,
    purchaseHistory,
    getPurchaseHistory,
  } = useIAP();

  const [loading, setLoading] = useState(false);

  const handleGetPurchaseHistory = async () => {
    try {
      console.log("Retrieving purchase history...");
      await getPurchaseHistory();
      console.log("Purchase history:", purchaseHistory);
    } catch (error) {
      errorLog({ message: "handleGetPurchaseHistory", error });
    }
  };

  useEffect(() => {
    console.log("Connected:", connected);
    if (!connected) {
      console.log("IAP not connected.");
    }
    handleGetPurchaseHistory();
  }, [connected]);

  const handleGetSubscriptions = async () => {
    try {
      console.log("Getting subscriptions...");
      await getSubscriptions({ skus: subscriptionSkus });
      console.log("Subscriptions retrieved:", subscriptions);
    } catch (error) {
      errorLog({ message: "handleGetSubscriptions", error });
    }
  };

  useEffect(() => {
    handleGetSubscriptions();
  }, [connected]);

  useEffect(() => {
    if (
      purchaseHistory.find(
        (x) => x.productId === (subscriptionSkus[0] || subscriptionSkus[1])
      )
    ) {
      console.log("Purchase found, navigating to Home...");
      navigation.navigate("Home");
    }
  }, [connected, purchaseHistory, subscriptions]);

  const handleBuySubscription = async (productId) => {
    try {
      console.log("Requesting subscription for product:", productId);
      await requestSubscription({ sku: productId });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof PurchaseError) {
        errorLog({ message: `[${error.code}]: ${error.message}`, error });
      } else {
        errorLog({ message: "handleBuySubscription", error });
      }
    }
  };

  useEffect(() => {
    const checkCurrentPurchase = async (purchase) => {
      if (purchase) {
        try {
          console.log("Current purchase detected:", purchase);
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            const isTestEnvironment = __DEV__;
            const appleReceiptResponse = await validateReceiptIos(
              {
                "receipt-data": receipt,
                password: ITUNES_SHARED_SECRET,
              },
              isTestEnvironment
            );
            console.log("Apple receipt response:", appleReceiptResponse);
            if (appleReceiptResponse) {
              const { status } = appleReceiptResponse;
              if (status) {
                navigation.navigate("Home");
              }
            }
          }
        } catch (error) {
          errorLog({ message: "checkCurrentPurchase", error });
        }
      }
    };
    checkCurrentPurchase(currentPurchase);
  }, [currentPurchase, finishTransaction]);

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={{ padding: 10 }}>
          <Text
            style={{
              fontSize: 28,
              textAlign: "center",
              paddingBottom: 15,
              color: "black",
              fontWeight: "bold",
            }}
          >
            Subscribe
          </Text>
          <Text style={styles.listItem}>
            Subscribe to some cool stuff today.
          </Text>
          <Text
            style={{
              fontWeight: "500",
              textAlign: "center",
              marginTop: 10,
              fontSize: 18,
            }}
          >
            Choose your membership plan.
          </Text>
          <View style={{ marginTop: 10 }}>
            {subscriptions.map((subscription, index) => {
              const owned = purchaseHistory.find(
                (s) => s?.productId === subscription.productId
              );
              console.log("subscriptions", subscription?.productId);
              return (
                <View style={styles.box} key={index}>
                  {subscription?.introductoryPriceSubscriptionPeriodIOS && (
                    <>
                      <Text style={styles.specialTag}>SPECIAL OFFER</Text>
                    </>
                  )}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <Text
                      style={{
                        paddingBottom: 10,
                        fontWeight: "bold",
                        fontSize: 18,
                        textTransform: "uppercase",
                      }}
                    >
                      {subscription?.title}
                    </Text>
                    <Text
                      style={{
                        paddingBottom: 20,
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      {subscription?.localizedPrice}
                    </Text>
                  </View>
                  {subscription?.introductoryPriceSubscriptionPeriodIOS && (
                    <Text>
                      Free for 1{" "}
                      {subscription?.introductoryPriceSubscriptionPeriodIOS}
                    </Text>
                  )}
                  <Text style={{ paddingBottom: 20 }}>
                    {subscription?.description}
                  </Text>
                  {owned && (
                    <Text style={{ textAlign: "center", marginBottom: 10 }}>
                      You are Subscribed to this plan!
                    </Text>
                  )}
                  {owned && (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: "#0071bc" }]}
                      onPress={() => {
                        navigation.navigate("Home");
                      }}
                    >
                      <Text style={styles.buttonText}>Continue to App</Text>
                    </TouchableOpacity>
                  )}
                  {loading && <ActivityIndicator size="large" />}
                  {!loading && !owned && (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => {
                        setLoading(true);
                        handleBuySubscription(subscription.productId);
                      }}
                    >
                      <Text style={styles.buttonText}>Subscribe</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listItem: {
    fontSize: 16,
    paddingLeft: 8,
    paddingBottom: 3,
    textAlign: "center",
    color: "black",
  },
  box: {
    margin: 10,
    marginBottom: 5,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 7,
    shadowColor: "rgba(0, 0, 0, 0.45)",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "mediumseagreen",
    borderRadius: 8,
    padding: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
  },
  specialTag: {
    color: "white",
    backgroundColor: "crimson",
    width: 125,
    padding: 4,
    fontWeight: "bold",
    fontSize: 12,
    borderRadius: 7,
    marginBottom: 2,
  },
});