import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';

// Subscription levels
export const SUBSCRIPTION_LEVELS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PREMIUM_PLUS: 'premium_plus'
};

// Premium features
export const PREMIUM_FEATURES = {
  AI_THERAPY: 'ai_therapy',
  ADVANCED_ASSESSMENT: 'advanced_assessment',
  CRISIS_PROTOCOL: 'crisis_protocol',
  UNLIMITED_CHATS: 'unlimited_chats',
  AI_THERAPY_PLUS: 'ai_therapy_plus'
};

// Check if user has active subscription
export const checkSubscription = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return {
        level: SUBSCRIPTION_LEVELS.FREE,
        expiresAt: null,
        features: []
      };
    }
    
    const userData = userDoc.data();
    
    if (!userData.subscription) {
      return {
        level: SUBSCRIPTION_LEVELS.FREE,
        expiresAt: null,
        features: []
      };
    }
    
    // Check if subscription is expired
    const now = new Date();
    const expiresAt = userData.subscription.expiresAt?.toDate();
    
    if (expiresAt && now > expiresAt) {
      return {
        level: SUBSCRIPTION_LEVELS.FREE,
        expiresAt: null,
        features: []
      };
    }
    
    return userData.subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      level: SUBSCRIPTION_LEVELS.FREE,
      expiresAt: null,
      features: []
    };
  }
};

// Check if specific feature is available to user
export const hasFeatureAccess = async (featureName) => {
  try {
    const subscription = await checkSubscription();
    
    // Premium Plus has access to all features
    if (subscription.level === SUBSCRIPTION_LEVELS.PREMIUM_PLUS) {
      return true;
    }
    
    // Check if feature is in user's feature list
    return subscription.features.includes(featureName);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};

// Purchase a subscription
export const purchaseSubscription = async (level, durationMonths = 1) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.setMonth(now.getMonth() + durationMonths));
    
    // Set features based on subscription level
    let features = [];
    
    if (level === SUBSCRIPTION_LEVELS.PREMIUM) {
      features = [
        PREMIUM_FEATURES.AI_THERAPY,
        PREMIUM_FEATURES.ADVANCED_ASSESSMENT
      ];
    } else if (level === SUBSCRIPTION_LEVELS.PREMIUM_PLUS) {
      features = [
        PREMIUM_FEATURES.AI_THERAPY,
        PREMIUM_FEATURES.ADVANCED_ASSESSMENT,
        PREMIUM_FEATURES.CRISIS_PROTOCOL,
        PREMIUM_FEATURES.UNLIMITED_CHATS
      ];
    }
    
    // Create subscription object
    const subscription = {
      level,
      purchasedAt: serverTimestamp(),
      expiresAt: expiresAt,
      features,
      active: true
    };
    
    // Update user document
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        subscription
      });
    } else {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        createdAt: serverTimestamp(),
        subscription
      });
    }
    
    return subscription;
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

// Cancel a subscription
export const cancelSubscription = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const userDocRef = doc(firestore, 'users', user.uid);
    
    await updateDoc(userDocRef, {
      'subscription.active': false,
      'subscription.canceledAt': serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Get subscription details for display
export const getSubscriptionDetails = async () => {
  try {
    const subscription = await checkSubscription();
    
    // Format expiration date
    let expirationText = 'No active subscription';
    
    if (subscription.expiresAt) {
      const expiresDate = new Date(subscription.expiresAt);
      expirationText = `Expires on ${expiresDate.toLocaleDateString()}`;
    }
    
    // Get subscription name
    let subscriptionName = 'Free Plan';
    
    if (subscription.level === SUBSCRIPTION_LEVELS.PREMIUM) {
      subscriptionName = 'Premium Plan';
    } else if (subscription.level === SUBSCRIPTION_LEVELS.PREMIUM_PLUS) {
      subscriptionName = 'Premium+ Plan';
    }
    
    return {
      name: subscriptionName,
      level: subscription.level,
      expirationText,
      isActive: subscription.level !== SUBSCRIPTION_LEVELS.FREE,
      features: subscription.features
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return {
      name: 'Free Plan',
      level: SUBSCRIPTION_LEVELS.FREE,
      expirationText: 'No active subscription',
      isActive: false,
      features: []
    };
  }
}; 