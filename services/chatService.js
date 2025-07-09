import { firestore, auth } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

/**
 * Create a new conversation or chat session
 * @param {string} title - The title of the conversation
 * @returns {Promise<string>} - The ID of the newly created conversation
 */
export const createConversation = async (title = 'New Conversation') => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const conversationRef = await addDoc(collection(firestore, CONVERSATIONS_COLLECTION), {
      userId: user.uid,
      title: title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0
    });
    
    return conversationRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Save a message to a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {string} content - The message content
 * @param {string} type - The message type (question or answer)
 * @param {string} audioUrl - Optional audio URL for voice messages
 * @returns {Promise<string>} - The ID of the newly created message
 */
export const saveMessage = async (conversationId, content, type, audioUrl = null) => {
  try {
    // Validate required parameters
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    if (!content) {
      throw new Error('Message content is required');
    }
    
    if (!type) {
      throw new Error('Message type is required');
    }
    
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create the message object with optional audio URL
    const messageData = {
      conversationId,
      userId: user.uid,
      content,
      type,
      timestamp: serverTimestamp()
    };
    
    // Add audioUrl if provided
    if (audioUrl) {
      messageData.audioUrl = audioUrl;
      messageData.hasAudio = true;
    }
    
    // Add the message
    const messageRef = await addDoc(collection(firestore, MESSAGES_COLLECTION), messageData);
    
    // Update conversation's updatedAt and messageCount
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      await updateDoc(conversationRef, {
        updatedAt: serverTimestamp(),
        messageCount: (conversationDoc.data().messageCount || 0) + 1,
        // Update hasVoice flag if this is a voice message
        ...(audioUrl ? { hasVoice: true } : {})
      });
    }
    
    return messageRef.id;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Get all conversations for the current user
 * @returns {Promise<Array>} - An array of conversation objects
 */
export const getUserConversations = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const q = query(
      collection(firestore, CONVERSATIONS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

/**
 * Get all messages for a specific conversation
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<Array>} - An array of message objects
 */
export const getConversationMessages = async (conversationId) => {
  try {
    const q = query(
      collection(firestore, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
};

/**
 * Update a conversation's title
 * @param {string} conversationId - The ID of the conversation
 * @param {string} newTitle - The new title for the conversation
 * @returns {Promise<void>}
 */
export const updateConversationTitle = async (conversationId, newTitle) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists() || conversationDoc.data().userId !== user.uid) {
      throw new Error('Conversation not found or user not authorized');
    }
    
    await updateDoc(conversationRef, {
      title: newTitle,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    throw error;
  }
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - The ID of the conversation to delete
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user owns the conversation
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists() || conversationDoc.data().userId !== user.uid) {
      throw new Error('Conversation not found or user not authorized');
    }
    
    // Get all messages in the conversation
    const q = query(
      collection(firestore, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Delete all messages
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    // Delete the conversation
    await deleteDoc(conversationRef);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}; 