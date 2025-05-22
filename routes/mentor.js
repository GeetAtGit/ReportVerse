const express = require('express');
const {
    getMentees,
    getMenteeProfile,
    getMenteeAcademics,
    getMenteeAchievements,
    getIssues,
    getIssue,
    addComment,
    getAchievements,
    getDashboard,
    assignMentee,
    createIssue
} = require('../controllers/mentorController');
const { protect, isMentor } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(isMentor);

// Dashboard route
router.get('/dashboard', getDashboard);

// Mentee routes
router.get('/mentees', getMentees);
router.post('/mentees/assign', assignMentee);
router.get('/mentees/:menteeId/profile', getMenteeProfile);
router.get('/mentees/:menteeId/academics', getMenteeAcademics);
router.get('/mentees/:menteeId/achievements', getMenteeAchievements);

// Issues routes
router.get('/issues', getIssues);
router.get('/issues/:issueId', getIssue);
router.post('/issues/:issueId/comment', addComment);
router.post('/issues', createIssue);

// Achievements routes
router.get('/achievements', getAchievements);

module.exports = router; 