const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
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
    issueType: {
        type: String,
        enum: ['Academic', 'Grievances', 'Ragging', 'Harassment', 'Accommodation', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'Under Review', 'Resolved', 'Closed'],
        default: 'Open'
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Issue', IssueSchema); 