import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserConversations, deleteConversation, updateConversationTitle } from '../services/chatService';

const ConversationList = ({ onSelectConversation, selectedId, onNewChat }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation list
  const loadConversations = async () => {
    try {
      setLoading(true);
      const userConversations = await getUserConversations();
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load your conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle conversation deletion
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              setConversations(conversations.filter(conv => conv.id !== id));
              
              // If the deleted conversation was selected, select a new one or clear
              if (selectedId === id) {
                if (conversations.length > 1) {
                  const nextConv = conversations.find(c => c.id !== id);
                  if (nextConv) onSelectConversation(nextConv.id);
                } else {
                  onNewChat();
                }
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete the conversation.');
            }
          }
        }
      ]
    );
  };

  // Handle editing conversation title
  const startEditing = (id, currentTitle) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveTitle = async (id) => {
    if (!editTitle.trim()) {
      setEditTitle('New Conversation');
    }
    
    try {
      await updateConversationTitle(id, editTitle.trim());
      setConversations(conversations.map(conv => 
        conv.id === id ? { ...conv, title: editTitle.trim() } : conv
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating title:', error);
      Alert.alert('Error', 'Failed to update the conversation title.');
    }
  };

  // Render each conversation item
  const renderItem = ({ item }) => {
    const isSelected = selectedId === item.id;
    const isEditing = editingId === item.id;
    
    return (
      <View style={[styles.itemContainer, isSelected && styles.selectedItem]}>
        <TouchableOpacity 
          style={styles.itemContent}
          onPress={() => onSelectConversation(item.id)}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={20} 
            color={isSelected ? "#fff" : "#42a5f5"} 
          />
          
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
              onBlur={() => saveTitle(item.id)}
              onSubmitEditing={() => saveTitle(item.id)}
            />
          ) : (
            <Text 
              numberOfLines={1} 
              style={[styles.itemTitle, isSelected && styles.selectedText]}
            >
              {item.title}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.itemActions}>
          {!isEditing && (
            <TouchableOpacity 
              onPress={() => startEditing(item.id, item.title)}
              style={styles.actionButton}
            >
              <Ionicons 
                name="pencil" 
                size={18} 
                color={isSelected ? "#fff" : "#777"} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
          >
            <Ionicons 
              name="trash-outline" 
              size={18} 
              color={isSelected ? "#fff" : "#777"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#42a5f5" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversations</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={onNewChat}
        >
          <Ionicons name="add-circle" size={22} color="#42a5f5" />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubText}>Start a new chat to begin.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadConversations();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newChatText: {
    color: '#42a5f5',
    marginLeft: 5,
    fontWeight: '600',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedItem: {
    backgroundColor: '#42a5f5',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    marginLeft: 10,
    fontSize: 16,
    color: '#eee',
    flex: 1,
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  titleInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ConversationList; 