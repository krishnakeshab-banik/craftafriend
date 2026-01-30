const express = require('express');
const router = express.Router();
const {
    getAllPastProjects,
    getPastProjectById,
    createPastProject,
    updatePastProject,
    deletePastProject
} = require('../controllers/pastProjectController');

router.get('/', getAllPastProjects);
router.get('/:id', getPastProjectById);
router.post('/', createPastProject);
router.put('/:id', updatePastProject);
router.delete('/:id', deletePastProject);

module.exports = router;
