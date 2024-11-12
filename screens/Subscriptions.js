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
  Dimensions,
} from "react-native";
import {
  initConnection,
  requestSubscription,
  useIAP,
  getProducts,
  endConnection,
} from "react-native-iap";

const { width } = Dimensions.get('window');

const ITUNES_SHARED_SECRET = "0b906b40ae9b491db62b3d47bca358b4";

const subscriptionSkus = Platform.select({
  ios: ["testiap299"], 
  android: ["androidTestSku"],
});

export const Subscriptions = ({ navigation }) => {
  const {
    connected,
    subscriptions,
    getSubscriptions,
    currentPurchase,
    finishTransaction,
    getPurchaseHistory,
  } = useIAP();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionEstablished, setConnectionEstablished] = useState(false);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [subscribedProducts, setSubscribedProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const setupIAP = async () => {
      try {
        console.log("Starting IAP setup...");

        await endConnection();
        console.log("Ended previous IAP connection");

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

      const validSubscriptions = products.filter(
        (product) => product.type === "subs"
      );

      if (validSubscriptions.length === 0) {
        throw new Error("No subscription products available");
      }

      setAvailableSubscriptions(validSubscriptions);
      
      // Simulating subscribed products for demonstration
      setSubscribedProducts([validSubscriptions[0].productId]);
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

  useEffect(() => {
    if (connectionEstablished && connected) {
      console.log("Connection established, fetching initial data...");
      fetchSubscriptions();
    }
  }, [connectionEstablished, connected]);

  const handleSubscription = async (productId) => {
    if (subscribedProducts.includes(productId)) {
      Alert.alert("Already Subscribed", "You are already subscribed to this plan.");
      return;
    }

    try {
      setLoading(true);
      console.log("Initiating subscription purchase for:", productId);

      await requestSubscription({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });

      Alert.alert("Success", "Thank you for your purchase!");
      setSubscribedProducts([...subscribedProducts, productId]);
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Purchase Failed", `Error: ${error.message}`);
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {availableSubscriptions && availableSubscriptions.length > 0 ? 
        availableSubscriptions.map((subscription, index) => (
          <View key={index} style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>{subscription.title}</Text>
            <Text style={styles.subscriptionPrice}>{subscription.localizedPrice}</Text>
            <Text style={styles.subscriptionDescription}>{subscription.description}</Text>
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                subscribedProducts.includes(subscription.productId) && styles.subscribedButton
              ]}
              onPress={() => handleSubscription(subscription.productId)}
              disabled={loading || subscribedProducts.includes(subscription.productId)}
            >
              <Text style={styles.buttonText}>
                {subscribedProducts.includes(subscription.productId)
                  ? "Subscribed"
                  : loading
                  ? "Processing..."
                  : "Subscribe"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      : 
      <Text style={styles.noSubscriptionsText}>No subscriptions available</Text>
    }
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
    backgroundColor: '#f0f0f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#0071bc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  subscriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subscriptionPrice: {
    fontSize: 18,
    color: '#0071bc',
    marginBottom: 12,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: '#0071bc',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  subscribedButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSubscriptionsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default Subscriptions;