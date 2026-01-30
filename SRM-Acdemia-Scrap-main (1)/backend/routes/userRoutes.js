const express = require('express');
const router = express.Router();
const { handleFetchUserDetails, handleUpdateUserProfile, getPublicProfile } = require('../controllers/userController');

router.get('/user', handleFetchUserDetails);
router.put('/user/profile', handleUpdateUserProfile);
router.get('/user/:userId/public', getPublicProfile);

module.exports = router;
