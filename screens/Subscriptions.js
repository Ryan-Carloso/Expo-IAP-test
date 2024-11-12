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
  Alert,
  Linking,
} from "react-native";
import {
  PurchaseError,
  initConnection,
  requestSubscription,
  useIAP,
  validateReceiptIos,
  getProducts,
  endConnection,
} from "react-native-iap";

const ITUNES_SHARED_SECRET = "0b906b40ae9b491db62b3d47bca358b4";

const subscriptionSkus = Platform.select({
  ios: ["testiap299"],
  android: [],
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
  const [error, setError] = useState(null);
  const [connectionEstablished, setConnectionEstablished] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setupIAP = async () => {
      try {
        console.log("Starting IAP setup...");
        
        try {
          await endConnection();
          console.log("Ended previous IAP connection");
        } catch (endError) {
          console.log("No previous connection to end:", endError);
        }

        const result = await initConnection();
        console.log("IAP Connection initialized:", result);
        
        if (isMounted) {
          setConnectionEstablished(true);
          console.log("IAP setup complete");
        }

      } catch (error) {
        console.error("IAP setup failed:", error);
        if (isMounted) {
          setError(`IAP initialization failed: ${error.message || 'Unknown error'}`);
          Alert.alert(
            "Setup Error",
            "Failed to initialize in-app purchases. Please try again later."
          );
        }
      }
    };

    setupIAP();

    return () => {
      isMounted = false;
      endConnection();
    };
  }, []);

  const fetchSubscriptions = async () => {
    if (!connectionEstablished) {
      console.log("Connection not established yet, skipping subscription fetch");
      return;
    }

    try {
      console.log("Fetching subscription products...");
      setLoading(true);
      
      const products = await getProducts({ skus: subscriptionSkus });
      console.log("Available products:", products);

      if (!products || products.length === 0) {
        console.log("No products found for SKUs:", subscriptionSkus);
        throw new Error("No products available for purchase");
      }

      const subs = await getSubscriptions({ skus: subscriptionSkus });
      console.log("Subscription details:", subs);

      if (!subs || subs.length === 0) {
        console.log("No subscriptions found");
        throw new Error("No subscription products available");
      }

    } catch (error) {
      console.error("Subscription fetch error:", error);
      setError(`Failed to load subscriptions: ${error.message || 'Unknown error'}`);
      Alert.alert(
        "Loading Error",
        "Unable to load subscription products. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    if (!connectionEstablished) {
      console.log("Connection not established yet, skipping history fetch");
      return;
    }

    try {
      console.log("Fetching purchase history...");
      const history = await getPurchaseHistory();
      console.log("Purchase history retrieved:", history);
      
      if (history && history.length > 0) {
        console.log("Active purchases found:", history.length);
      } else {
        console.log("No previous purchases found");
      }

    } catch (error) {
      console.error("Purchase history error:", error);
      console.warn(`Purchase history fetch failed: ${error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (connectionEstablished && connected) {
      console.log("Connection established, fetching initial data...");
      fetchSubscriptions();
      fetchPurchaseHistory();
    }
  }, [connectionEstablished, connected]);

  const processPurchase = async (productId) => {
    const purchase = await requestSubscription({
      sku: productId,
      andDangerouslyFinishTransactionAutomaticallyIOS: false,
    });

    console.log("Purchase response:", purchase);

    if (Platform.OS === 'ios' && purchase?.transactionReceipt) {
      await validateReceiptIos({
        receiptBody: {
          "receipt-data": purchase.transactionReceipt,
          password: ITUNES_SHARED_SECRET,
        },
        isTest: __DEV__,
      });
    }

    await finishTransaction({ purchase, isConsumable: false });
    console.log("Transaction finished successfully");
    
    Alert.alert(
      "Success",
      "Thank you for your purchase!",
      [{ text: "OK", onPress: () => navigation.navigate("Home") }]
    );
  };

  const handleSubscription = async (productId) => {
    try {
      setLoading(true);
      console.log("Initiating subscription purchase for:", productId);

      if (Platform.OS === 'ios' && __DEV__) {
        Alert.alert(
          "Sandbox Testing",
          "Please ensure you're signed in with a Sandbox Apple ID in device Settings before proceeding.",
          [
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
            {
              text: "Continue",
              onPress: async () => await processPurchase(productId),
            },
            {
              text: "Cancel",
              style: "cancel",
            }
          ]
        );
        return;
      }

      await processPurchase(productId);

    } catch (error) {
      console.error("Purchase error:", error);
      let errorMessage = "Purchase failed. Please try again later.";
      
      if (error instanceof PurchaseError) {
        console.error(`Purchase error code: ${error.code}, message: ${error.message}`);
        
        switch (error.code) {
          case 'E_USER_CANCELLED':
            errorMessage = "Purchase was cancelled.";
            break;
          case 'E_ALREADY_OWNED':
            errorMessage = "You already own this subscription.";
            break;
          case 'E_NOT_PREPARED':
            errorMessage = "Store is not ready. Please try again.";
            break;
          default:
            errorMessage = `Purchase failed: ${error.message}`;
        }
      }
      
      Alert.alert("Purchase Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#0071bc" />
      <Text style={styles.loadingText}>Loading subscriptions...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          fetchSubscriptions();
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubscriptions = () => (
    <ScrollView>
      <View style={styles.container}>
        {subscriptions && subscriptions.length > 0 ? (
          subscriptions.map((subscription, index) => (
            <View key={index} style={styles.subscriptionCard}>
              <Text style={styles.subscriptionTitle}>{subscription.title}</Text>
              <Text style={styles.subscriptionPrice}>{subscription.localizedPrice}</Text>
              <Text style={styles.subscriptionDescription}>{subscription.description}</Text>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscription(subscription.productId)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Processing..." : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noSubscriptionsText}>
            No subscription products available
          </Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? renderLoadingState() :
       error ? renderError() :
       renderSubscriptions()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0071bc',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscriptionPrice: {
    fontSize: 16,
    color: '#0071bc',
    marginVertical: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  subscribeButton: {
    backgroundColor: '#0071bc',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noSubscriptionsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
});

export default Subscriptions;