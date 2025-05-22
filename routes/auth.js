const express = require('express');
const { registerMentor, registerMentee, login, getMe } = require('../controllers/authController');
const { protect, isMentor } = require('../middleware/auth');

const router = express.Router();

// Register routes
router.post('/register/mentor', registerMentor);
router.post('/register/mentee', registerMentee); // Allow public registration of mentees

// Login route
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router; 