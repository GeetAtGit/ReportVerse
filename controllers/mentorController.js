const User = require('../models/User');
const MenteeProfile = require('../models/MenteeProfile');
const Issue = require('../models/Issue');
const AcademicRecord = require('../models/AcademicRecord');
const Achievement = require('../models/Achievement');

// @desc    Get all assigned mentees
// @route   GET /api/mentor/mentees
// @access  Private (Mentor only)
exports.getMentees = async (req, res) => {
    try {
        const mentor = await User.findById(req.user.id).populate({
            path: 'mentees',
            select: 'email profileCompleted'
        });

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        // Get additional basic info for each mentee
        const menteesWithProfiles = await Promise.all(
            mentor.mentees.map(async (mentee) => {
                let profile = null;
                if (mentee.profileCompleted) {
                    profile = await MenteeProfile.findOne({ user: mentee._id }).select('name registrationNo branch');
                }

                return {
                    id: mentee._id,
                    email: mentee.email,
                    profileCompleted: mentee.profileCompleted,
                    name: profile ? profile.name : null,
                    registrationNo: profile ? profile.registrationNo : null,
                    branch: profile ? profile.branch : null
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: menteesWithProfiles.length,
            data: menteesWithProfiles
        });
    } catch (error) {
        console.error("Error getting mentees:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get full profile details of a specific mentee
// @route   GET /api/mentor/mentees/:menteeId/profile
// @access  Private (Mentor only)
exports.getMenteeProfile = async (req, res) => {
    try {
        const mentor = await User.findById(req.user.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        // Check if mentee is assigned to this mentor
        if (!mentor.mentees || !mentor.mentees.includes(req.params.menteeId)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this mentee\'s profile'
            });
        }

        // Get basic mentee info first
        const mentee = await User.findById(req.params.menteeId).select('email profileCompleted');
        if (!mentee) {
            return res.status(404).json({
                success: false,
                error: 'Mentee not found'
            });
        }

        // Check if profile is completed
        if (!mentee.profileCompleted) {
            // Return a 200 status with a specific message instead of 404
            return res.status(200).json({
                success: true,
                profileCompleted: false,
                data: {
                    user: mentee._id,
                    email: mentee.email,
                    profileCompleted: false
                },
                message: 'Mentee has not completed their profile yet'
            });
        }

        const profile = await MenteeProfile.findOne({ user: req.params.menteeId });

        if (!profile) {
            // This should rarely happen (profileCompleted=true but no profile found)
            return res.status(200).json({
                success: true,
                profileCompleted: false,
                data: {
                    user: mentee._id,
                    email: mentee.email,
                    profileCompleted: false
                },
                message: 'Mentee has not completed their profile yet'
            });
        }

        return res.status(200).json({
            success: true,
            profileCompleted: true,
            data: profile
        });
    } catch (error) {
        console.error("Error getting mentee profile:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get academic details of a specific mentee
// @route   GET /api/mentor/mentees/:menteeId/academics
// @access  Private (Mentor only)
exports.getMenteeAcademics = async (req, res) => {
    try {
        const mentor = await User.findById(req.user.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        // Check if mentee is assigned to this mentor
        if (!mentor.mentees || !mentor.mentees.includes(req.params.menteeId)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this mentee\'s academic records'
            });
        }

        // Get basic mentee info first
        const mentee = await User.findById(req.params.menteeId).select('email profileCompleted');
        if (!mentee) {
            return res.status(404).json({
                success: false,
                error: 'Mentee not found'
            });
        }

        const academicRecord = await AcademicRecord.findOne({ mentee: req.params.menteeId });

        if (!academicRecord) {
            // Return 200 with a message instead of 404
            return res.status(200).json({
                success: true,
                data: {
                    mentee: mentee._id,
                    semesterGPA: [],
                    moocCourses: [],
                    certifications: [],
                    semesterMarksheets: [],
                    backlogs: 0
                },
                message: 'Mentee has not added any academic records yet'
            });
        }

        return res.status(200).json({
            success: true,
            data: academicRecord
        });
    } catch (error) {
        console.error("Error getting mentee academics:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get achievements of a specific mentee
// @route   GET /api/mentor/mentees/:menteeId/achievements
// @access  Private (Mentor only)
exports.getMenteeAchievements = async (req, res) => {
    try {
        const mentor = await User.findById(req.user.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        // Check if mentee is assigned to this mentor
        if (!mentor.mentees || !mentor.mentees.includes(req.params.menteeId)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this mentee\'s achievements'
            });
        }

        const achievements = await Achievement.find({ mentee: req.params.menteeId }).sort('-dateOfAchievement');

        return res.status(200).json({
            success: true,
            count: achievements.length,
            data: achievements
        });
    } catch (error) {
        console.error("Error getting mentee achievements:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all issues reported by mentees
// @route   GET /api/mentor/issues
// @access  Private (Mentor only)
exports.getIssues = async (req, res) => {
    try {
        console.log("Finding issues for mentor ID:", req.user.id);

        // Get mentor to check for mentees
        const mentor = await User.findById(req.user.id);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        console.log("Mentor's mentees:", mentor.mentees);

        // Find all issues where this mentor is assigned
        const issues = await Issue.find({ mentor: req.user.id })
            .sort('-createdAt')
            .populate({
                path: 'mentee',
                select: 'email'
            });

        console.log(`Found ${issues.length} issues for mentor ${req.user.id}`);

        if (issues.length === 0) {
            // Try debugging - check if there are any issues at all
            const allIssues = await Issue.find({});
            console.log(`Total issues in database: ${allIssues.length}`);
            if (allIssues.length > 0) {
                console.log("Sample issue:", allIssues[0]);
            }
        }

        return res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });
    } catch (error) {
        console.error("Error getting issues:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get details of a specific issue
// @route   GET /api/mentor/issues/:issueId
// @access  Private (Mentor only)
exports.getIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.issueId)
            .populate({
                path: 'mentee',
                select: 'email'
            })
            .populate({
                path: 'comments.user',
                select: 'email role'
            });

        if (!issue) {
            return res.status(404).json({
                success: false,
                error: 'Issue not found'
            });
        }

        // Check if issue is assigned to this mentor
        if (issue.mentor.toString() !== req.user.id.toString()) {
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
        console.error("Error getting issue:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Add a comment to an issue
// @route   POST /api/mentor/issues/:issueId/comment
// @access  Private (Mentor only)
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

        // Check if issue is assigned to this mentor
        if (issue.mentor.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to comment on this issue'
            });
        }

        // Add comment
        issue.comments.push({
            user: req.user.id,
            text
        });

        // Update issue status if provided
        if (req.body.status && ['Open', 'Under Review', 'Resolved', 'Closed'].includes(req.body.status)) {
            issue.status = req.body.status;
        }

        await issue.save();

        return res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all achievements reported by mentees
// @route   GET /api/mentor/achievements
// @access  Private (Mentor only)
exports.getAchievements = async (req, res) => {
    try {
        const mentorId = req.user.id;

        // Verify mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: "Mentor not found",
            });
        }

        // Build query with safer ID reference
        let query = { mentor: mentorId };

        // Filter by type if provided
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by position if provided
        if (req.query.position) {
            query.position = req.query.position;
        }

        // Determine sort order
        const sortField = req.query.sort || '-dateOfAchievement';

        // Query achievements
        const achievements = await Achievement.find(query)
            .sort(sortField)
            .populate({
                path: 'mentee',
                select: 'email name'
            });

        console.log(`Found ${achievements.length} achievements for mentor ${mentorId}`);

        return res.status(200).json({
            success: true,
            count: achievements.length,
            data: achievements
        });
    } catch (error) {
        console.error("Error in getAchievements:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch achievements",
            error: error.message
        });
    }
};

// @desc    Get dashboard data for mentor
// @route   GET /api/mentor/dashboard
// @access  Private (Mentor only)
exports.getDashboard = async (req, res) => {
    try {
        const mentorId = req.user.id;
        console.log("Looking for mentor with ID:", mentorId);

        // Count total mentees assigned
        const mentor = await User.findById(mentorId);
        console.log("Found mentor:", mentor);

        // Check if mentor exists and initialize totalMentees
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: "Mentor not found",
            });
        }

        // Safely access mentees array with nullish coalescing
        const totalMentees = mentor.mentees?.length || 0;

        // Count pending issues
        const pendingIssues = await Issue.countDocuments({
            mentor: mentorId,
            status: { $ne: "Resolved" },
        });

        // Get recent issues (limited to 5)
        const recentIssues = await Issue.find({
            mentor: mentorId,
            status: { $ne: "Resolved" }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({
                path: 'mentee',
                select: 'email'
            });

        // Prepare the response
        const response = {
            totalMentees,
            pendingIssues,
            recentIssues
        };

        return res.status(200).json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error("Error in mentor getDashboard:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

// @desc    Assign mentee to mentor by email
// @route   POST /api/mentor/mentees/assign
// @access  Private (Mentor only)
exports.assignMentee = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Mentee email is required'
            });
        }

        // Find mentee by email
        const mentee = await User.findOne({ email, role: 'mentee' });

        if (!mentee) {
            return res.status(404).json({
                success: false,
                error: 'Mentee not found with this email'
            });
        }

        // Check if mentee is already assigned to any mentor
        if (mentee.assignedMentor) {
            return res.status(400).json({
                success: false,
                error: 'Mentee is already assigned to a mentor'
            });
        }

        // Update mentor's mentees array
        const mentor = await User.findById(req.user.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: 'Mentor not found'
            });
        }

        // Check if mentee is already in mentor's list
        if (mentor.mentees && mentor.mentees.includes(mentee._id)) {
            return res.status(400).json({
                success: false,
                error: 'Mentee is already assigned to you'
            });
        }

        // Add mentee to mentor's list
        if (!mentor.mentees) {
            mentor.mentees = [];
        }
        mentor.mentees.push(mentee._id);
        await mentor.save();

        // Update mentee's assignedMentor field
        mentee.assignedMentor = mentor._id;
        await mentee.save();

 
