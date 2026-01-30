const PastProject = require('../models/pastProject');
const User = require('../models/user');
const logger = require('../utils/logger');
const { getSessionTokenFromHeaders } = require('../utils/sessionUtils');

// Get all past projects
async function getAllPastProjects(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pastProjects = await PastProject.find()
            .populate('createdBy', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await PastProject.countDocuments();

        res.json({
            pastProjects,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        logger.error('Error fetching past projects: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch past projects' });
    }
}

// Get past project by ID
async function getPastProjectById(req, res) {
    try {
        const pastProject = await PastProject.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!pastProject) {
            return res.status(404).json({ error: 'Past project not found' });
        }

        res.json(pastProject);
    } catch (error) {
        logger.error('Error fetching past project: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch past project' });
    }
}

// Create past project
async function createPastProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { title, description, technologies, github, liveLink, images, teamMembers, completedAt } = req.body;

        const pastProject = await PastProject.create({
            title,
            description,
            technologies: technologies || [],
            github,
            liveLink,
            images: images || [],
            teamMembers: teamMembers || [],
            completedAt: completedAt || new Date(),
            createdBy: user._id
        });

        const populatedPastProject = await PastProject.findById(pastProject._id)
            .populate('createdBy', 'name email');

        logger.info(`Past project created: ${pastProject.title} by ${user.email}`);
        res.status(201).json(populatedPastProject);
    } catch (error) {
        logger.error('Error creating past project: ' + error.message);
        res.status(500).json({ error: 'Failed to create past project', details: error.message });
    }
}

// Update past project
async function updatePastProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const pastProject = await PastProject.findById(req.params.id);

        if (!pastProject) {
            return res.status(404).json({ error: 'Past project not found' });
        }

        if (pastProject.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this past project' });
        }

        const { title, description, technologies, github, liveLink, images, teamMembers, completedAt } = req.body;

        if (title) pastProject.title = title;
        if (description) pastProject.description = description;
        if (technologies !== undefined) pastProject.technologies = technologies;
        if (github !== undefined) pastProject.github = github;
        if (liveLink !== undefined) pastProject.liveLink = liveLink;
        if (images !== undefined) pastProject.images = images;
        if (teamMembers !== undefined) pastProject.teamMembers = teamMembers;
        if (completedAt !== undefined) pastProject.completedAt = completedAt;

        await pastProject.save();

        const updatedPastProject = await PastProject.findById(pastProject._id)
            .populate('createdBy', 'name email');

        logger.info(`Past project updated: ${pastProject.title}`);
        res.json(updatedPastProject);
    } catch (error) {
        logger.error('Error updating past project: ' + error.message);
        res.status(500).json({ error: 'Failed to update past project' });
    }
}

// Delete past project
async function deletePastProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const pastProject = await PastProject.findById(req.params.id);

        if (!pastProject) {
            return res.status(404).json({ error: 'Past project not found' });
        }

        if (pastProject.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this past project' });
        }

        await PastProject.findByIdAndDelete(req.params.id);

        logger.info(`Past project deleted: ${pastProject.title}`);
        res.json({ message: 'Past project deleted successfully' });
    } catch (error) {
        logger.error('Error deleting past project: ' + error.message);
        res.status(500).json({ error: 'Failed to delete past project' });
    }
}

module.exports = {
    getAllPastProjects,
    getPastProjectById,
    createPastProject,
    updatePastProject,
    deletePastProject
};
