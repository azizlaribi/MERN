// models/Conversation.js - FIXED VERSION (no duplicate index warning)
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    // Regular participants array - NO unique index on this field
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    
    // Participant key field for unique constraint
    participantKey: {
        type: String,
        unique: true,
        sparse: true,
        required: true,
        index: true
    },
    
    lastMessage: {
        type: String,
        default: ''
    },
    
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { 
    timestamps: true
});

// Pre-save middleware to generate participant key
conversationSchema.pre('save', function(next) {
    try {
        if (this.participants && this.participants.length === 2) {
            // Sort participant IDs for consistent ordering
            this.participants.sort((a, b) => {
                return a.toString().localeCompare(b.toString());
            });
            
            // Generate participant key from sorted IDs
            const ids = this.participants.map(p => p.toString());
            this.participantKey = ids.join('_');
            
            if (!this.participantKey) {
                return next(new Error('Failed to generate participant key'));
            }
            
            console.log(`✅ Generated participantKey: ${this.participantKey}`);
        }
        next();
    } catch (error) {
        console.error(`❌ Error in pre-save: ${error.message}`);
        next(error);
    }
});

// Static helper method to generate participant key
conversationSchema.statics.generateParticipantKey = function(userId1, userId2) {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return ids.join('_');
};

// Instance method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
    return this.participants.some(p => p.toString() === userId.toString());
};

// Instance method to get other participant
conversationSchema.methods.getOtherParticipant = function(userId) {
    return this.participants.find(p => p.toString() !== userId.toString());
};

module.exports = mongoose.model('Conversation', conversationSchema);