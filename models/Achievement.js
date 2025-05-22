const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Sports', 'Competitive Exam', 'Internship', 'Research Publication', 'Award', 'Cultural Event', 'Technical Event', 'Hackathon', 'Other'],
        required: true
    },
    position: {
        type: String,
        enum: ['1st', '2nd', '3rd', 'Participation', 'Winner', 'Runner-up', 'Completed', 'Published', 'N/A'],
        default: 'N/A'
    },
    description: {
        type: String,
        required: true
    },
    dateOfAchievement: {
        type: Date,
        default: Date.now
    },
    isCompleted: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Achievement', AchievementSchema); 