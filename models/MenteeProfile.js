const mongoose = require('mongoose');

const MenteeProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: String,
    registrationNo: String,
    section: String,
    rollNo: String,
    branch: String,
    mobileNo: String,
    hostelBlockNo: String,
    roomNo: String,
    bloodGroup: String,
    dob: Date,
    alumniFamily: {
        status: {
            type: Boolean,
            default: false
        },
        details: String
    },
    fatherDetails: {
        name: String,
        occupation: {
            type: String,
            enum: ['Entrepreneur', 'Family business', 'Public Sector', 'Professional', 'Govt. Employee', 'Pvt. Company', 'Other']
        },
        organizationDesignation: String,
        mobileNo: String,
        emailId: String
    },
    motherDetails: {
        name: String,
        occupation: {
            type: String,
            enum: ['Home Maker', 'Entrepreneur', 'Family business', 'Public Sector', 'Professional', 'Govt. Employee', 'Pvt. Company', 'Other']
        },
        organizationDesignation: String,
        mobileNo: String,
        emailId: String
    },
    communicationAddress: {
        address: String,
        pinCode: String
    },
    permanentAddress: {
        address: String,
        pinCode: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MenteeProfile', MenteeProfileSchema); 