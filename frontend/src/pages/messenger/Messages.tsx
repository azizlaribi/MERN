// pages/messages/Messages.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button, Badge, Spinner, Alert, Image } from 'react-bootstrap';
import { FaUser, FaPaperPlane, FaArrowLeft, FaCircle, FaCheckCircle, FaRegClock, FaTrash } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { messageService } from '../../services/messageService';
import { socketService } from '../../services/socketService';
import type { Conversation, Message } from '../../types/message.types';

const Messages: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = localStorage.getItem('userId');

  // Connect to WebSocket when component mounts
  useEffect(() => {
    socketService.connect();
    
    return () => {
      // Cleanup listeners but keep socket connection
    };
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    const unsubscribeNewMessage = socketService.onNewMessage((message) => {
      // Update messages if in current conversation
      if (selectedConversation && 
          (message.sender._id === selectedConversation.user._id || 
           message.receiver._id === selectedConversation.user._id)) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if it's from the other user
        if (message.sender._id === selectedConversation.user._id) {
          socketService.markAsRead(selectedConversation.user._id);
        }
      }
      
      // Refresh conversations list to update last message and unread count
      fetchConversations();
    });
    
    // Listen for message sent confirmation from server
    const unsubscribeMessageSent = socketService.onMessageSent((message) => {
      // Add the sent message to the messages list immediately
      setMessages(prev => [...prev, message]);
      
      // If this is a new conversation, update the conversations list
      if (selectedConversation?.conversationId === 'new') {
        // Refresh conversations to get the newly created conversation
        setTimeout(() => {
          fetchConversations();
        }, 500);
      }
    });
    
    const unsubscribeTyping = socketService.onTyping((data) => {
      if (selectedConversation && data.userId === selectedConversation.user._id) {
        setIsTyping(data.isTyping);
      }
    });
    
    const unsubscribeConversationUpdate = socketService.onConversationUpdate(() => {
      fetchConversations();
    });
    
    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageSent();
      unsubscribeTyping();
      unsubscribeConversationUpdate();
    };
  }, [selectedConversation]);

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle userId parameter from URL
  useEffect(() => {
    if (userId) {
      // First try to find conversation in existing list
      const conversation = conversations.find(conv => conv.user._id === userId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        // If not found, fetch user details and create temporary conversation
        fetchUserAndCreateConversation(userId);
      }
    }
  }, [userId, conversations]);

  const fetchUserAndCreateConversation = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/users/userbyId/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      
      // Create a temporary conversation object
      const tempConversation: Conversation = {
        conversationId: 'new',
        user: userData.user,
        lastMessage: 'No messages yet',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };
      
      setSelectedConversation(tempConversation);
      setMessages([]);
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Could not load user information. Please try again.');
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    setMessagesLoading(true);
    try {
      const data = await messageService.getMessages(userId);
      setMessages(data);
      
      // Mark messages as read
      socketService.markAsRead(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConversation && selectedConversation.conversationId !== 'new') {
      fetchMessages(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    const messageText = newMessage.trim();
    
    // Create optimistic message object for immediate display
    const optimisticMessage: Message = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: currentUserId!,
        firstname: '',
        lastname: '',
        email: '',
        picture: ''
      },
      receiver: {
        _id: selectedConversation.user._id,
        firstname: selectedConversation.user.firstname,
        lastname: selectedConversation.user.lastname,
        email: selectedConversation.user.email,
        picture: selectedConversation.user.picture
      },
      message: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add message immediately to UI
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // Send via WebSocket
    socketService.sendMessage(selectedConversation.user._id, messageText);
    
    // If it's a new conversation, create it in the conversations list immediately
    if (selectedConversation.conversationId === 'new') {
      // Create an optimistic conversation
      const optimisticConversation: Conversation = {
        conversationId: 'temp',
        user: selectedConversation.user,
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      };
      
      // Add to conversations list immediately
      setConversations(prev => [optimisticConversation, ...prev]);
      
      // Update selected conversation
      setSelectedConversation(optimisticConversation);
    }
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.sendTyping(selectedConversation.user._id, false);
    
    setSending(false);
    
    // Refresh conversations after a short delay to get the real data from server
    setTimeout(() => {
      fetchConversations();
    }, 1000);
  };

  const handleTyping = () => {
    if (!selectedConversation) return;
    
    if (!typing) {
      setTyping(true);
      socketService.sendTyping(selectedConversation.user._id, true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socketService.sendTyping(selectedConversation.user._id, false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      <div style={{ 
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease-in-out',
        padding: '20px',
        minHeight: '100vh'
      }}>
        <Container fluid className="py-2">
          <Row className="g-3" style={{ height: 'calc(100vh - 80px)' }}>
            {/* Conversations List */}
            <Col lg={4} style={{ height: '100%' }}>
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Card.Header className="bg-danger text-white py-3" style={{ borderRadius: '0' }}>
                  <h5 className="mb-0 fw-bold">💬 Conversations</h5>
                </Card.Header>
                <Card.Body className="p-0" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 70px)' }}>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="danger" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-5">
                      <FaUser size={50} className="text-muted mb-3" />
                      <p className="text-muted">No conversations yet</p>
                      <p className="small text-muted">Start by booking a trip or messaging a driver</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {conversations.map((conv) => (
                        <ListGroup.Item
                          key={conv.conversationId}
                          action
                          active={selectedConversation?.user._id === conv.user._id}
                          onClick={() => {
                            setSelectedConversation(conv);
                            navigate(`/messages/${conv.user._id}`);
                          }}
                          className="p-3 border-0"
                          style={{
                            backgroundColor: selectedConversation?.user._id === conv.user._id ? 'rgba(220, 53, 69, 0.1)' : 'transparent',
                            cursor: 'pointer',
                            borderLeft: selectedConversation?.user._id === conv.user._id ? '4px solid #dc3545' : '4px solid transparent'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="position-relative">
                              {conv.user.picture ? (
                                <Image
                                  src={conv.user.picture}
                                  roundedCircle
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="bg-dark rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <FaUser color="white" size={20} />
                                </div>
                              )}
                              {conv.unreadCount > 0 && (
                                <Badge
                                  bg="danger"
                                  pill
                                  className="position-absolute"
                                  style={{ top: '-5px', right: '-5px' }}
                                >
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="ms-3 flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong className="text-dark">
                                  {conv.user.firstname} {conv.user.lastname}
                                </strong>
                                <small className="text-muted">
                                  {formatTime(conv.lastMessageTime)}
                                </small>
                              </div>
                              <div className="small text-muted text-truncate">
                                {conv.lastMessage}
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Chat Area */}
            <Col lg={8} style={{ height: '100%' }}>
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                {selectedConversation ? (
                  <>
                    <Card.Header className="bg-white py-3 border-bottom" style={{ borderRadius: '0' }}>
                      <div className="d-flex align-items-center">
                        <Button
                          variant="link"
                          className="d-lg-none me-2 text-dark"
                          onClick={() => {
                            setSelectedConversation(null);
                            navigate('/messages');
                          }}
                        >
                          <FaArrowLeft />
                        </Button>
                        {selectedConversation.user.picture ? (
                          <Image
                            src={selectedConversation.user.picture}
                            roundedCircle
                            style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="bg-dark rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '45px', height: '45px' }}
                          >
                            <FaUser color="white" size={20} />
                          </div>
                        )}
                        <div className="ms-3">
                          <h6 className="mb-0 fw-bold">
                            {selectedConversation.user.firstname} {selectedConversation.user.lastname}
                          </h6>
                          {isTyping && (
                            <small className="text-danger">
                              <FaCircle size={8} className="me-1" /> Typing...
                            </small>
                          )}
                        </div>
                      </div>
                    </Card.Header>

                    <Card.Body 
                      style={{ 
                        overflowY: 'auto', 
                        maxHeight: 'calc(100% - 130px)',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      {messagesLoading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="danger" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-5">
                          <FaPaperPlane size={50} className="text-muted mb-3" />
                          <p className="text-muted">No messages yet</p>
                          <p className="small text-muted">Send a message to start the conversation</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => {
                            const isCurrentUser = message.sender._id === currentUserId;
                            // Don't show temporary messages with _id starting with 'temp_' for long
                            const isTemp = message._id.startsWith('temp_');
                            return (
                              <div
                                key={message._id}
                                className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
                              >
                                <div
                                  style={{
                                    maxWidth: '70%',
                                    backgroundColor: isCurrentUser ? '#dc3545' : 'white',
                                    color: isCurrentUser ? 'white' : '#333',
                                    borderRadius: '15px',
                                    padding: '10px 15px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    opacity: isTemp ? 0.7 : 1
                                  }}
                                >
                                  <div className="small">{message.message}</div>
                                  <div className="small mt-1" style={{ 
                                    fontSize: '10px',
                                    opacity: 0.7,
                                    textAlign: 'right'
                                  }}>
                                    {isTemp ? 'Sending...' : formatTime(message.createdAt)}
                                    {isCurrentUser && !isTemp && (
                                      <span className="ms-1">
                                        {message.isRead ? (
                                          <FaCheckCircle size={10} />
                                        ) : (
                                          <FaRegClock size={10} />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </Card.Body>

                    <Card.Footer className="bg-white border-top py-3">
                      <div className="d-flex gap-2">
                        <Form.Control
                          as="textarea"
                          rows={1}
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={handleKeyPress}
                          style={{ borderRadius: '25px', resize: 'none' }}
                        />
                        <Button
                          variant="danger"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          style={{ borderRadius: '25px', padding: '8px 20px' }}
                        >
                          {sending ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
                        </Button>
                      </div>
                    </Card.Footer>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-5">
                    <FaPaperPlane size={80} className="text-muted mb-4" />
                    <h5 className="text-muted">Select a conversation</h5>
                    <p className="text-muted small">Choose a user from the left to start messaging</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Messages;