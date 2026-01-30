const Project = require('../models/project');
const User = require('../models/user');
const Team = require('../models/team');
const logger = require('../utils/logger');
const { getSessionTokenFromHeaders } = require('../utils/sessionUtils');

// Get all projects
async function getAllProjects(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;

        const projects = await Project.find()
            .populate('createdBy', 'name email')
            .populate('team', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Project.countDocuments();

        res.json({
            projects,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        logger.error('Error fetching projects: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
}

// Get project by ID
async function getProjectById(req, res) {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('team', 'name members');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        logger.error('Error fetching project: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
}

// Create project
async function createProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { title, desc, members, github, team, category } = req.body;

        const project = await Project.create({
            title,
            desc,
            members,
            github,
            category: category || 'Personal',
            createdBy: user._id,
            team: team || null
        });

        // If team is specified, add project to team
        if (team) {
            await Team.findByIdAndUpdate(team, {
                $push: { projects: project._id }
            });
        }

        const populatedProject = await Project.findById(project._id)
            .populate('createdBy', 'name email')
            .populate('team', 'name');

        logger.info(`Project created: ${project.title} by ${user.email}`);
        res.status(201).json(populatedProject);
    } catch (error) {
        logger.error('Error creating project: ' + error.message);
        res.status(500).json({ error: 'Failed to create project', details: error.message });
    }
}

// Update project
async function updateProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this project' });
        }

        const { title, desc, members, github, category } = req.body;

        if (title) project.title = title;
        if (desc) project.desc = desc;
        if (members !== undefined) project.members = members;
        if (github !== undefined) project.github = github;
        if (category) project.category = category;

        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('createdBy', 'name email')
            .populate('team', 'name');

        logger.info(`Project updated: ${project.title}`);
        res.json(updatedProject);
    } catch (error) {
        logger.error('Error updating project: ' + error.message);
        res.status(500).json({ error: 'Failed to update project' });
    }
}

// Delete project
async function deleteProject(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this project' });
        }

        // Remove from team if associated
        if (project.team) {
            await Team.findByIdAndUpdate(project.team, {
                $pull: { projects: project._id }
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        logger.info(`Project deleted: ${project.title}`);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        logger.error('Error deleting project: ' + error.message);
        res.status(500).json({ error: 'Failed to delete project' });
    }
}

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
