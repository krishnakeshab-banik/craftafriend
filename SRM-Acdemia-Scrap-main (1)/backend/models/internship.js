const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    stipend: {
        type: String,
        trim: true
    },
    applicationLink: {
        type: String,
        trim: true
    },
    deadline: {
        type: Date
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Internship', InternshipSchema);
