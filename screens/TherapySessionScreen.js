import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
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

const THERAPY_APPROACHES = [
  { id: 'cbt', name: 'Cognitive Behavioral Therapy', 
    description: 'Focuses on changing negative thought patterns and behaviors' },
  { id: 'mindfulness', name: 'Mindfulness-Based Therapy', 
    description: 'Develops awareness and acceptance of present moment experiences' },
  { id: 'act', name: 'Acceptance & Commitment Therapy', 
    description: 'Emphasizes psychological flexibility and value-based actions' },
];

const TherapySessionScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionApproach, setSessionApproach] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showApproachModal, setShowApproachModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const chatScrollRef = useRef(null);

  const conversationId = route.params?.conversationId;
  const API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; // Your API key

  // Check premium access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const hasAccess = await hasFeatureAccess(PREMIUM_FEATURES.AI_THERAPY);
        
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
        console.error('Error checking feature access:', error);
        Alert.alert('Error', 'Failed to check subscription status');
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [conversationId]);

  // Load existing conversation
  const loadConversation = async () => {
    try {
      const messages = await getConversationMessages(conversationId);
      if (messages && messages.length > 0) {
        setChatHistory(messages.map(msg => ({
          type: msg.type,
          content: msg.content
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
      const therapyType = THERAPY_APPROACHES.find(a => a.id === approach)?.name || 'Therapy';
      const newConversationId = await createConversation(`${therapyType} Session`);
      
      // Save system message with session details
      const systemMessage = `AI Therapy Session\napproach: ${approach}\nstarted: ${new Date().toISOString()}`;
      await saveMessage(newConversationId, systemMessage, 'system');
      
      // Generate initial therapist message
      setGenerating(true);
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
        
        // Update route params to include conversationId
        navigation.setParams({ conversationId: newConversationId });
      }
      
      setSessionActive(true);
    } catch (error) {
      console.error('Error starting therapy session:', error);
      Alert.alert('Error', 'Failed to start therapy session');
    } finally {
      setLoading(false);
      setGenerating(false);
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
    
    prompt += `\n\nThis is a premium AI therapy feature, so provide a high-quality, in-depth therapeutic response.
    Focus on being helpful and supportive while providing deeper insights than a regular chatbot.
    Begin the session now with your introduction and first question.`;
    
    return prompt;
  };

  // Continue therapy session with user input
  const continueSession = async () => {
    if (!userInput.trim()) return;
    if (!conversationId) {
      Alert.alert('Error', 'No active therapy session');
      return;
    }
    
    const currentInput = userInput;
    setUserInput('');
    setGenerating(true);
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'question', content: currentInput }]);
    
    // Save user message
    await saveMessage(conversationId, currentInput, 'question');
    
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
      
      therapyPrompt += `\n\nThis is a premium AI therapy feature, so provide a high-quality, in-depth therapeutic response.
      The user's most recent message is: "${currentInput}"
      
      Remember previous context from the conversation and respond as a skilled therapist would.`;
      
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
        await saveMessage(conversationId, aiResponse, 'answer');
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error in therapy session:', error);
      
      const errorMessage = "I apologize, but I'm having trouble connecting right now. Let's take a brief pause in our session. You can try again in a moment.";
      
      setChatHistory(prev => [...prev, { type: 'answer', content: errorMessage }]);
      await saveMessage(conversationId, errorMessage, 'answer');
    } finally {
      setGenerating(false);
    }
  };

  // Scroll to bottom when chat updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [chatHistory, generating]);

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
              THERAPY_APPROACHES.find(a => a.id === sessionApproach)?.name || 'Therapy Session' 
              : 'AI Therapy Session'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42a5f5" />
            <Text style={styles.loadingText}>Preparing your therapy session...</Text>
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
                  />
                  <Text style={styles.welcomeTitle}>AI Therapy Session</Text>
                  <Text style={styles.welcomeText}>
                    Select a therapy approach to begin your personalized session with our AI therapist.
                  </Text>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => setShowApproachModal(true)}
                  >
                    <Text style={styles.startButtonText}>Start Session</Text>
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
                        <Markdown 
                          style={{ 
                            body: message.type === 'question' ? styles.userMessageText : styles.therapistMessageText 
                          }}
                        >
                          {message.content}
                        </Markdown>
                      </View>
                    )
                  ))}
                  
                  {generating && (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="small" color="#42a5f5" />
                      <Text style={styles.generatingText}>Therapist is typing...</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            
            {/* Input Area - only show when session is active */}
            {sessionActive && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={userInput}
                  onChangeText={setUserInput}
                  placeholder="Type your response here..."
                  placeholderTextColor="#aaa"
                  multiline
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton, 
                    (!userInput.trim() || generating) && styles.disabledButton
                  ]}
                  onPress={continueSession}
                  disabled={!userInput.trim() || generating}
                >
                  <Ionicons 
                    name="send" 
                    size={24} 
                    color={(!userInput.trim() || generating) ? "#666" : "#fff"} 
                  />
                </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Premium Feature</Text>
              <Image 
                source={require('../assets/logo1.png')} 
                style={styles.paywallImage} 
              />
              <Text style={styles.paywallHeading}>AI Therapy Sessions</Text>
              <Text style={styles.paywallDescription}>
                AI Therapy Sessions are available exclusively to premium subscribers.
                Get personalized therapy approaches, in-depth sessions, and advanced
                mental health guidance with our premium plans.
              </Text>
              
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => {
                  setShowPaywallModal(false);
                  navigation.navigate('SubscriptionScreen');
                }}
              >
                <Text style={styles.subscribeButtonText}>View Premium Plans</Text>
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
    marginBottom: 8,
    maxWidth: '80%',
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
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  generatingText: {
    color: '#bbb',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#42a5f5',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
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
});

export default TherapySessionScreen; 