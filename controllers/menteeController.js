const User = require('../models/User');
const MenteeProfile = require('../models/MenteeProfile');
const Issue = require('../models/Issue');
const AcademicRecord = require('../models/AcademicRecord');
const Achievement = require('../models/Achievement');

// @desc    Create mentee profile
// @route   POST /api/mentee/profile
// @access  Private (Mentee only)
exports.createProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await MenteeProfile.findOne({ user: req.user._id });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                error: 'Profile already exists'
            });
        }

        // Create profile
        const profile = await MenteeProfile.create({
            user: req.user._id,
            ...req.body
        });

        // Update user model to mark profile as completed
        await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });

        return res.status(201).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Error creating profile:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update mentee profile
// @route   PUT /api/mentee/profile
// @access  Private (Mentee only)
exports.updateProfile = async (req, res) => {
    try {
        const profile = await MenteeProfile.findOneAndUpdate(
            { user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get mentee profile
// @route   GET /api/mentee/profile
// @access  Private (Mentee only)
exports.getProfile = async (req, res) => {
    try {
        const profile = await MenteeProfile.findOne({ user: req.user._id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Error getting profile:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Report a new issue
// @route   POST /api/mentee/issues
// @access  Private (Mentee only)
exports.createIssue = async (req, res) => {
    try {
        // Get mentee's assigned mentor
        const mentee = await User.findById(req.user._id);
        if (!mentee) {
            return res.status(404).json({
                success: false,
                error: 'Mentee not found'
            });
        }

        if (!mentee.assignedMentor) {
            return res.status(400).json({
                success: false,
                error: 'No assigned mentor found'
            });
        }

        // Create issue
        const issue = await Issue.create({
            mentee: req.user._id,
            mentor: mentee.assignedMentor,
            ...req.body
        });

        return res.status(201).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error("Error creating issue:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all issues reported by mentee
// @route   GET /api/mentee/issues
// @access  Private (Mentee only)
exports.getIssues = async (req, res) => {
    try {
        // Get all issues where the current user is the mentee, 
        // regardless of whether they or their mentor created it
        const issues = await Issue.find({ mentee: req.user._id }).sort('-createdAt');

        return res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get specific issue details
// @route   GET /api/mentee/issues/:issueId
// @access  Private (Mentee only)
exports.getIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.issueId).populate({
            path: 'comments.user',
            select: 'email role'
        });

        if (!issue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        // Check if issue belongs to mentee
        if (issue.mentee.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this issue'
            });
        }

        return res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error("Error fetching issue:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Add/Update academic details
// @route   POST /api/mentee/academics
// @access  Private (Mentee only)
exports.updateAcademics = async (req, res) => {
    try {
        // Log request body for debugging
        console.log('Update academics request body:', JSON.stringify(req.body));

        // Check if academic record exists
        let academicRecord = await AcademicRecord.findOne({ mentee: req.user._id });

        if (academicRecord) {
            // Update existing record - only update the fields that are provided in the request

            // Update semesterGPA if provided
            if (req.body.semesterGPA !== undefined) {
                academicRecord.semesterGPA = req.body.semesterGPA;
            }

            // Update moocCourses if provided
            if (req.body.moocCourses !== undefined) {
                academicRecord.moocCourses = req.body.moocCourses;
            }

            // Update certifications if provided
            if (req.body.certifications !== undefined) {
                academicRecord.certifications = req.body.certifications;
            }

            // Handle semester marksheets update if provided
            if (req.body.semesterMarksheets !== undefined) {
                academicRecord.semesterMarksheets = req.body.semesterMarksheets;
            }

            // Handle backlogs update if provided
            if (req.body.backlogs !== undefined) {
                academicRecord.backlogs = Number(req.body.backlogs) || 0;
            }

            await academicRecord.save();
        } else {
            // Create new record with provided fields
            const newRecordData = {
                mentee: req.user._id,
            };

            // Only include fields that are provided in the request
            if (req.body.semesterGPA !== undefined) {
                newRecordData.semesterGPA = req.body.semesterGPA;
            }

            if (req.body.moocCourses !== undefined) {
                newRecordData.moocCourses = req.body.moocCourses;
            }

            if (req.body.certifications !== undefined) {
                newRecordData.certifications = req.body.certifications;
            }

            if (req.body.backlogs !== undefined) {
                newRecordData.backlogs = Number(req.body.backlogs) || 0;
            }

            if (req.body.semesterMarksheets !== undefined) {
                newRecordData.semesterMarksheets = req.body.semesterMarksheets;
            }

            academicRecord = await AcademicRecord.create(newRecordData);
        }

        return res.status(200).json({
            success: true,
            data: academicRecord
        });
    } catch (error) {
        console.error('Error updating academics:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
};

// @desc    Get academic details
// @route   GET /api/mentee/academics
// @access  Private (Mentee only)
exports.getAcademics = async (req, res) => {
    try {
        const academicRecord = await AcademicRecord.findOne({ mentee: req.user._id });

        if (!academicRecord) {
            return res.status(404).json({
                success: false,
                error: 'Academic record not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: academicRecord
        });
    } catch (error) {
        console.error("Error fetching academics:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Report a new achievement
// @route   POST /api/mentee/achievements
// @access  Private (Mentee only)
exports.createAchievement = async (req, res) => {
    try {
        // Get mentee's assigned mentor
        const mentee = await User.findById(req.user._id);
        if (!mentee) {
            return res.status(404).json({
                success: false,
                error: 'Mentee not found'
            });
        }

        if (!mentee.assignedMentor) {
            return res.status(400).json({
                success: false,
                error: 'No assigned mentor found'
            });
        }

        // Verify the mentee's assigned mentor exists
        const mentor = await User.findById(mentee.assignedMentor);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Assigned mentor not found'
            });
        }

        // Create achievement
        const achievement = await Achievement.create({
            mentee: mentee._id,
            mentor: mentee.assignedMentor,
            ...req.body
        });

        console.log(`Achievement created: ${achievement._id} for mentee: ${mentee._id}, mentor: ${mentee.assignedMentor}`);

        return res.status(201).json({
            success: true,
            data: achievement
        });
    } catch (error) {
        console.error("Error creating achievement:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all achievements
// @route   GET /api/mentee/achievements
// @access  Private (Mentee only)
exports.getAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find({ mentee: req.user._id }).sort('-dateOfAchievement');

        return res.status(200).json({
            success: true,
            count: achievements.length,
            data: achievements
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get dashboard data
// @route   GET /api/mentee/dashboard
// @access  Private (Mentee only)
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user details with populate
        const user = await User.findById(userId).populate("assignedMentor");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Count open issues
        const pendingIssues = await Issue.countDocuments({
            mentee: userId,
            status: { $ne: "Resolved" },
        });

        // Get achievements count - default to checking all achievements if isCompleted is not set
        const completedAchievements = await Achievement.countDocuments({
            mentee: userId,
            $or: [
                { isCompleted: true },
                { isCompleted: { $exists: false } }
            ]
        });

        console.log(`Found ${completedAchievements} achievements for mentee ${userId}`);

        // Get recent achievements
        const recentAchievements = await Achievement.find({
            mentee: userId,
            $or: [
                { isCompleted: true },
                { isCompleted: { $exists: false } }
            ]
        })
            .sort({ updatedAt: -1 })
            .limit(5);

        // Get academic record to retrieve backlog count
        const academicRecord = await AcademicRecord.findOne({ mentee: userId });
        const backlogs = academicRecord ? academicRecord.backlogs : 0;

        // Calculate profile completion
        const profileCompletion = calculateProfileCompletion(user);

        // Prepare the response
        const response = {
            profileCompletion,
            pendingIssues,
            completedAchievements,
            backlogs,
            upcomingEvents: [],
            recentAchievements,
        };

        // Add mentor info if assigned
        if (user.assignedMentor) {
            response.mentorInfo = {
                name: user.assignedMentor.name,
                email: user.assignedMentor.email,
                phone: user.assignedMentor.phone,
            };
        }

        return res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error("Error in getDashboard:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

/**
 * Helper function to calculate profile completion percentage
 * @param {Object} user - User object
 * @returns {number} - Completion percentage
 */
const calculateProfileCompletion = (user) => {
    // Default to 0 or 50% if user has profileCompleted flag
    if (!user) return 0;
    if (user.profileCompleted) return 100;

    // If profile isn't explicitly completed, return 50%
    // This is a simplified version - you can enhance this with more detailed calculation
    return 50;
};

// @desc    Add a comment to an issue
// @route   POST /api/mentee/issues/:issueId/comments
// @access  Private (Mentee only)
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Comment text is required'
            });
        }

        const issue = await Issue.findById(req.params.issueId);

        if (!issue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        // Check if issue belongs to mentee
        if (issue.mentee.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this issue'
            });
        }

        // Add comment
        issue.comments.push({
            user: req.user._id,
            text
        });

        await issue.save();

        // Get the newly added comment with proper timestamp
        const newComment = issue.comments[issue.comments.length - 1];

        return res.status(200).json({
            success: true,
            data: newComment
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 