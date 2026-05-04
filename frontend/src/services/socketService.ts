// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import type { Message } from '../types/message.types';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
  private messageSentHandlers: ((message: Message) => void)[] = [];
  private conversationUpdateHandlers: ((data: any) => void)[] = [];
  private errorHandlers: ((error: any) => void)[] = [];
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        this.notifyError('No authentication token found');
        resolve(false);
        return;
      }

      // Only connect if not already connected
      if (this.socket?.connected) {
        console.log('✅ Socket already connected');
        resolve(true);
        return;
      }

      // If socket exists but is disconnected, try to reconnect
      if (this.socket && !this.socket.connected) {
        console.log('🔄 Attempting to reconnect existing socket');
        this.socket.connect();
        resolve(true);
        return;
      }

      console.log('🔌 Creating new WebSocket connection...');

      this.socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxConnectionAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        this.connectionAttempts = 0;
        resolve(true);
      });

      this.socket.on('connection_success', (data) => {
        console.log('✅ Server confirmed connection for user:', data.userId);
      });

      this.socket.on('new_message', (message: Message) => {
        console.log('📨 New message received:', message);
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      });

      this.socket.on('message_sent', (message: Message) => {
        console.log('✅ Message sent confirmed:', message._id);
        this.messageSentHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in message sent handler:', error);
          }
        });
      });

      this.socket.on('message_error', (data: any) => {
        console.error('❌ Message error:', data);
        this.notifyError(data.error || 'Failed to send message');
      });

      this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
        console.log('⌨️  User typing:', data);
        this.typingHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in typing handler:', error);
          }
        });
      });

      this.socket.on('conversation_updated', (data: any) => {
        console.log('🔄 Conversation updated:', data);
        this.conversationUpdateHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in conversation update handler:', error);
          }
        });
      });

      this.socket.on('messages_read', (data: any) => {
        console.log('👁️  Messages read:', data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message || error);
        this.notifyError('Connection error: ' + (error.message || 'Unknown error'));
        this.connectionAttempts++;
        resolve(false);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('👋 WebSocket disconnected:', reason);
        // Auto-reconnect on unexpected disconnections (but not if it's a logout)
        if (reason === 'io server disconnect' || reason === 'io client namespace disconnect') {
          console.log('🔄 Attempting to reconnect...');
          setTimeout(() => {
            this.connect().catch(err => console.error('Reconnection failed:', err));
          }, 3000);
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        this.notifyError('Socket error: ' + error);
      });

      // Set a timeout to resolve if connection takes too long
      setTimeout(() => {
        if (!this.socket?.connected) {
          console.warn('⏱️  Connection timeout');
          resolve(false);
        }
      }, 5000);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('✅ WebSocket disconnected');
    }
  }

  async sendMessage(receiverId: string, message: string) {
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      this.notifyError('Connection not established');
      return;
    }

    if (!this.socket.connected) {
      console.warn('⚠️  Socket not connected, attempting to reconnect...');
      const connected = await this.connect();
      if (!connected) {
        this.notifyError('Failed to establish connection');
        return;
      }
    }

    console.log('📤 Sending message to:', receiverId);
    this.socket.emit('send_message', { receiverId, message });
  }

  sendTyping(receiverId: string, isTyping: boolean) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot send typing indicator');
      return;
    }

    this.socket.emit('typing', { receiverId, isTyping });
  }

  markAsRead(senderId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot mark as read');
      return;
    }

    this.socket.emit('mark_as_read', { senderId });
  }

  // Subscribe to new messages
  onNewMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Subscribe to typing indicators
  onTyping(handler: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  // Subscribe to message sent confirmations
  onMessageSent(handler: (message: Message) => void) {
    this.messageSentHandlers.push(handler);
    return () => {
      this.messageSentHandlers = this.messageSentHandlers.filter(h => h !== handler);
    };
  }

  // Subscribe to conversation updates
  onConversationUpdate(handler: (data: any) => void) {
    this.conversationUpdateHandlers.push(handler);
    return () => {
      this.conversationUpdateHandlers = this.conversationUpdateHandlers.filter(h => h !== handler);
    };
  }

  // Subscribe to errors
  onError(handler: (error: any) => void) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  // Notify all error handlers
  private notifyError(error: any) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();