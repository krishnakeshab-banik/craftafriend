const Team = require('../models/team');
const User = require('../models/user');
const logger = require('../utils/logger');
const { getSessionTokenFromHeaders } = require

    ('../utils/sessionUtils');

// Get all teams with pagination and search
async function getAllTeams(req, res) {
    try {
        const { page = 1, limit = 10, search = '', tags = '' } = req.query;
        const query = { isPublic: true };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagArray };
        }

        const teams = await Team.find(query)
            .populate('createdBy', 'name email')
            .populate('members.user', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Team.countDocuments(query);

        res.json({
            teams,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        logger.error('Error fetching teams: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
}

// Get team by ID
async function getTeamById(req, res) {
    try {
        const team = await Team.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('members.user', 'name email registrationNumber')
            .populate('projects');

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        logger.error('Error fetching team: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
}

// Get user's teams
async function getUserTeams(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const teams = await Team.find({ 'members.user': user._id })
            .populate('createdBy', 'name email')
            .populate('members.user', 'name email')
            .sort({ createdAt: -1 });

        res.json(teams);
    } catch (error) {
        logger.error('Error fetching user teams: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
}

// Create team
async function createTeam(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, description, maxMembers, isPublic, tags } = req.body;

        const team = await Team.create({
            name,
            description,
            createdBy: user._id,
            maxMembers: maxMembers || 10,
            isPublic: isPublic !== undefined ? isPublic : true,
            tags: tags || [],
            members: [{
                user: user._id,
                role: 'admin',
                joinedAt: new Date()
            }]
        });

        // Add team to user's teams
        user.teams.push(team._id);
        await user.save();

        const populatedTeam = await Team.findById(team._id)
            .populate('createdBy', 'name email')
            .populate('members.user', 'name email');

        logger.info(`Team created: ${team.name} by ${user.email}`);
        res.status(201).json(populatedTeam);
    } catch (error) {
        logger.error('Error creating team: ' + error.message);
        res.status(500).json({ error: 'Failed to create team', details: error.message });
    }
}

// Join team
async function joinTeam(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.isMember(user._id)) {
            return res.status(400).json({ error: 'Already a member of this team' });
        }

        if (team.isFull()) {
            return res.status(400).json({ error: 'Team is full' });
        }

        team.members.push({
            user: user._id,
            role: 'member',
            joinedAt: new Date()
        });

        await team.save();

        // Add team to user's teams
        user.teams.push(team._id);
        await user.save();

        logger.info(`User ${user.email} joined team ${team.name}`);
        res.json({ message: 'Successfully joined team', team });
    } catch (error) {
        logger.error('Error joining team: ' + error.message);
        res.status(500).json({ error: 'Failed to join team' });
    }
}

// Leave team
async function leaveTeam(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        const user = await User.findOne({ sessionToken });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (!team.isMember(user._id)) {
            return res.status(400).json({ error: 'Not a member of this team' });
        }

        if (team.isAdmin(user._id) && team.members.length > 1) {
            return res.status(400).json({ error: 'Admin cannot leave team with members. Transfer admin first.' });
        }

        team.members = team.members.filter(m => m.user.toString() !== user._id.toString());
        await team.save();

        // Remove team from user's teams
        user.teams = user.teams.filter(t => t.toString() !== team._id.toString());
        await user.save();

        logger.info(`User ${user.email} left team ${team.name}`);
        res.json({ message: 'Successfully left team' });
    } catch (error) {
        logger.error('Error leaving team: ' + error.message);
        res.status(500).json({ error: 'Failed to leave team' });
    }
}

module.exports = {
    getAllTeams,
    getTeamById,
    getUserTeams,
    createTeam,
    joinTeam,
    leaveTeam
};
