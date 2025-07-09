import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

const Breathing = () => {
  const navigation = useNavigation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const searchAnim = useState(new Animated.Value(0))[0];

  const videoRef = useRef(null);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnim, {
      toValue: searchVisible ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const openFullscreen = async () => {
    if (videoRef.current) {
      await videoRef.current.presentFullscreenPlayer();
    }
  };

  return (
    <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Breathing Techniques</Text>
          </View>

          <View style={styles.card}>
            <Image source={require('../assets/breath.png')} style={styles.cardImage} />
            <Text style={styles.cardText}>
              Proper breathing techniques can reduce stress, increase oxygen levels, and improve overall health.
            </Text>
          </View>

          {/* Video Section */}
                    <Text style={styles.sectionTitle}>🌟 Featured Video of the Week</Text>
                    <View style={styles.videoContainer}>
                      <Video
                        ref={videoRef}
                        source={require('../assets/Breathing.mp4')}
                        style={styles.video}
                        shouldPlay
                        isLooping
                        useNativeControls
                        isMuted={isMuted}
                        resizeMode="contain"
                      />
                      {/* Mute Button */}
                      <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                        <Ionicons
                          name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                          size={30}
                          color="#FFF"
                        />
                        <Text style={styles.muteText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                      </TouchableOpacity>
                      {/* Fullscreen Button */}
                      <TouchableOpacity onPress={openFullscreen} style={styles.fullscreenButton}>
                        <Ionicons name="expand-outline" size={30} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    {/* Fullscreen Message */}
                    <Text style={styles.fullscreenText}>📺 Open in fullscreen mode for better viewing experience.</Text>
           {/* Article Section */}
                    <View style={styles.card}>
                      <Text style={styles.sectionTitle}>Why Practice Breathing?</Text>
                      <Text style={styles.articleText}>
                      Controlled breathing helps calm the nervous system, reduce anxiety, and enhance focus. Deep breathing exercises can improve lung capacity and promote relaxation.
                      </Text>
                    </View>

          <Text style={styles.sectionTitle}>Breathing FAQ</Text>
          <View style={styles.faqContainer}>
            {[
              { question: '1. What are breathing techniques?', answer: 'Breathing techniques involve controlled patterns of inhaling and exhaling to enhance relaxation and focus.' },
              { question: '2. How often should I practice?', answer: 'Practicing for 5-10 minutes daily can provide significant benefits to mental and physical health.' },
              { question: '3. Can breathing help with anxiety?', answer: 'Yes! Deep breathing activates the parasympathetic nervous system, reducing stress and anxiety.' },
              { question: '4. What is diaphragmatic breathing?', answer: 'It’s a technique where you engage your diaphragm fully to take deep breaths, improving oxygen flow and reducing tension.' },
              { question: '5. Can breathing exercises improve sleep?', answer: 'Absolutely! Slow breathing before bed can calm the mind and promote better sleep quality.' },
            ].map((faq, index) => (
              <TouchableOpacity key={index} style={styles.faqCard} onPress={() => toggleFAQ(index)}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFAQ === index && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Expert Views</Text>
          <View style={styles.expertCard}>
            <Image source={require('../assets/doctor1.png')} style={styles.expertImage} />
            <Text style={styles.expertName}>Dr. Michael Lee</Text>
            <Text style={styles.expertComment}>
              "Breathing exercises are one of the simplest yet most effective ways to improve overall well-being. A few minutes of controlled breathing can transform your energy and focus."
            </Text>
          </View>
          <View style={styles.expertCard}>
            <Image source={require('../assets/doctor2.png')} style={styles.expertImage} />
            <Text style={styles.expertName}>Dr. Sarah Johnson</Text>
            <Text style={styles.expertComment}>
              "I recommend deep breathing techniques to my patients dealing with stress and anxiety. The results are remarkable in improving mental clarity and relaxation."
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>

      <View style={styles.navbar}>
        {[
          { icon: 'home-outline', label: 'Home', route: 'Dashboard' },
          { icon: 'chatbubble-outline', label: 'Chat', route: 'ChatbotScreen' },
          { icon: 'search-outline', label: 'Search', action: toggleSearch },
          { icon: 'calendar', label: 'Bookings', route: 'BookingScreen' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.navItem} onPress={() => (item.route ? navigation.navigate(item.route) : item.action())}>
            <Ionicons name={item.icon} size={22} color="#9CA3AF" />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#9CA3AF" value={searchInput} onChangeText={setSearchInput} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  safeArea: { flex: 1, paddingHorizontal: 10 },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
  },
  scrollContainer: { paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 30, color: '#E2E8F0', fontWeight: '600' },
  card: { backgroundColor: '#1E40AF', borderRadius: 15, padding: 20, marginBottom: 35, alignItems: 'center' },
  cardImage: { width: 180, height: 180, marginBottom: 15, borderRadius: 10 },
  cardText: { color: '#F9FAFB', fontSize: 16, textAlign: 'center', },
  sectionTitle: { color: '#F9FAFB', fontSize: 20, marginVertical: 15,  },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, marginBottom: 10, backgroundColor: '#000', borderRadius: 10 },
  video: { width: '100%', height: '100%', borderRadius: 10 },
  muteButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 50 },
  muteText: { color: '#FFF', marginTop: 5, fontSize: 12 },
  fullscreenButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 50 },
  fullscreenText: { textAlign: 'center', color: '#9CA3AF', marginBottom: 60, fontSize: 14 },
  faqContainer: { marginBottom: 25 },
  faqCard: { backgroundColor: '#1E40AF', borderRadius: 10, padding: 15, marginBottom: 10 },
  faqQuestion: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  faqAnswer: { color: '#F9FAFB', fontSize: 14, marginTop: 10 },
  articleText: { color: '#F9FAFB', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  expertCard: { backgroundColor: '#374151', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  expertImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  expertName: { fontSize: 18, color: '#F9FAFB', fontWeight: '600' },
  expertComment: { color: '#A5B4FC', textAlign: 'center', fontSize: 14 },
});

export default Breathing;
