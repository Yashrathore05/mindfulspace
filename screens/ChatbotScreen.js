import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import axios from "axios";
import Markdown from "react-native-markdown-display";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import ConversationList from "../components/ConversationList";
import { 
  createConversation, 
  saveMessage, 
  getConversationMessages,
  getUserConversations,
  updateConversationTitle,
  deleteConversation,
} from "../services/chatService";

function ChatbotScreen() {
  const navigation = useNavigation();
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const chatContainerRef = useRef(null);

  // Conversation management
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isNewConversation, setIsNewConversation] = useState(true);
  
  // Mood Assessment States
  const [showMoodAssessment, setShowMoodAssessment] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [moodScore, setMoodScore] = useState(0);
  const [answers, setAnswers] = useState([]);

  // Animation value for sidebar
  const slideAnim = useRef(new Animated.Value(-300)).current;
  
  const MOOD_QUESTIONS = [
    {
      question: "How would you rate your overall mood today?",
      description: "1 = Very low mood, 5 = Very good mood"
    },
    {
      question: "How well have you been sleeping recently?",
      description: "1 = Poor sleep, 5 = Excellent sleep"
    },
    {
      question: "How would you rate your stress levels?",
      description: "1 = Extremely stressed, 5 = Very relaxed"
    },
    {
      question: "How connected do you feel to others?",
      description: "1 = Very isolated, 5 = Very connected"
    },
    {
      question: "How would you rate your energy levels?",
      description: "1 = Very low energy, 5 = Very high energy"
    }
  ];

  const API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; // Your API key

  const WELLNESS_RESPONSES = {
    Happy: "That's great to hear! Keep smiling 😊",
    Sad: "I'm here for you. Take a deep breath and know that you are not alone. 💙",
    Stressed: "Try to take a break and focus on your breath. You got this! 🌿",
    Angry: "It's okay to feel angry. Try to express it in a healthy way. 🔥",
    Anxious: "Take a moment to pause and remind yourself that you are safe. 💕",
    Default: "Your well-being is important. Take a deep breath. I'm here for you. 🌼",
  };

  // Animate sidebar
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidebar ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar, slideAnim]);

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollToEnd({ animated: true });
    }
  }, [chatHistory, generatingAnswer]);

  // Load conversation messages if activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages();
    } else {
      setChatHistory([]);
    }
  }, [activeConversationId]);

  // Fetch user conversations when the component mounts
  useEffect(() => {
    const fetchUserConversations = async () => {
      try {
        const userConversations = await getUserConversations();
        setConversations(userConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchUserConversations();
  }, []);

  // Load messages for the selected conversation
  const loadConversationMessages = async () => {
    try {
      const messages = await getConversationMessages(activeConversationId);
      if (messages && messages.length > 0) {
        setChatHistory(messages.map(msg => ({
          type: msg.type,
          content: msg.content
        })));
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      setChatHistory([]);
    }
  };

  // Create a new conversation
  const handleNewChat = async () => {
    try {
      // Create a new conversation in Firestore
      const newConversationId = await createConversation("New Conversation");
      setActiveConversationId(newConversationId);
      setShowSidebar(false);
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  // Select an existing conversation
  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      // Refresh conversations list
      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);
      
      // If the deleted conversation was active, clear the chat
      if (conversationId === activeConversationId) {
        setActiveConversationId(null);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  const handleRenameConversation = async (conversationId, newTitle) => {
    try {
      await updateConversationTitle(conversationId, newTitle);
      // Update the conversations list with the new title
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (error) {
      console.error('Error renaming conversation:', error);
      Alert.alert('Error', 'Failed to rename conversation');
    }
  };

  async function generateAnswer() {
    if (!question.trim()) return;

    let currentConversationId = activeConversationId;

    // Create a new conversation if none exists
    if (!currentConversationId) {
      try {
        const newConversationId = await createConversation(
          question.length > 30 ? question.substring(0, 30) + "..." : question
        );
        setActiveConversationId(newConversationId);
        currentConversationId = newConversationId;
      } catch (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to create a new conversation. Please try again.");
        return;
      }
    }

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion(""); // Clear input immediately after sending

    // Add user question to chat history
    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);
    
    // Save the question to Firestore
    try {
      if (currentConversationId) {
        await saveMessage(currentConversationId, currentQuestion, "question");
      } else {
        console.error("No active conversation ID when saving message");
      }
    } catch (error) {
      console.error("Error saving question:", error);
    }

    try {
      // Create a mental health focused prompt
      const mentalHealthPrompt = `You are a compassionate mental health support assistant. Your role is to provide empathetic, supportive, and helpful responses to mental health related queries. 
      Please respond to the following question with care and understanding, focusing on mental well-being and emotional support. 
      If the question is not directly related to mental health, gently guide the conversation back to mental wellness topics.
      Always maintain a supportive and non-judgmental tone.
      Question: ${currentQuestion}`;

      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001-tuning:generateContent?key=${API_KEY}`,
        method: "post",
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          contents: [{
            parts: [{
              text: mentalHealthPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }
      });

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
        
        // Save the AI response to Firestore
        try {
          if (currentConversationId) {
            await saveMessage(currentConversationId, aiResponse, "answer");
          } else {
            console.error("No active conversation ID when saving answer");
          }
        } catch (error) {
          console.error("Error saving answer:", error);
        }
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      const errorMessage = "I'm having trouble connecting right now. Please try again later or check your internet connection. In the meantime, remember to practice self-care and reach out to supportive people in your life.";
      
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: errorMessage },
      ]);
      
      // Save the error message to Firestore
      try {
        if (currentConversationId) {
          await saveMessage(currentConversationId, errorMessage, "answer");
        } else {
          console.error("No active conversation ID when saving error message");
        }
      } catch (saveError) {
        console.error("Error saving error message:", saveError);
      }
    } finally {
      setGeneratingAnswer(false);
    }
  }

  function handleMoodSelection(score) {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    
    if (currentQuestionIndex < MOOD_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate final score
      const totalScore = newAnswers.reduce((sum, score) => sum + score, 0);
      const averageScore = totalScore / MOOD_QUESTIONS.length;
      setMoodScore(averageScore);
      
      // Generate assessment message
      let assessmentMessage = "";
      if (averageScore <= 2) {
        assessmentMessage = "Your responses suggest you might be experiencing significant distress. Please consider reaching out to a mental health professional for support. Remember, it's okay to ask for help.";
      } else if (averageScore <= 3) {
        assessmentMessage = "Your responses indicate some areas of concern. Consider practicing self-care and reaching out to supportive people in your life.";
      } else if (averageScore <= 4) {
        assessmentMessage = "Your responses suggest you're doing okay, but there might be some areas to focus on. Keep up with your self-care practices.";
      } else {
        assessmentMessage = "Your responses indicate you're doing well! Keep up the good work and continue with your positive habits.";
      }

      // Create a new conversation for this assessment if needed
      const createAssessmentConversation = async () => {
        try {
          let currentConversationId = activeConversationId;
          
          // Create a new conversation if none exists
          if (!currentConversationId) {
            const newConversationId = await createConversation("Mood Assessment");
            setActiveConversationId(newConversationId);
            currentConversationId = newConversationId;
          }
          
          // Only proceed if we have a valid conversation ID
          if (!currentConversationId) {
            console.error("Failed to create or get a valid conversation ID");
            Alert.alert("Error", "There was a problem saving your mood assessment. Please try again.");
            return;
          }
          
          const finalMessage = `Based on your responses, your mental health score is ${averageScore.toFixed(1)}/5. ${assessmentMessage}`;
          
          // Add assessment to chat
          setChatHistory(prev => [...prev, {
            type: "answer",
            content: finalMessage
          }]);
          
          // Save the assessment to Firestore
          await saveMessage(currentConversationId, finalMessage, "answer");
          
          // Add prompt to visit the Mood Garden
          setTimeout(() => {
            setChatHistory(prev => [...prev, {
              type: "answer",
              content: "Your mood has been added to your Mood Garden! 🌱 Would you like to see how your garden is growing with this new entry? [Visit Mood Garden](mood-garden-link)"
            }]);
            
            // Save this message to Firestore as well
            if (currentConversationId) {
              saveMessage(currentConversationId, "Your mood has been added to your Mood Garden! 🌱 Would you like to see how your garden is growing with this new entry?", "answer")
                .catch(err => console.error("Error saving garden prompt:", err));
            }
          }, 1000);
        } catch (error) {
          console.error("Error handling mood assessment:", error);
          Alert.alert("Error", "There was an error processing your mood assessment.");
        }
      };
      
      createAssessmentConversation();

      // Reset assessment
      setShowMoodAssessment(false);
      setCurrentQuestionIndex(0);
      setAnswers([]);
    }
  }

  const handleMarkdownLinkPress = (url) => {
    if (url === 'mood-garden-link') {
      navigation.navigate('MoodGardenScreen');
    } else {
      // Handle other links if needed
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar for conversation history */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Conversations</Text>
          <TouchableOpacity 
            onPress={() => setShowSidebar(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ConversationList 
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
          selectedId={activeConversationId}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />
      </Animated.View>
      
      {/* Overlay that darkens the background when sidebar is open */}
      {showSidebar && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSidebar(false)}
        />
      )}
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header with back button, conversation toggle and logo */}
        <View style={[styles.header]}>
          <View style={styles.headerLeftSection}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Dashboard")}
        style={styles.backButton}
      >
              <Ionicons name="arrow-back" size={18} color="#42a5f5" />
              <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowSidebar(!showSidebar)}
              style={styles.menuButton}
            >
              <Ionicons name={showSidebar ? "close" : "menu"} size={24} color="#42a5f5" />
            </TouchableOpacity>
          </View>
          
      <View style={styles.logoContainer}>
        <Image source={require("../assets/logo1.png")} style={styles.logo} />
      </View>

          <TouchableOpacity 
            onPress={handleNewChat}
            style={styles.newChatButton}
          >
            <Ionicons name="add-circle-outline" size={20} color="#42a5f5" />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Assessment Button */}
        <TouchableOpacity 
          onPress={() => setShowMoodAssessment(true)} 
          style={styles.moodButton}
        >
          <Text style={styles.moodButtonText}>Take Mood Assessment</Text>
      </TouchableOpacity>

        {/* Mood Assessment Modal */}
        <Modal visible={showMoodAssessment} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Mood Assessment</Text>
              <Text style={styles.questionText}>
                {MOOD_QUESTIONS[currentQuestionIndex].question}
              </Text>
              <Text style={styles.questionDescription}>
                {MOOD_QUESTIONS[currentQuestionIndex].description}
              </Text>
              
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                    key={score}
                    style={styles.ratingButton}
                    onPress={() => handleMoodSelection(score)}
                  >
                    <Text style={styles.ratingText}>{score}</Text>
              </TouchableOpacity>
            ))}
              </View>

              <Pressable 
                onPress={() => {
                  setShowMoodAssessment(false);
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                }} 
                style={styles.closeModal}
              >
                <Text style={styles.closeModalText}>Cancel Assessment</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Chat Area */}
      <ScrollView
        ref={chatContainerRef}
        contentContainerStyle={styles.chatContainer}
        style={styles.chatBox}
      >
        {chatHistory.length === 0 ? (
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeText}>Welcome to MindfulSpace 🌱</Text>
            <Text style={styles.descriptionText}>
              Your space for mental wellness and peace. Ask me anything, and let's find balance
              together.
            </Text>
          </View>
        ) : (
          chatHistory.map((chat, index) => (
            <View
              key={index}
              style={[styles.chatBubble, chat.type === "question" ? styles.questionBubble : styles.answerBubble]}
            >
              <Markdown 
                style={{ body: chat.type === "question" ? styles.questionText : styles.answerText }}
                onLinkPress={handleMarkdownLinkPress}
              >
                {chat.content}
              </Markdown>
            </View>
          ))
        )}
        {generatingAnswer && (
          <View style={styles.generatingAnswer}>
            <ActivityIndicator size="large" color="#42a5f5" />
            <Text style={styles.thinkingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Type your question here..."
          placeholderTextColor="#aaa"
          onSubmitEditing={generateAnswer}
          returnKeyType="send"
            multiline
          />
          <Pressable 
            onPress={generateAnswer} 
            style={styles.sendButton} 
            disabled={generatingAnswer || !question.trim()}
          >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f1f1f",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 5,
    paddingBottom: 5,
    backgroundColor: "#1f1f1f",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginTop: 50,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#2c2c2c",
    marginRight: 8,
  },
  backText: {
    fontSize: 14,
    color: "#42a5f5",
    fontWeight: "bold",
    marginLeft: 3,
  },
  menuButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#2c2c2c",
  },
  logoContainer: {
    alignItems: "center",
    padding: 0,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#2c2c2c",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  newChatText: {
    color: "#42a5f5",
    marginLeft: 5,
    fontWeight: 'bold',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#1f1f1f",
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 5,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#fff",
  },
  closeButton: {
    padding: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#1f1f1f",
  },
  chatBox: {
    flex: 1,
    marginBottom: 10,
    marginHorizontal: 10,
    backgroundColor: "#2c2c2c",
    borderRadius: 15,
    padding: 15,
  },
  chatContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  welcomeMessage: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#42a5f5",
    marginBottom: 10,
    textAlign: "center",
  },
  descriptionText: {
    textAlign: "center",
    color: "#bbb",
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  chatBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "80%",
  },
  questionBubble: {
    backgroundColor: "#42a5f5",
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  answerBubble: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
  },
  questionText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  answerText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  generatingAnswer: {
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
  },
  thinkingText: {
    color: "#bbb",
    fontStyle: "italic",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderRadius: 30,
    padding: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 8,
  },
  sendButton: {
    backgroundColor: "#42a5f5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  moodButton: {
    backgroundColor: "#2c2c2c",
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: 10,
  },
  moodButtonText: {
    color: "#42a5f5",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#2c2c2c',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#42a5f5',
    marginBottom: 20,
  },
  questionDescription: {
    fontSize: 14,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#42a5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeModal: {
    marginTop: 20,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  closeModalText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatbotScreen;
