const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    maxMembers: {
        type: Number,
        default: 10
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }]
}, {
    timestamps: true
});

// Index for faster queries
TeamSchema.index({ 'members.user': 1 });
TeamSchema.index({ createdBy: 1 });

// Virtual for member count
TeamSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Method to check if team is full
TeamSchema.methods.isFull = function () {
    return this.members.length >= this.maxMembers;
};

// Method to check if user is a member
TeamSchema.methods.isMember = function (userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user is admin
TeamSchema.methods.isAdmin = function (userId) {
    const member = this.members.find(member => member.user.toString() === userId.toString());
    return member && member.role === 'admin';
};

module.exports = mongoose.model('Team', TeamSchema);
