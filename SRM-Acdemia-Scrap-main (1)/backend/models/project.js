const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    members: {
        type: Number,
        required: true
    },
    github: {
        type: String,
    },
    category: {
        type: String,
        enum: ['Industry', 'In-house', 'Personal', 'Research Paper', 'Journal', 'Other'],
        default: 'Personal',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
