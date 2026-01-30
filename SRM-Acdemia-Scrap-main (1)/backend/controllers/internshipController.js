const Internship = require('../models/internship');
const User = require('../models/user');
const logger = require('../utils/logger');
const { getSessionTokenFromHeaders } = require('../utils/sessionUtils');

// Get all internships
async function getAllInternships(req, res) {
    try {
        const { page = 1, limit = 10, tags = '' } = req.query;
        const query = {};

        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagArray };
        }

        const internships = await Internship.find(query)
            .populate('postedBy', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Internship.countDocuments(query);

        res.json({
            internships,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        logger.error('Error fetching internships: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch internships' });
    }
}

// Get internship by ID
async function getInternshipById(req, res) {
    try {
        const internship = await Internship.findById(req.params.id)
            .populate('postedBy', 'name email');

        if (!internship) {
            return res.status(404).json({ error: 'Internship not found' });
        }

        res.json(internship);
    } catch (error) {
        logger.error('Error fetching internship: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch internship' });
    }
}

// Create internship
async function createInternship(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { title, company, description, location, duration, stipend, applicationLink, deadline, tags } = req.body;

        const internship = await Internship.create({
            title,
            company,
            description,
            location,
            duration,
            stipend,
            applicationLink,
            deadline,
            tags: tags || [],
            postedBy: user._id
        });

        const populatedInternship = await Internship.findById(internship._id)
            .populate('postedBy', 'name email');

        logger.info(`Internship created: ${internship.title} by ${user.email}`);
        res.status(201).json(populatedInternship);
    } catch (error) {
        logger.error('Error creating internship: ' + error.message);
        res.status(500).json({ error: 'Failed to create internship', details: error.message });
    }
}

// Update internship
async function updateInternship(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ error: 'Internship not found' });
        }

        if (internship.postedBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this internship' });
        }

        const { title, company, description, location, duration, stipend, applicationLink, deadline, tags } = req.body;

        if (title) internship.title = title;
        if (company) internship.company = company;
        if (description) internship.description = description;
        if (location !== undefined) internship.location = location;
        if (duration !== undefined) internship.duration = duration;
        if (stipend !== undefined) internship.stipend = stipend;
        if (applicationLink !== undefined) internship.applicationLink = applicationLink;
        if (deadline !== undefined) internship.deadline = deadline;
        if (tags !== undefined) internship.tags = tags;

        await internship.save();

        const updatedInternship = await Internship.findById(internship._id)
            .populate('postedBy', 'name email');

        logger.info(`Internship updated: ${internship.title}`);
        res.json(updatedInternship);
    } catch (error) {
        logger.error('Error updating internship: ' + error.message);
        res.status(500).json({ error: 'Failed to update internship' });
    }
}

// Delete internship
async function deleteInternship(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ error: 'Internship not found' });
        }

        if (internship.postedBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this internship' });
        }

        await Internship.findByIdAndDelete(req.params.id);

        logger.info(`Internship deleted: ${internship.title}`);
        res.json({ message: 'Internship deleted successfully' });
    } catch (error) {
        logger.error('Error deleting internship: ' + error.message);
        res.status(500).json({ error: 'Failed to delete internship' });
    }
}

module.exports = {
    getAllInternships,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship
};
