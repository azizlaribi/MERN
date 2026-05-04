// types/message.types.ts
export interface Message {
  _id: string;
  sender: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    picture?: string;
  };
  receiver: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    picture?: string;
  };
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  conversationId: string;
  user: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    picture?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: string;
  message: string;
}