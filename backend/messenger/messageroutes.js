// routes/message.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Message = require('../messenger/Message');
const Conversation = require('../messenger/Conversation');
const User = require('../user/User');
const { authentication } = require('../middlewares/authMiddleware');

// Helper function to sort participants
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

// Get all conversations for the logged-in user
router.get('/conversations', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'firstname lastname email picture')
        .sort({ lastMessageTime: -1 });
        
        // Format conversations
        const formattedConversations = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
            return {
                conversationId: conv._id.toString(),
                user: otherUser,
                lastMessage: conv.lastMessage || 'No messages yet',
                lastMessageTime: conv.lastMessageTime || new Date(),
                unreadCount: conv.unreadCount?.get(userId.toString()) || 0
            };
        });
        
        res.status(200).send(formattedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).send({ message: 'Error fetching conversations', error: error.message });
    }
});

// Get or create conversation with a user
router.get('/conversation/:userId', authentication, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId;
        
        // Validate that otherUserId is different from currentUserId
        if (currentUserId === otherUserId) {
            return res.status(400).send({ message: 'Cannot create conversation with yourself' });
        }
        
        // Check if other user exists
        const otherUser = await User.findById(otherUserId).select('firstname lastname email picture');
        if (!otherUser) {
            return res.status(404).send({ message: 'User not found' });
        }
        
        // Generate participant key
        const participantKey = generateParticipantKey(currentUserId, otherUserId);
        const [id1, id2] = sortParticipants(currentUserId, otherUserId);
        
        // Find existing conversation
        let conversation = await Conversation.findOne({
            participantKey: participantKey
        });
        
        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = new Conversation({
                participants: [id1, id2],
                participantKey: participantKey,
                lastMessage: 'Conversation started',
                lastMessageTime: new Date(),
                unreadCount: new Map()
            });
            await conversation.save();
            console.log(`✅ Created new conversation: ${participantKey}`);
        }
        
        // Get messages between users
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'firstname lastname email picture')
        .populate('receiver', 'firstname lastname email picture')
        .sort({ createdAt: 1 });
        
        res.status(200).send({
            conversation: {
                conversationId: conversation._id.toString(),
                user: otherUser,
                lastMessage: conversation.lastMessage || 'No messages yet',
                lastMessageTime: conversation.lastMessageTime || new Date(),
                unreadCount: conversation.unreadCount?.get(currentUserId.toString()) || 0
            },
            messages: messages
        });
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).send({ message: 'Error getting conversation', error: error.message });
    }
});

// Get messages between two users
router.get('/:userId', authentication, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId;
        
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'firstname lastname email picture')
        .populate('receiver', 'firstname lastname email picture')
        .sort({ createdAt: 1 });
        
        // Mark messages as read
        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: currentUserId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );
        
        // Update unread count in conversation
        const participantKey = generateParticipantKey(currentUserId, otherUserId);
        const conversation = await Conversation.findOne({
            participantKey: participantKey
        });
        
        if (conversation) {
            conversation.unreadCount.set(currentUserId.toString(), 0);
            await conversation.save();
        }
        
        res.status(200).send(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send({ message: 'Error fetching messages', error: error.message });
    }
});

// Send a new message
router.post('/send', authentication, async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user.userId;
        
        if (!receiverId || !message) {
            return res.status(400).send({ message: 'Receiver ID and message are required' });
        }
        
        // Validate that receiverId is different from senderId
        if (senderId === receiverId) {
            return res.status(400).send({ message: 'Cannot send message to yourself' });
        }
        
        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).send({ message: 'Receiver not found' });
        }
        
        // Create new message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message
        });
        
        await newMessage.save();
        
        // Populate sender and receiver info
        await newMessage.populate('sender', 'firstname lastname email picture');
        await newMessage.populate('receiver', 'firstname lastname email picture');
        
        // Generate participant key
        const participantKey = generateParticipantKey(senderId, receiverId);
        const [id1, id2] = sortParticipants(senderId, receiverId);
        
        // Update or create conversation
        let conversation = await Conversation.findOne({
            participantKey: participantKey
        });
        
        if (!conversation) {
            // Create with ALL required fields including participantKey
            conversation = new Conversation({
                participants: [id1, id2],
                participantKey: participantKey,
                lastMessage: message,
                lastMessageTime: new Date(),
                unreadCount: new Map()
            });
            console.log(`✅ Created new conversation: ${participantKey}`);
        } else {
            // Update existing
            conversation.lastMessage = message;
            conversation.lastMessageTime = new Date();
        }
        
        // Increment unread count for receiver
        const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
        conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
        
        await conversation.save();
        
        res.status(201).send({
            message: 'Message sent successfully',
            data: newMessage,
            conversationId: conversation._id.toString()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ message: 'Error sending message', error: error.message });
    }
});

// Delete a message (only for sender)
router.delete('/:messageId', authentication, async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.userId;
        
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).send({ message: 'Message not found' });
        }
        
        // Only sender can delete their message
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).send({ message: 'Not authorized to delete this message' });
        }
        
        await message.deleteOne();
        
        res.status(200).send({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).send({ message: 'Error deleting message', error: error.message });
    }
});

// Get unread message count
router.get('/unread/count', authentication, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const unreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false
        });
        
        res.status(200).send({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).send({ message: 'Error fetching unread count', error: error.message });
    }
});

module.exports = router;