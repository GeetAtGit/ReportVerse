const express = require('express');
const {
    createProfile,
    updateProfile,
    getProfile,
    createIssue,
    getIssues,
    getIssue,
    addComment,
    updateAcademics,
    getAcademics,
    createAchievement,
    getAchievements,
    getDashboard
} = require('../controllers/menteeController');
const { protect, isMentee } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(isMentee);

// Profile routes
router.route('/profile')
    .post(createProfile)
    .put(updateProfile)
    .get(getProfile);

// Issues routes
router.route('/issues')
    .post(createIssue)
    .get(getIssues);
router.get('/issues/:issueId', getIssue);
router.post('/issues/:issueId/comments', addComment);

// Academic routes
router.route('/academics')
    .post(updateAcademics)
    .get(getAcademics);

// Achievement routes
router.route('/achievements')
    .post(createAchievement)
    .get(getAchievements);

// Dashboard route
router.get('/dashboard', getDashboard);

module.exports = router; 