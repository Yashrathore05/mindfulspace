import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  SUBSCRIPTION_LEVELS, 
  purchaseSubscription, 
  getSubscriptionDetails 
} from '../services/subscriptionService';

const SubscriptionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Subscription plan details
  const plans = [
    {
      id: SUBSCRIPTION_LEVELS.FREE,
      name: 'Free Plan',
      price: 'Free',
      description: 'Basic mental wellness support',
      features: [
        'Basic chatbot support',
        'Mood tracking',
        'Limited wellness content'
      ],
      recommended: false
    },
    {
      id: SUBSCRIPTION_LEVELS.PREMIUM,
      name: 'Premium',
      price: '$7.99',
      period: 'monthly',
      description: 'Enhanced mental wellness tools',
      features: [
        'AI Therapy Sessions',
        'Advanced Mental Health Assessment',
        'Unlimited conversations',
        'All wellness content'
      ],
      recommended: true
    },
    {
      id: SUBSCRIPTION_LEVELS.PREMIUM_PLUS,
      name: 'Premium+',
      price: '$14.99',
      period: 'monthly',
      description: 'Comprehensive mental health support',
      features: [
        'Everything in Premium',
        'Crisis Intervention Protocol',
        'Weekly mental health reports',
        'Priority support'
      ],
      recommended: false
    }
  ];

  // Load current subscription on mount
  useEffect(() => {
    loadSubscriptionDetails();
  }, []);

  // Get current subscription details
  const loadSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const details = await getSubscriptionDetails();
      setCurrentSubscription(details);
    } catch (error) {
      console.error('Error loading subscription details:', error);
      Alert.alert('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription purchase
  const handlePurchase = async () => {
    if (!selectedPlan || selectedPlan.id === SUBSCRIPTION_LEVELS.FREE) {
      return;
    }

    try {
      setPurchasing(true);
      
      // In a real app, you would integrate with payment provider here
      // For this demo, we'll just simulate a successful purchase
      await purchaseSubscription(selectedPlan.id);
      
      // Refresh subscription details
      await loadSubscriptionDetails();
      
      Alert.alert(
        'Subscription Successful',
        `You are now subscribed to the ${selectedPlan.name} plan.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Check if a plan is currently active
  const isPlanActive = (planId) => {
    return currentSubscription && currentSubscription.level === planId;
  };

  return (
    <LinearGradient colors={['#1c1c1c', '#2c2c2c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#42a5f5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Plans</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42a5f5" />
            <Text style={styles.loadingText}>Loading subscription details...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {/* Current Subscription Info */}
            {currentSubscription && currentSubscription.isActive && (
              <View style={styles.currentPlanCard}>
                <Text style={styles.currentPlanTitle}>Current Plan</Text>
                <Text style={styles.currentPlanName}>{currentSubscription.name}</Text>
                <Text style={styles.currentPlanExpiry}>{currentSubscription.expirationText}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <Text style={styles.sectionDescription}>
              Unlock premium features to enhance your mental wellness journey
            </Text>

            {/* Plan Selection */}
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan?.id === plan.id && styles.selectedPlanCard,
                  isPlanActive(plan.id) && styles.activePlanCard,
                  plan.recommended && styles.recommendedPlanCard
                ]}
                onPress={() => setSelectedPlan(plan)}
                disabled={isPlanActive(plan.id)}
              >
                {plan.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    {plan.period && (
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    )}
                  </View>
                </View>

                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#42a5f5" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {isPlanActive(plan.id) ? (
                  <View style={styles.activePlanBadge}>
                    <Text style={styles.activePlanText}>CURRENT PLAN</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}

            {/* Purchase Button */}
            {selectedPlan && selectedPlan.id !== SUBSCRIPTION_LEVELS.FREE && !isPlanActive(selectedPlan.id) && (
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    Subscribe to {selectedPlan.name}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Additional Information */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Premium subscriptions will automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.
              </Text>
              <Text style={styles.infoText}>
                You can manage your subscriptions in your account settings.
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop:40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#bbb',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentPlanCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#42a5f5',
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  currentPlanExpiry: {
    fontSize: 14,
    color: '#bbb',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPlanCard: {
    borderColor: '#42a5f5',
  },
  activePlanCard: {
    borderColor: '#42a5f5',
    backgroundColor: '#2a2a2a',
  },
  recommendedPlanCard: {
    borderColor: '#42a5f5',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#42a5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#42a5f5',
  },
  planPeriod: {
    fontSize: 14,
    color: '#bbb',
  },
  planDescription: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#ddd',
    fontSize: 14,
  },
  activePlanBadge: {
    backgroundColor: '#42a5f5',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  activePlanText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: '#42a5f5',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 24,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 40,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default SubscriptionScreen; 