import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import api from '../config/api';
import { 
  collection, query, where, onSnapshot, doc, 
  addDoc, updateDoc, increment, serverTimestamp, orderBy 
} from 'firebase/firestore';
import { Send, Image, MessageSquare, AlertCircle } from 'lucide-react';

const parseTimestamp = (ts) => {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') {
    return ts.toDate();
  }
  if (ts.seconds) {
    return new Date(ts.seconds * 1000);
  }
  if (typeof ts === 'number') {
    return new Date(ts);
  }
  if (ts instanceof Date) {
    return ts;
  }
  return new Date();
};

const Chats = () => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef(null);

  // Helper: Create unique chatId like FirestorePaths.chatId in Dart
  const getChatId = (uid1, uid2) => {
    return uid1.compareTo(uid2) < 0 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Polyfill string compare in JS
  const compareUids = (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };

  const getChatIdJS = (uid1, uid2) => {
    return compareUids(uid1, uid2) < 0 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // 1. Listen to User's Chat List
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const participants = data.participants || [];
        const otherUserId = participants.find(p => p !== currentUser.uid);
        if (!otherUserId) continue;
        
        // Fetch recipient's metadata from Java REST API
        let otherUser = { name: 'User', avatarUrl: '' };
        try {
          const res = await api.get(`/users/${otherUserId}`);
          otherUser = res.data;
        } catch (e) {
          console.error(e);
        }

        chatList.push({
          id: d.id,
          recipientId: otherUserId,
          recipientName: otherUser.name || 'User',
          recipientAvatarUrl: otherUser.avatarUrl,
          lastMessage: data.lastMessage || 'Start a conversation',
          lastTimestamp: parseTimestamp(data.lastTimestamp),
          unreadCount: data.unreadCount?.[currentUser.uid] || 0
        });
      }

      // Sort chats by timestamp descending
      chatList.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      setChats(chatList);
      setLoadingChats(false);
    }, (error) => {
      console.error("Chats feed error: ", error);
      setLoadingChats(false);
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  // 2. Handle navigation parameter triggers (Message button from GigDetails page)
  useEffect(() => {
    const handleRedirectTrigger = async () => {
      if (location.state?.recipientId && currentUser?.uid) {
        const targetId = location.state.recipientId;
        const targetName = location.state.recipientName;
        const chatId = getChatIdJS(currentUser.uid, targetId);

        // Check if chat doc exists on Firestore or initialize
        const chatRef = doc(db, 'chats', chatId);
        
        try {
          // Trigger API to resolve/register chat metadata safely
          await api.get(`/users/${targetId}`); // Verify target exists
          
          // Let's open the chat room
          setActiveChat({
            id: chatId,
            recipientId: targetId,
            recipientName: targetName
          });
        } catch (e) {
          console.error(e);
        }
      }
    };
    handleRedirectTrigger();
  }, [location.state, currentUser]);

  // 3. Listen to messages inside selected Chat Room
  useEffect(() => {
    if (!activeChat?.id || !currentUser?.uid) return;

    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId,
          text: data.text || '',
          type: data.type || 'text',
          imageUrl: data.imageUrl,
          timestamp: parseTimestamp(data.timestamp)
        };
      });
      setMessages(msgList);
      
      // Clear unread count when opening chat
      const chatRef = doc(db, 'chats', activeChat.id);
      updateDoc(chatRef, {
        [`unreadCount.${currentUser.uid}`]: 0
      }).catch(console.error);

    }, (error) => {
      console.error("Messages sync error", error);
    });

    return unsubscribe;
  }, [activeChat?.id, currentUser?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || !currentUser?.uid) return;

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      const chatRoomId = activeChat.id;
      const recipientId = activeChat.recipientId;

      // 1. Write message document directly to subcollection
      const msgRef = collection(db, 'chats', chatRoomId, 'messages');
      await addDoc(msgRef, {
        senderId: currentUser.uid,
        text: textToSend,
        type: 'text',
        timestamp: serverTimestamp(),
        read: false
      });

      // 2. Update chat metadata and increment recipient's unread counter
      const chatRef = doc(db, 'chats', chatRoomId);
      await updateDoc(chatRef, {
        lastMessage: textToSend,
        lastTimestamp: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1)
      });
    } catch (e) {
      console.error("Failed to send message: ", e);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: 'calc(100vh - 80px)',
      overflow: 'hidden',
      margin: '0 auto',
      maxWidth: '1100px'
    }}>
      {/* Sidebar Chat List */}
      <div style={{ borderRight: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--divider)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Active Chats</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}><div style={{ width: '20px', height: '20px', border: '2px solid var(--divider)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>
          ) : chats.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-hint)' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: '12px' }}>No active conversations.</p>
            </div>
          ) : (
            chats.map((c) => {
              const isSelected = activeChat?.id === c.id;
              return (
                <div 
                  key={c.id} 
                  onClick={() => setActiveChat({ id: c.id, recipientId: c.recipientId, recipientName: c.recipientName, recipientAvatarUrl: c.recipientAvatarUrl })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    borderBottom: '1px solid var(--divider)',
                    transition: 'all 0.2s ease'
                  }}
                  className={isSelected ? '' : 'glass-card-hover'}
                >
                  <img 
                    src={c.recipientAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                    alt={c.recipientName}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.recipientName}</h4>
                      <span style={{ fontSize: '10px', color: 'var(--text-hint)' }}>{c.lastTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: c.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: c.unreadCount > 0 ? '700' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span style={{ background: 'var(--primary)', color: '#0f172a', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Messaging Interface */}
      {activeChat ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'rgba(15,23,42,0.2)' }}>
          {/* Header Panel */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--glass)' }}>
            <img 
              src={activeChat.recipientAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
              alt={activeChat.recipientName}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{activeChat.recipientName}</h3>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>Active Chat Stream</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m) => {
              const isMe = m.senderId === currentUser.uid;
              return (
                <div 
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe ? 'var(--primary)' : 'var(--surface)',
                    color: isMe ? '#0f172a' : 'var(--text-primary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    position: 'relative',
                    animation: 'fadeIn 0.2s ease-out forwards'
                  }}
                >
                  <p style={{ fontSize: '13.5px', lineHeight: '1.4' }}>{m.text}</p>
                  <span style={{
                    fontSize: '9px',
                    display: 'block',
                    textAlign: 'right',
                    marginTop: '4px',
                    opacity: 0.6
                  }}>
                    {m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input Bar */}
          <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', borderTop: '1px solid var(--divider)', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--glass)' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Write an instant message..."
              style={{ flex: 1, margin: 0 }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        /* Empty Conversation Screen */
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', color: 'var(--text-hint)' }}>
          <MessageSquare size={54} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Open a Conversation</h3>
          <p style={{ fontSize: '13px', maxWidth: '320px', textAlign: 'center', lineHeight: '1.5' }}>
            Select a student from the sidebar chat log to view your active real-time messaging pipeline.
          </p>
        </div>
      )}
    </div>
  );
};

export default Chats;
