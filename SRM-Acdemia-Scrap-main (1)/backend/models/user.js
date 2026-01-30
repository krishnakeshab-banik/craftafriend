const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    registrationNumber: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    batch: {
        type: String,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 500
    },
    linkedin: {
        type: String,
        trim: true
    },
    github: {
        type: String,
        trim: true
    },
    instagram: {
        type: String,
        trim: true
    },
    portfolio: {
        type: String,
        trim: true
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    sessionToken: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
