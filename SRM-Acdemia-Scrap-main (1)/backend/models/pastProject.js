const mongoose = require('mongoose');

const PastProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    technologies: [{
        type: String,
        trim: true
    }],
    github: {
        type: String,
        trim: true
    },
    liveLink: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    teamMembers: [{
        type: String,
        trim: true
    }],
    completedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PastProject', PastProjectSchema);
