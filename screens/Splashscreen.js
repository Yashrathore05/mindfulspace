import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av'; 
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Dashboard');  // Navigate to Dashboard after 5 seconds
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Video 
        source={require('../assets/splash.mp4')}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={true}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            navigation.replace('Dashboard');  // Navigate when video ends
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
