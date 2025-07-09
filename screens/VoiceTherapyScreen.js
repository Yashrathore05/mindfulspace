import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { 
  createConversation, 
  saveMessage, 
  getConversationMessages 
} from '../services/chatService';
import { 
  PREMIUM_FEATURES, 
  hasFeatureAccess 
} from '../services/subscriptionService';
import * as FileSystem from 'expo-file-system';

// Therapy approaches (same as TherapySessionScreen)
const THERAPY_APPROACHES = [
  { id: 'cbt', name: 'Cognitive Behavioral Therapy', 
    description: 'Focuses on changing negative thought patterns and behaviors' },
  { id: 'mindfulness', name: 'Mindfulness-Based Therapy', 
    description: 'Develops awareness and acceptance of present moment experiences' },
  { id: 'act', name: 'Acceptance & Commitment Therapy', 
    description: 'Emphasizes psychological flexibility and value-based actions' },
];

const VoiceTherapyScreen = ({ navigation, route }) => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionApproach, setSessionApproach] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiAudio, setAiAudio] = useState(null);
  const [isAiPlaying, setIsAiPlaying] = useState(false);
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [manualInputText, setManualInputText] = useState('');
  
  // Ref to store resolve function for text input modal
  const textInputResolveRef = useRef(null);
  
  const chatScrollRef = useRef(null);
  const conversationId = route.params?.conversationId;
  const API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; // Google Gemini API key
  // Deepgram API key format should be a long string without dashes
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY_HERE";

  // Check premium access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        // Request audio permissions
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        // Check for premium+ access only
        const hasAccess = await hasFeatureAccess(PREMIUM_FEATURES.AI_THERAPY_PLUS);
        
        if (!hasAccess) {
          setShowPaywallModal(true);
        } else if (conversationId) {
          // Load existing conversation
          await loadConversation();
        } else {
          // New session - show therapy approach selection
          setShowApproachModal(true);
        }
      } catch (error) {
        console.error('Error initializing voice therapy:', error);
        Alert.alert('Error', 'Failed to initialize voice therapy. Please check microphone permissions.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
    
    // Cleanup function
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (aiAudio) {
        aiAudio.unloadAsync();
      }
    };
  }, [conversationId]);

  // Load existing conversation
  const loadConversation = async () => {
    try {
      const messages = await getConversationMessages(conversationId);
      if (messages && messages.length > 0) {
        setChatHistory(messages.map(msg => ({
          type: msg.type,
          content: msg.content,
          audioUrl: msg.audioUrl || null
        })));
        
        setSessionActive(true);
        
        // Try to extract session approach from messages
        const systemMessage = messages.find(msg => 
          msg.type === 'system' && msg.content.includes('approach:')
        );
        
        if (systemMessage) {
          const approachMatch = systemMessage.content.match(/approach: (\w+)/i);
          if (approachMatch && approachMatch[1]) {
            setSessionApproach(approachMatch[1]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading therapy session:', error);
      Alert.alert('Error', 'Failed to load therapy session');
    }
  };

  // Start a new therapy session with selected approach
  const startTherapySession = async (approach) => {
    try {
      setLoading(true);
      setSessionApproach(approach);
      
      // Create a new conversation
      const therapyType = THERAPY_APPROACHES.find(a => a.id === approach)?.name || 'Voice Therapy';
      const newConversationId = await createConversation(`Voice ${therapyType} Session`);
      
      // Save system message with session details
      const systemMessage = `AI Voice Therapy Session\napproach: ${approach}\nstarted: ${new Date().toISOString()}`;
      await saveMessage(newConversationId, systemMessage, 'system');
      
      // Generate initial therapist message
      setProcessing(true);
      const initialPrompt = generateInitialPrompt(approach);
      
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001-tuning:generateContent?key=${API_KEY}`,
        method: "post",
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          contents: [{
            parts: [{
              text: initialPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }
      });
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        // Set as first message
        setChatHistory([{ type: 'answer', content: aiResponse }]);
        
        // Save to database
        await saveMessage(newConversationId, aiResponse, 'answer');
        
        // Convert text to speech
        await speakAiResponse(aiResponse);
        
        // Update route params to include conversationId
        navigation.setParams({ conversationId: newConversationId });
      }
      
      setSessionActive(true);
    } catch (error) {
      console.error('Error starting therapy session:', error);
      Alert.alert('Error', 'Failed to start therapy session');
    } finally {
      setLoading(false);
      setProcessing(false);
      setShowApproachModal(false);
    }
  };

  // Generate initial prompt for therapy session
  const generateInitialPrompt = (approach) => {
    let prompt = 'You are an AI-powered mental health assistant with expertise in ';
    
    switch (approach) {
      case 'cbt':
        prompt += `Cognitive Behavioral Therapy (CBT). Conduct a therapy session using CBT techniques.
        Start by introducing yourself as a CBT-focused AI therapist and explain briefly how CBT works.
        Ask open-ended questions to understand what brings the user to therapy today.
        Help identify negative thought patterns and guide the user to challenge them.
        Use techniques like cognitive restructuring, behavioral activation, and structured problem-solving.
        Be empathetic, non-judgmental, and supportive throughout the session.`;
        break;
      case 'mindfulness':
        prompt += `Mindfulness-Based Therapy. Conduct a mindfulness-oriented therapy session.
        Start by introducing yourself as a mindfulness-focused AI therapist and explain briefly how mindfulness can help.
        Begin with a brief centering exercise to help the user connect with the present moment.
        Ask about their current experience and encourage non-judgmental awareness.
        Offer mindfulness techniques applicable to their situation.
        Be gentle, present, and create a space of acceptance.`;
        break;
      case 'act':
        prompt += `Acceptance and Commitment Therapy (ACT). Conduct a therapy session using ACT principles.
        Start by introducing yourself as an ACT-focused AI therapist and explain briefly how ACT works.
        Help the user identify their values and committed actions that align with those values.
        Teach psychological flexibility skills and facilitate acceptance of difficult thoughts and feelings.
        Use metaphors and experiential exercises to illustrate ACT concepts.
        Be compassionate, present, and focused on workability rather than "feeling better".`;
        break;
      default:
        prompt += `various evidence-based therapy approaches. Conduct a supportive therapy session.
        Start by introducing yourself and asking what brings the user to therapy today.
        Use active listening, empathy, and open-ended questions to explore their concerns.
        Offer appropriate therapeutic techniques based on what you learn.
        Be supportive, non-judgmental, and focused on the user's wellbeing.`;
    }
    
    prompt += `\n\nThis is a premium AI voice therapy feature, so provide concise but impactful therapeutic responses.
    Focus on being helpful and supportive, but keep responses under 3-4 paragraphs for better speech synthesis.
    Begin the session now with your introduction and first question.`;
    
    return prompt;
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Clear any existing recording
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      if (recordingUri) {
        setRecordingUri(null);
      }
      
      console.log('Starting recording...');
      
      // Use low quality preset which is better for speech recognition
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  // Play recorded audio
  const playRecording = async (audioUri = null) => {
    try {
      // Use provided audioUri or the current recordingUri
      const uri = audioUri || recordingUri;
      
      if (!uri) {
        console.error('No audio URI to play');
        return;
      }
      
      // Stop currently playing audio
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (err) {
          console.log('Error stopping previous sound', err);
        }
      }
      
      // Reset sound state
      setSound(null);
      
      console.log('Playing audio from URI:', uri);
      
      // Create and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play the recording. The audio file may be corrupted.');
      setIsPlaying(false);
    }
  };

  // Text-to-speech conversion for AI responses
  const speakAiResponse = async (text) => {
    try {
      // Stop any currently playing audio
      if (aiAudio) {
        try {
          await aiAudio.stopAsync();
          await aiAudio.unloadAsync();
        } catch (err) {
          console.log('Error stopping previous audio', err);
        }
      }
      
      // Reset audio state
      setAiAudio(null);
      
      // Use Expo Speech API - completely free
      try {
        const Speech = await import('expo-speech');
        setIsAiPlaying(true);
        
        // Create a dummy audio object for state management that mimics the Audio.Sound interface
        const dummyAudio = { 
          unloadAsync: function() {
            Speech.stop();
            return Promise.resolve();
          },
          stopAsync: function() {
            Speech.stop();
            return Promise.resolve();
          },
          playAsync: function() {
            // Will re-start speech if needed
            if (!isAiPlaying) {
              Speech.speak(text, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.9
              });
            }
            return Promise.resolve();
          },
          setStatusAsync: function() { 
            return Promise.resolve(); 
          },
          getStatusAsync: function() { 
            return Promise.resolve({ isPlaying: isAiPlaying }); 
          },
          setOnPlaybackStatusUpdate: function() {}
        };
        setAiAudio(dummyAudio);
        
        // Speak the text
        await Speech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsAiPlaying(false),
          onError: (error) => {
            console.error('Speech error:', error);
            setIsAiPlaying(false);
          }
        });
      } catch (speechErr) {
        console.error('Speech synthesis failed:', speechErr);
        Alert.alert("Speech Unavailable", "The AI's message is displayed in text form. Speech synthesis is currently unavailable.");
        setIsAiPlaying(false);
      }
    } catch (error) {
      console.error('Failed to speak AI response:', error);
      Alert.alert('Error', 'Failed to generate speech. Please read the text response instead.');
      setIsAiPlaying(false);
    }
  };

  // Stop AI speech
  const stopAiSpeech = async () => {
    try {
      if (aiAudio) {
        try {
          await aiAudio.stopAsync();
          await aiAudio.unloadAsync();
          setAiAudio(null);
          setIsAiPlaying(false);
        } catch (err) {
          console.log('Error stopping AI speech', err);
        }
      } else {
        try {
          const Speech = await import('expo-speech');
          Speech.stop();
        } catch (err) {
          console.log('Error stopping speech module', err);
        }
        setIsAiPlaying(false);
      }
    } catch (error) {
      console.error('Failed to stop AI speech:', error);
    }
  };

  // Play AI audio response
  const playAiResponse = async (index) => {
    try {
      // Get the message content
      const message = chatHistory[index];
      if (!message || !message.content) {
        console.error('Cannot find message content at index', index);
        return;
      }
      
      // If already playing this response, stop it
      if (isAiPlaying) {
        await stopAiSpeech();
        return;
      }
      
      // Stop any currently playing audio
      if (aiAudio) {
        try {
          await aiAudio.stopAsync();
          await aiAudio.unloadAsync();
        } catch (err) {
          console.log('Error stopping previous audio', err);
        }
      }
      
      // Reset audio state
      setAiAudio(null);
      
      // Call to generate audio from the message content
      await speakAiResponse(message.content);
    } catch (error) {
      console.error('Failed to play AI response:', error);
      Alert.alert('Error', 'Failed to play audio response. Please try again.');
    }
  };

  // Handle text input submission
  const handleTextInputSubmit = () => {
    if (textInputResolveRef.current) {
      textInputResolveRef.current(manualInputText);
      textInputResolveRef.current = null;
    }
    setShowTextInputModal(false);
  };
  
  // Handle text input cancellation
  const handleTextInputCancel = () => {
    if (textInputResolveRef.current) {
      textInputResolveRef.current(null);
      textInputResolveRef.current = null;
    }
    setShowTextInputModal(false);
  };

  // Try different methods for speech-to-text conversion
  const tryDeepgramAPI = async (audioUri) => {
    // Get file info for debugging
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    console.log('Audio file details:', fileInfo);
    
    try {
      console.log('Attempting direct fetch API call to Deepgram...');
      
      // Upload the file directly using Expo's FileSystem uploadAsync
      // This method properly sends the binary audio data to Deepgram
      // We're also using LOW_QUALITY recording which is better for speech recognition
      const uploadResult = await FileSystem.uploadAsync(
        'https://api.deepgram.com/v1/listen?model=nova-2&language=en-US&punctuate=true',
        audioUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'audio/m4a'
          }
        }
      );
      
      console.log('Deepgram response status:', uploadResult.status);
      
      if (uploadResult.status !== 200) {
        console.error('Deepgram API error details:', uploadResult.body);
        
        if (uploadResult.status === 401) {
          console.error('Authentication error with Deepgram API. Check your API key.');
          throw new Error('Deepgram authentication failed. Please check your API key.');
        }
        
        throw new Error(`Deepgram API error: ${uploadResult.status}`);
      }
      
      // Parse response
      const data = JSON.parse(uploadResult.body);
      console.log('Deepgram response received successfully');
      
      // Extract transcript
      if (data?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        return data.results.channels[0].alternatives[0].transcript.trim();
      }
      
      throw new Error('No transcript found in response');
    } catch (error) {
      console.error('Deepgram API error:', error.message);
      throw error;
    }
  };

  // Speech-to-text conversion
  const convertSpeechToText = async () => {
    if (!recordingUri) return;
    
    try {
      setProcessing(true);
      setProcessingStatus('Processing your message...');
      
      let transcribedText = '';
      
      try {
        // Verify recording exists
        const fileInfo = await FileSystem.getInfoAsync(recordingUri);
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error('Recording is invalid or empty');
        }
        
        // Try Deepgram API
        setProcessingStatus('Analyzing speech...');
        transcribedText = await tryDeepgramAPI(recordingUri);
        console.log('Successfully transcribed:', transcribedText);
      } catch (error) {
        console.log('Speech recognition failed:', error.message);
        setProcessingStatus('Speech recognition failed. Please type your message.');
        
        // Fall back to manual input
        transcribedText = await new Promise((resolve) => {
          textInputResolveRef.current = resolve;
          setManualInputText('');
          setShowTextInputModal(true);
        });
        
        // If manual input was canceled, use a fallback
        if (!transcribedText) {
          const defaultResponses = {
            'cbt': "I notice I tend to catastrophize situations and assume the worst.",
            'mindfulness': "I'm finding it hard to stay present with my thoughts and feelings.",
            'act': "I struggle with accepting difficult emotions without trying to avoid them.",
            'initial': "I've been feeling stressed and anxious lately."
          };
          
          const approach = sessionApproach || 'initial';
          transcribedText = defaultResponses[approach] || defaultResponses.initial;
        }
      }
      
      // Add message to chat
      setChatHistory(prev => [...prev, {
        type: 'question',
        content: transcribedText,
        audioUrl: recordingUri
      }]);
      
      // Save message
      if (conversationId) {
        await saveMessage(conversationId, transcribedText, 'question', recordingUri);
      }
      
      // Generate AI response
      setProcessingStatus('Generating AI response...');
      await processUserInput(transcribedText);
      
      // Clear recording URI
      setRecordingUri(null);
    } catch (error) {
      console.error('Error processing message:', error);
      Alert.alert('Error', 'Failed to process your message. Please try again.');
    } finally {
      setProcessingStatus('');
      setProcessing(false);
    }
  };
  
  // Process user input and generate AI response
  const processUserInput = async (userInput) => {
    try {
      // Create therapy-focused prompt based on approach
      let therapyPrompt = `You are continuing an AI therapy session using `;
      
      switch (sessionApproach) {
        case 'cbt':
          therapyPrompt += `Cognitive Behavioral Therapy (CBT) techniques. 
          Remember to identify negative thought patterns, help challenge distorted thinking,
          and suggest practical cognitive and behavioral strategies. 
          Stay empathetic and supportive throughout.`;
          break;
        case 'mindfulness':
          therapyPrompt += `Mindfulness-Based Therapy techniques.
          Focus on present-moment awareness, non-judgmental acceptance,
          and mindfulness practices relevant to the user's situation.
          Maintain a gentle, present, and accepting tone.`;
          break;
        case 'act':
          therapyPrompt += `Acceptance and Commitment Therapy (ACT) principles.
          Help the user develop psychological flexibility, clarify their values,
          and commit to actions aligned with those values.
          Use ACT-consistent language about acceptance and committed action.`;
          break;
        default:
          therapyPrompt += `evidence-based therapy techniques appropriate to the user's needs.
          Maintain therapeutic presence, empathy, and focus on their wellbeing.`;
      }
      
      therapyPrompt += `\n\nThis is a premium AI voice therapy feature, so provide concise but impactful therapeutic responses.
      Keep responses under 3-4 paragraphs for better speech synthesis.
      The user's most recent message is: "${userInput}"
      
      Remember previous context from the conversation and respond as a skilled therapist would.`;
      
      console.log('Sending request to Gemini API...');
      
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001-tuning:generateContent?key=${API_KEY}`,
        method: "post",
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          contents: [{
            parts: [{
              text: therapyPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }
      });
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        // Add to chat
        setChatHistory(prev => [...prev, { type: 'answer', content: aiResponse }]);
        
        // Save to database
        if (conversationId) {
          await saveMessage(conversationId, aiResponse, 'answer');
        }
        
        // Convert text to speech
        await speakAiResponse(aiResponse);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Error processing user input:', error);
      
      // Create a fallback response if API fails
      const fallbackResponse = "I'm having trouble processing your message right now. Could you try again in a moment?";
      
      // Add fallback response to chat
      setChatHistory(prev => [...prev, { type: 'answer', content: fallbackResponse }]);
      
      // Save fallback to database
      if (conversationId) {
        await saveMessage(conversationId, fallbackResponse, 'answer');
      }
      
      Alert.alert('Error', 'There was an issue generating a response. Please try again.');
    }
  };

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [chatHistory, processing]);

  return (
    <LinearGradient colors={['#1c1c1c', '#2c2c2c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#42a5f5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {sessionApproach ? 
              `Voice ${THERAPY_APPROACHES.find(a => a.id === sessionApproach)?.name || 'Therapy'}` 
              : 'Voice Therapy Session'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42a5f5" />
            <Text style={styles.loadingText}>Preparing your voice therapy session...</Text>
          </View>
        ) : (
          <>
            {/* Chat Area */}
            <ScrollView 
              ref={chatScrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
            >
              {!sessionActive && !showApproachModal && !showPaywallModal ? (
                <View style={styles.welcomeContainer}>
                  <Image 
                    source={require('../assets/logo1.png')} 
                    style={styles.welcomeImage}
                    defaultSource={require('../assets/icon.png')}
                    onError={(e) => console.log('Image loading error', e.nativeEvent.error)}
                  />
                  <Text style={styles.welcomeTitle}>Voice Therapy Session</Text>
                  <Text style={styles.welcomeText}>
                    Experience a natural conversation with your AI therapist using voice interaction.
                    Speak your thoughts and listen to therapeutic guidance.
                  </Text>
                  <Text style={styles.premiumText}>Premium+ Feature</Text>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => setShowApproachModal(true)}
                  >
                    <Text style={styles.startButtonText}>Start Voice Session</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {chatHistory.map((message, index) => (
                    message.type !== 'system' && (
                      <View 
                        key={index} 
                        style={[
                          styles.messageBubble,
                          message.type === 'question' ? styles.userBubble : styles.therapistBubble
                        ]}
                      >
                        <Text 
                          style={message.type === 'question' ? styles.userMessageText : styles.therapistMessageText}
                        >
                          {message.content}
                        </Text>
                        
                        {/* Audio playback controls */}
                        {message.type === 'question' && message.audioUrl && (
                          <TouchableOpacity 
                            style={styles.audioButton}
                            onPress={() => playRecording(message.audioUrl)}
                          >
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Text style={styles.audioButtonText}>Play Recording</Text>
                          </TouchableOpacity>
                        )}
                        
                        {message.type === 'answer' && (
                          <TouchableOpacity 
                            style={styles.audioButton}
                            onPress={() => playAiResponse(index)}
                          >
                            <Ionicons 
                              name={isAiPlaying ? "stop-circle" : "volume-high"} 
                              size={24} 
                              color="#fff" 
                            />
                            <Text style={styles.audioButtonText}>
                              {isAiPlaying ? "Stop" : "Listen"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  ))}
                  
                  {processing && (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="small" color="#42a5f5" />
                      <Text style={styles.processingText}>
                        {processingStatus || 'Processing your message...'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            
            {/* Voice Input Area - only show when session is active */}
            {sessionActive && (
              <View style={styles.voiceInputContainer}>
                {recordingUri ? (
                  // Recording complete, show playback and send controls
                  <View style={styles.recordingCompleteContainer}>
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => playRecording()}
                      disabled={isPlaying}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause-circle" : "play-circle"} 
                        size={40} 
                        color="#42a5f5" 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.recordingControls}>
                      <TouchableOpacity 
                        style={styles.redoButton}
                        onPress={startRecording}
                      >
                        <Ionicons name="refresh" size={24} color="#ff6b6b" />
                        <Text style={styles.redoButtonText}>Redo</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.sendRecordingButton}
                        onPress={convertSpeechToText}
                        disabled={processing}
                      >
                        <Ionicons name="send" size={24} color="#fff" />
                        <Text style={styles.sendRecordingText}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // No recording yet, show record button
                  <TouchableOpacity 
                    style={[styles.recordButton, isRecording && styles.recordingActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                    disabled={processing}
                  >
                    <Ionicons 
                      name={isRecording ? "stop-circle" : "mic"} 
                      size={isRecording ? 60 : 40} 
                      color={isRecording ? "#ff6b6b" : "#42a5f5"} 
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? "Stop Recording" : "Hold to Speak"}
                    </Text>
                    {isRecording && (
                      <View style={styles.recordingIndicator}>
                        <Text style={styles.recordingDuration}>Recording...</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
        
        {/* Therapy Approach Selection Modal */}
        <Modal
          visible={showApproachModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Your Therapy Approach</Text>
              <Text style={styles.modalDescription}>
                Select the therapeutic approach that best suits your needs:
              </Text>
              
              <ScrollView style={styles.approachList}>
                {THERAPY_APPROACHES.map((approach) => (
                  <TouchableOpacity
                    key={approach.id}
                    style={styles.approachItem}
                    onPress={() => startTherapySession(approach.id)}
                  >
                    <Text style={styles.approachName}>{approach.name}</Text>
                    <Text style={styles.approachDescription}>{approach.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Paywall Modal */}
        <Modal
          visible={showPaywallModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Premium+ Feature</Text>
              <Image 
                source={require('../assets/logo1.png')} 
                style={styles.paywallImage}
                defaultSource={require('../assets/icon.png')}
                onError={(e) => console.log('Image loading error', e.nativeEvent.error)}
              />
              <Text style={styles.paywallHeading}>Premium+ Voice Therapy</Text>
              <Text style={styles.paywallDescription}>
                Voice Therapy Sessions are available exclusively to Premium+ subscribers.
                Speak naturally with our AI therapist, receive audio responses, and
                experience a more natural therapeutic conversation with improved voice recognition.
              </Text>
              
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => {
                  setShowPaywallModal(false);
                  navigation.navigate('SubscriptionScreen');
                }}
              >
                <Text style={styles.subscribeButtonText}>Upgrade to Premium+</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.closeButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Text Input Modal for speech recognition fallback */}
        <Modal
          visible={showTextInputModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Your Message</Text>
              <Text style={styles.modalDescription}>
                Please type what you'd like to say to the AI therapist:
              </Text>
              
              <TextInput
                style={styles.textInput}
                value={manualInputText}
                onChangeText={setManualInputText}
                placeholder="Type your message here..."
                placeholderTextColor="#777"
                multiline
                numberOfLines={3}
                autoFocus
              />
              
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleTextInputCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleTextInputSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    marginTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
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
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  welcomeImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumText: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#42a5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: '#42a5f5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  therapistBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  therapistMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  audioButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  processingText: {
    color: '#bbb',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  voiceInputContainer: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recordingActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 50,
  },
  recordButtonText: {
    color: '#bbb',
    marginTop: 8,
    fontSize: 14,
  },
  recordingIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  recordingDuration: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  recordingCompleteContainer: {
    alignItems: 'center',
  },
  playButton: {
    marginVertical: 10,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  redoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  redoButtonText: {
    color: '#ff6b6b',
    marginLeft: 6,
  },
  sendRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#42a5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sendRecordingText: {
    color: '#fff',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 16,
  },
  approachList: {
    width: '100%',
    maxHeight: 300,
  },
  approachItem: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  approachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#42a5f5',
    marginBottom: 4,
  },
  approachDescription: {
    fontSize: 14,
    color: '#bbb',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paywallImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  paywallHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#42a5f5',
    marginBottom: 8,
  },
  paywallDescription: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#42a5f5',
    padding: 14,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textInput: {
    backgroundColor: '#3c3c3c',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    color: '#fff',
    width: '100%',
    minHeight: 100,
    textAlignVertical: 'top'
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#42a5f5',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VoiceTherapyScreen; 