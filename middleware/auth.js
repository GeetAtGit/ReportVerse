const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No user found with this id'
            });
        }

        // Add user to request object
        req.user = {
            id: user._id,
            _id: user._id,
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

// Middleware to restrict access by role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Middleware specifically for mentors
exports.isMentor = (req, res, next) => {
    if (req.user.role !== 'mentor') {
        return res.status(403).json({
            success: false,
            error: 'Only mentors can access this route'
        });
    }
    next();
};

// Middleware specifically for mentees
exports.isMentee = (req, res, next) => {
    if (req.user.role !== 'mentee') {
        return res.status(403).json({
            success: false,
            error: 'Only mentees can access this route'
        });
    }
    next();
}; 