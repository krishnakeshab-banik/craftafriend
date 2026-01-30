const express = require('express');
const router = express.Router();
const {
    getAllTeams,
    getTeamById,
    getUserTeams,
    createTeam,
    joinTeam,
    leaveTeam
} = require('../controllers/teamController');

router.get('/', getAllTeams);
router.get('/my-teams', getUserTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.post('/:id/join', joinTeam);
router.post('/:id/leave', leaveTeam);

module.exports = router;
