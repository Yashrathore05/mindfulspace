import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkSubscription, SUBSCRIPTION_LEVELS, PREMIUM_FEATURES } from '../services/subscriptionService';
import { auth, firestore } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLANT_SIZE = 120;

// Plant and weather types for different moods
const PLANTS = {
  HAPPY: {
    basic: require('../assets/images/grow_plant.png'), // Using affirmations image for happy plants
    exotic: require('../assets/images/grow_plant.png'), // Premium users get the same for now
  },
  SAD: {
    basic: require('../assets/images/dull.png'), // Using breathing image for sad plants
    exotic: require('../assets/images/dull.png'), // Premium users get the same for now
  },
  CALM: {
    basic: require('../assets/images/zen.png'), // Using welcome image for calm plants
    exotic: require('../assets/images/zen.png'), // Premium users get the same for now
  },
};

// Weather effect particles for premium users
const WEATHER_PARTICLES = {
  HAPPY: 'sunbeam', // Sunbeams for happy mood
  SAD: 'raindrop',  // Raindrops for sad mood
  CALM: 'leaf',     // Floating leaves for calm mood
};

// AI generated affirmations for premium users
const AFFIRMATIONS = {
  HAPPY: [
    "Your joy is like sunshine to your garden of thoughts.",
    "Every moment of happiness waters the roots of your well-being.",
    "Your positive energy is blooming beautifully today."
  ],
  SAD: [
    "Even in cloudy weather, your garden continues to grow.",
    "Sadness is just rain nourishing deeper roots of understanding.",
    "It's okay to rest while your garden of emotions heals."
  ],
  CALM: [
    "Your tranquility creates space for new growth and possibilities.",
    "In stillness, your mind garden finds its perfect balance.",
    "The quiet strength of your calm nurtures every part of you."
  ],
};

// Animated Plant component
const AnimatedPlant = ({ moodType, position, score, isPremium }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef([...Array(5)].map(() => ({
    x: new Animated.Value(Math.random() * PLANT_SIZE),
    y: new Animated.Value(-20),
    opacity: new Animated.Value(0),
  }))).current;
  
  // Get plant type based on mood and premium status
  const plantType = isPremium ? 'exotic' : 'basic';
  const plantImage = PLANTS[moodType]?.[plantType] || PLANTS.CALM.basic;
  
  // Handle plant touch
  const handlePress = () => {
    // Play pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    
    // Show mood-specific message
    let message = "";
    switch(moodType) {
      case 'HAPPY':
        message = "This plant represents a happy day in your journey!";
        break;
      case 'SAD':
        message = "During difficult times, your garden still grows...";
        break;
      case 'CALM':
        message = "A moment of tranquility in your emotional garden.";
        break;
    }
    
    // Display message (with score for premium users)
    if (isPremium) {
      message += `\nMood score: ${score.toFixed(1)}/5`;
    }
    Alert.alert(`${moodType} Plant`, message);
  };
  
  // Setup animations on mount
  useEffect(() => {
    // Plant "breathing" animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Gentle swaying animation for plants
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Weather effect animation for premium users
    if (isPremium) {
      // Loop the weather animation
      Animated.loop(
        Animated.timing(weatherAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
      
      // Animate individual particles
      particleAnims.forEach((anim, i) => {
        const animateParticle = () => {
          // Reset particle
          anim.y.setValue(-20);
          anim.x.setValue(Math.random() * PLANT_SIZE);
          anim.opacity.setValue(0);
          
          // Animate particle falling
          Animated.sequence([
            // Fade in
            Animated.timing(anim.opacity, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }),
            // Fall down
            Animated.parallel([
              Animated.timing(anim.y, {
                toValue: PLANT_SIZE,
                duration: 3000 + Math.random() * 2000,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              // Fade out near the end
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 1000,
                delay: 2000,
                useNativeDriver: true,
              })
            ])
          ]).start(() => {
            // Loop with delay
            setTimeout(animateParticle, Math.random() * 2000);
          });
        };
        
        // Start with staggered delays
        setTimeout(animateParticle, i * 500);
      });
    }
  }, []);
  
  // Rotation interpolation for plant swaying
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg']
  });
  
  return (
    <TouchableOpacity 
      style={[
        styles.plantContainer,
        {
          transform: [
            { translateX: position.x }, 
            { translateY: position.y }
          ]
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Weather effects for premium users */}
      {isPremium && particleAnims.map((anim, i) => {
        // Different particle shapes based on mood
        let particleStyle = {};
        let particleElement = null;
        
        if (moodType === 'HAPPY') {
          // Sunbeams
          particleStyle = {
            width: 4,
            height: 12,
            backgroundColor: '#FFC107',
            borderRadius: 2,
          };
        } else if (moodType === 'SAD') {
          // Raindrops
          particleStyle = {
            width: 3,
            height: 10,
            backgroundColor: '#64B5F6',
            borderRadius: 3,
          };
        } else {
          // Leaves
          particleElement = (
            <Ionicons name="leaf" size={10} color="#4CAF50" />
          );
        }
        
        return (
          <Animated.View 
            key={i}
            style={[
              styles.weatherParticle,
              particleStyle,
              {
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { rotate: moodType === 'CALM' ? '45deg' : '0deg' }
                ],
                opacity: anim.opacity,
              }
            ]}
          >
            {particleElement}
          </Animated.View>
        );
      })}
      
      {/* Animated plant */}
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { rotate }
          ]
        }}
      >
        <Image 
          source={plantImage} 
          style={styles.plantImage} 
        />
      </Animated.View>
      
      {/* Score indicator */}
      {isPremium && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MoodGardenScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [moodData, setMoodData] = useState([]);
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseButtonAnim = useRef(new Animated.Value(1)).current;
  const backgroundParticleAnims = useRef([...Array(15)].map(() => ({
    x: new Animated.Value(Math.random() * SCREEN_WIDTH),
    y: new Animated.Value(Math.random() * 400),
    opacity: new Animated.Value(Math.random() * 0.5),
    size: Math.floor(5 + Math.random() * 10),
  }))).current;

  useEffect(() => {
    checkUserSubscription();
    fetchMoodData();
    
    // Animate background particles
    backgroundParticleAnims.forEach((anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: 0.1 + Math.random() * 0.4,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    
    // Spin animation for empty garden leaf
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Pulsing animation for assessment button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseButtonAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseButtonAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animate affirmation
  useEffect(() => {
    if (currentAffirmation && isPremium) {
      // Reset animation
      fadeAnim.setValue(0);
      translateAnim.setValue(20);
      
      // Start animation sequence
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [currentAffirmation]);

  // Check if user has premium subscription
  const checkUserSubscription = async () => {
    try {
      const subscription = await checkSubscription();
      setIsPremium(
        subscription.level === SUBSCRIPTION_LEVELS.PREMIUM || 
        subscription.level === SUBSCRIPTION_LEVELS.PREMIUM_PLUS
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch mood data from firestore
  const fetchMoodData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) return;
      
      // Query Firestore for mood assessments from the chat
      const conversationsRef = collection(firestore, 'conversations');
      const userConversationsQuery = query(
        conversationsRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(userConversationsQuery);
      
      // Extract conversations with mood data
      let moodEntries = [];
      
      // Process each conversation
      for (const doc of conversationsSnapshot.docs) {
        const conversationData = doc.data();
        const conversationId = doc.id;
        
        // Look for conversations with title containing 'Mood' or 'Assessment'
        if (conversationData.title?.includes('Mood') || conversationData.title?.includes('Assessment')) {
          // Get messages from this conversation using the main messages collection
          const messagesQuery = query(
            collection(firestore, 'messages'),
            where('conversationId', '==', conversationId),
            where('type', '==', 'answer'),
            orderBy('timestamp', 'asc')
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          
          // Find mood assessment message
          for (const messageDoc of messagesSnapshot.docs) {
            const messageData = messageDoc.data();
            if (messageData.content?.includes('mental health score')) {
              // Extract mood score
              const scoreMatch = messageData.content.match(/score is (\d+\.\d+)\/5/);
              if (scoreMatch && scoreMatch[1]) {
                const score = parseFloat(scoreMatch[1]);
                
                // Map score to mood type
                let moodType = 'SAD';
                if (score >= 4) {
                  moodType = 'HAPPY';
                } else if (Math.floor(score) === 3) {
                  moodType = 'CALM'; // Only calm for score 3.0
                }
                
                moodEntries.push({
                  id: messageDoc.id,
                  score,
                  moodType,
                  timestamp: messageData.timestamp?.toDate() || new Date(),
                  // Generate random position for the plant in the garden
                  position: {
                    x: Math.random() * (SCREEN_WIDTH - PLANT_SIZE),
                    y: 50 + Math.random() * 300, // Random height between 50-350
                  }
                });
                
                // If this is the latest assessment, set the current affirmation
                if (isPremium && moodEntries.length === 1) {
                  generateAffirmation(moodType);
                }
                
                break;
              }
            }
          }
        }
      }
      
      setMoodData(moodEntries);
      
      // If no mood entries were found but we're already done loading,
      // make sure isPremium is properly set by checking subscription
      if (moodEntries.length === 0) {
        checkUserSubscription();
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
      Alert.alert('Error', 'Failed to load your mood garden. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI-powered affirmation based on mood
  const generateAffirmation = (moodType) => {
    if (!isPremium) return;
    
    // For a real application, this would call an AI service
    // For now, we'll select from predefined affirmations
    const affirmations = AFFIRMATIONS[moodType] || AFFIRMATIONS.CALM;
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    setCurrentAffirmation(affirmations[randomIndex]);
  };

  // Get background gradient colors based on mood type
  const getBackgroundColors = (moodType) => {
    switch(moodType) {
      case 'HAPPY':
        return ['#4CAF50', '#8BC34A']; // Green for happy
      case 'SAD':
        return ['#2196F3', '#64B5F6']; // Blue for sad/rainy
      case 'CALM':
        return ['#FFA726', '#FFCC80']; // Orange for calm/zen
      default:
        return ['#1E293B', '#0F172A']; // Default app gradient
    }
  };

  // Get the most common mood for the garden background
  const getMostCommonMood = () => {
    if (!moodData.length) return 'CALM';
    
    const moodCounts = moodData.reduce((counts, entry) => {
      counts[entry.moodType] = (counts[entry.moodType] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Premium subscription prompt
  const showPremiumPrompt = () => {
    Alert.alert(
      'Premium Feature',
      'Upgrade to premium to unlock exotic plants, weather effects, and AI-generated affirmations in your mood garden!',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionScreen') }
      ]
    );
  };

  // Render animated background particles
  const renderBackgroundParticles = () => {
    const dominantMood = getMostCommonMood();
    let particleColor = '#FFFFFF';
    
    // Set particle color based on mood
    switch(dominantMood) {
      case 'HAPPY':
        particleColor = '#FFC107'; // Yellow for happy/sunny
        break;
      case 'SAD':
        particleColor = '#90CAF9'; // Light blue for sad/rainy
        break;
      case 'CALM':
        particleColor = '#A5D6A7'; // Light green for calm/zen
        break;
    }
    
    return backgroundParticleAnims.map((anim, index) => (
      <Animated.View
        key={`bg-particle-${index}`}
        style={[
          styles.backgroundParticle,
          {
            width: anim.size,
            height: anim.size,
            backgroundColor: particleColor,
            opacity: anim.opacity,
            transform: [
              { translateX: anim.x },
              { translateY: anim.y }
            ]
          }
        ]}
      />
    ));
  };

  return (
    <LinearGradient 
      colors={getBackgroundColors(getMostCommonMood())} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Mood Garden</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Growing your garden...</Text>
          </View>
        ) : (
          <>
            {/* Premium badge or upgrade prompt */}
            <TouchableOpacity 
              style={styles.premiumBadge}
              onPress={isPremium ? null : showPremiumPrompt}
            >
              <Ionicons 
                name={isPremium ? "leaf" : "lock-closed"} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.premiumText}>
                {isPremium ? 'Premium Garden' : 'Upgrade to Premium'}
              </Text>
            </TouchableOpacity>

            {/* AI-generated affirmation for premium users */}
            {isPremium && currentAffirmation && (
              <Animated.View 
                style={[
                  styles.affirmationContainer,
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: translateAnim }] 
                  }
                ]}
              >
                <Text style={styles.affirmationText}>
                  "{currentAffirmation}"
                </Text>
              </Animated.View>
            )}

            {/* Garden View with animated background */}
            <View style={styles.gardenContainer}>
              {/* Animated background particles */}
              {renderBackgroundParticles()}
              
              {/* Plants */}
              {moodData.length > 0 ? (
                moodData.map((entry, index) => (
                  <AnimatedPlant
                    key={entry.id || index}
                    moodType={entry.moodType}
                    position={entry.position}
                    score={entry.score}
                    isPremium={isPremium}
                  />
                ))
              ) : (
                <View style={styles.emptyGardenContainer}>
                  <Animated.View
                    style={{
                      transform: [
                        { 
                          rotate: spinAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg']
                          }) 
                        }
                      ]
                    }}
                  >
                    <Ionicons name="leaf" size={70} color="#fff" />
                  </Animated.View>
                  <Text style={styles.emptyGardenText}>
                    Your garden is empty! Complete mood assessments to grow plants.
                  </Text>
                  <Animated.View
                    style={{
                      transform: [{ scale: pulseButtonAnim }]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.assessButton}
                      onPress={() => navigation.navigate('ChatbotScreen')}
                    >
                      <Text style={styles.assessButtonText}>Take Mood Assessment</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.assessButtonIcon} />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </View>

            {/* Garden Legend */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Garden Guide</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Happy = Blooming Flowers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.legendText}>Sad = Rainy Days</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FFA726' }]} />
                <Text style={styles.legendText}>Calm = Zen Garden</Text>
              </View>
            </View>
          </>
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
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 15,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(66, 165, 245, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 15,
  },
  premiumText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  affirmationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  affirmationText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  gardenContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    minHeight: 400,
  },
  backgroundParticle: {
    position: 'absolute',
    borderRadius: 50,
  },
  emptyGardenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyGardenText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
  },
  assessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 10,
  },
  assessButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  assessButtonIcon: {
    marginLeft: 8,
  },
  plantContainer: {
    position: 'absolute',
    width: PLANT_SIZE,
    height: PLANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  weatherParticle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legendContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    margin: 15,
    padding: 15,
  },
  legendTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  legendText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default MoodGardenScreen; 