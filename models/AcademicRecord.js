const mongoose = require('mongoose');

const AcademicRecordSchema = new mongoose.Schema({
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semesterGPA: [{
        semester: {
            type: Number,
            required: true
        },
        gpa: {
            type: Number,
            required: true
        }
    }],
    moocCourses: [String],
    certifications: [String],
    semesterMarksheets: [{
        semester: {
            type: Number,
            required: true
        },
        imageUrl: {
            type: String
        }
    }],
    backlogs: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AcademicRecord', AcademicRecordSchema); 