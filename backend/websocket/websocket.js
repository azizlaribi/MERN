// websocket/websocket.js - FIXED VERSION
const jwt = require('jsonwebtoken');
const Message = require('../messenger/Message');
const Conversation = require('../messenger/Conversation');
const User = require('../user/User');

const connectedUsers = new Map(); // userId -> socket

// Helper function to sort participants for consistent conversation lookup
const sortParticipants = (userId1, userId2) => {
    const ids = [userId1.toString(), userId2.toString()];
    ids.sort();
    return [ids[0], ids[1]];
};

// Helper to generate participant key
const generateParticipantKey = (userId1, userId2) => {
    const [id1, id2] = sortParticipants(userId1, userId2);
    return `${id1}_${id2}`;
};

const setupWebSocket = (io) => {
    // Authentication middleware for socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    
    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.userId} connected`);
        
        // Store connected user
        connectedUsers.set(socket.userId.toString(), socket);
        
        // Join user to their own room for private messages
        socket.join(`user_${socket.userId}`);
        
        // Emit connection success
        socket.emit('connection_success', { userId: socket.userId });
        
        // Handle sending messages
        socket.on('send_message', async (data) => {
            let conversation = null;
            try {
                const { receiverId, message } = data;
                const senderId = socket.userId;
                
                console.log(`📨 Attempting to send message from ${senderId} to ${receiverId}`);
                
                // Validation
                if (!receiverId || !message) {
                    socket.emit('message_error', { error: 'Receiver ID and message are required' });
                    return;
                }
                
                if (senderId === receiverId) {
                    socket.emit('message_error', { error: 'Cannot send message to yourself' });
                    return;
                }
                
                // Verify receiver exists
                const receiver = await User.findById(receiverId);
                if (!receiver) {
                    socket.emit('message_error', { error: 'Receiver not found' });
                    return;
                }
                
                console.log(`✅ Receiver found: ${receiver.firstname} ${receiver.lastname}`);
                
                // Save message to database
                const newMessage = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    message: message
                });
                
                await newMessage.save();
                console.log(`💾 Message saved: ${newMessage._id}`);
                
                // Populate user info
                await newMessage.populate('sender', 'firstname lastname email picture');
                await newMessage.populate('receiver', 'firstname lastname email picture');
                
                // Generate participant key BEFORE creating conversation
                const participantKey = generateParticipantKey(senderId, receiverId);
                const [id1, id2] = sortParticipants(senderId, receiverId);
                
                console.log(`🔑 Generated participant key: ${participantKey}`);
                
                // Try to find existing conversation
                conversation = await Conversation.findOne({
                    participantKey: participantKey
                });
                
                if (conversation) {
                    console.log(`✅ Found existing conversation: ${conversation._id}`);
                } else {
                    console.log(`📝 Creating new conversation...`);
                    
                    // Create new conversation with ALL required fields
                    conversation = new Conversation({
                        participants: [id1, id2],
                        participantKey: participantKey, // ✅ EXPLICITLY SET THIS
                        lastMessage: message,
                        lastMessageTime: new Date(),
                        unreadCount: new Map()
                    });
                    
                    // Save the conversation
                    await conversation.save();
                    console.log(`✅ New conversation created: ${conversation._id}`);
                }
                
                // Update existing conversation
                if (conversation) {
                    conversation.lastMessage = message;
                    conversation.lastMessageTime = new Date();
                    
                    // Increment unread count for receiver
                    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
                    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
                    
                    await conversation.save();
                    console.log(`✅ Conversation updated`);
                }
                
                // Emit to sender (for immediate feedback)
                socket.emit('message_sent', newMessage);
                console.log(`📤 Message sent event emitted to sender`);
                
                // Emit to receiver if online
                const receiverSocket = connectedUsers.get(receiverId.toString());
                if (receiverSocket) {
                    receiverSocket.emit('new_message', newMessage);
                    
                    // Update conversation list for receiver
                    receiverSocket.emit('conversation_updated', {
                        conversationId: conversation._id.toString(),
                        lastMessage: message,
                        lastMessageTime: conversation.lastMessageTime,
                        sender: {
                            _id: senderId.toString(),
                            firstname: newMessage.sender.firstname,
                            lastname: newMessage.sender.lastname,
                            picture: newMessage.sender.picture
                        }
                    });
                    console.log(`📤 Message delivered to receiver (online)`);
                } else {
                    console.log(`⚠️  Receiver is not online - message saved for later delivery`);
                }
                
            } catch (error) {
                console.error(`❌ Error sending message:`, error);
                socket.emit('message_error', { 
                    error: 'Failed to send message',
                    details: error.message 
                });
            }
        });
        
        // Handle typing indicators
        socket.on('typing', (data) => {
            try {
                const { receiverId, isTyping } = data;
                
                if (!receiverId) {
                    socket.emit('typing_error', { error: 'Receiver ID is required' });
                    return;
                }
                
                const receiverSocket = connectedUsers.get(receiverId.toString());
                
                if (receiverSocket) {
                    receiverSocket.emit('user_typing', {
                        userId: socket.userId.toString(),
                        isTyping
                    });
                }
            } catch (error) {
                console.error('Error handling typing:', error);
            }
        });
        
        // Handle marking messages as read
        socket.on('mark_as_read', async (data) => {
            try {
                const { senderId } = data;
                const receiverId = socket.userId;
                
                if (!senderId) {
                    socket.emit('read_error', { error: 'Sender ID is required' });
                    return;
                }
                
                // Update all unread messages from sender to receiver
                const result = await Message.updateMany(
                    {
                        sender: senderId,
                        receiver: receiverId,
                        isRead: false
                    },
                    {
                        isRead: true,
                        readAt: new Date()
                    }
                );
                
                console.log(`📝 Marked ${result.modifiedCount} messages as read`);
                
                // Update conversation unread count
                const participantKey = generateParticipantKey(senderId, receiverId);
                const conversation = await Conversation.findOne({
                    participantKey: participantKey
                });
                
                if (conversation) {
                    conversation.unreadCount.set(receiverId.toString(), 0);
                    await conversation.save();
                    console.log(`✅ Conversation unread count reset`);
                }
                
                // Notify sender that messages were read
                const senderSocket = connectedUsers.get(senderId.toString());
                if (senderSocket) {
                    senderSocket.emit('messages_read', {
                        userId: receiverId.toString(),
                        readAt: new Date()
                    });
                    console.log(`📤 Read receipt sent to sender`);
                }
                
            } catch (error) {
                console.error('❌ Error marking messages as read:', error);
                socket.emit('read_error', { 
                    error: 'Failed to mark messages as read',
                    details: error.message 
                });
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`👋 User ${socket.userId} disconnected`);
            connectedUsers.delete(socket.userId.toString());
        });
        
        // Handle connection errors
        socket.on('connect_error', (error) => {
            console.error(`❌ Connection error for user ${socket.userId}:`, error);
        });
    });
};

module.exports = { setupWebSocket, connectedUsers };