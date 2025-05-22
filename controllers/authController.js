const User = require('../models/User');
const generateToken = require('../utils/jwtGenerator');

// @desc    Register a mentor (TEMPORARY - for development)
// @route   POST /api/auth/register/mentor
// @access  Public
exports.registerMentor = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already in use'
            });
        }

        // Create new mentor
        const mentor = await User.create({
            email,
            password,
            name: name || email.split('@')[0], // Use name if provided or part of email as fallback
            phone,
            role: 'mentor'
        });

        // Generate token
        const token = generateToken(mentor._id);

        res.status(201).json({
            success: true,
            token,
            data: {
                id: mentor._id,
                email: mentor.email,
                name: mentor.name,
                phone: mentor.phone,
                role: mentor.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Register a new mentee
// @route   POST /api/auth/register/mentee
// @access  Public
exports.registerMentee = async (req, res) => {
    try {
        const { email, password, name, phone, mentorId } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already in use'
            });
        }

        // Create new mentee (without assigned mentor for now)
        const mentee = await User.create({
            email,
            password,
            role: 'mentee',
            name: name || email.split('@')[0], // Use name if provided or part of email as fallback
            phone
        });

        // If a mentorId was provided, auto-assign the mentee to that mentor
        if (mentorId) {
            try {
                // Find the mentor
                const mentor = await User.findById(mentorId);

                if (!mentor || mentor.role !== 'mentor') {
                    console.log('Invalid mentor ID provided during registration:', mentorId);
                } else {
                    // Initialize mentees array if it doesn't exist
                    if (!mentor.mentees) {
                        mentor.mentees = [];
                    }

                    // Add mentee to mentor's list
                    mentor.mentees.push(mentee._id);
                    await mentor.save();

                    // Update mentee's assignedMentor field
                    mentee.assignedMentor = mentor._id;
                    await mentee.save();

                    console.log(`Auto-assigned new mentee ${mentee._id} to mentor ${mentor._id}`);
                }
            } catch (assignError) {
                // Log the error but don't fail the registration
                console.error('Error auto-assigning mentee to mentor:', assignError);
            }
        }

        // Generate token
        const token = generateToken(mentee._id);

        res.status(201).json({
            success: true,
            token,
            data: {
                id: mentee._id,
                email: mentee.email,
                role: mentee.role,
                name: mentee.name,
                phone: mentee.phone
            }
        });
    } catch (error) {
        console.error('Mentee registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to register mentee'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                profileCompleted: user.profileCompleted
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                profileCompleted: user.profileCompleted,
                assignedMentor: user.assignedMentor,
                mentees: user.mentees
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};