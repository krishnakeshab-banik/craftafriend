const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const academicsRoutes = require('./academicsRoutes');
const userRoutes = require('./userRoutes');
const teamRoutes = require('./teamRoutes');
const projectRoutes = require('./projectRoutes');
const internshipRoutes = require('./internshipRoutes');
const pastProjectRoutes = require('./pastProjectRoutes');

// Mount routes
router.use('/api', authRoutes);
router.use('/api', academicsRoutes);
router.use('/api', userRoutes);
router.use('/api/teams', teamRoutes);
router.use('/api/projects', projectRoutes);
router.use('/api/internships', internshipRoutes);
router.use('/api/past-projects', pastProjectRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Custom SRM Backend is running' });
});

module.exports = router;
