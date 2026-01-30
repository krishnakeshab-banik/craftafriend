const express = require('express');
const router = express.Router();
const { handleSrmLogin, handleLogout } = require('../controllers/authController');

router.post('/login', handleSrmLogin);
router.get('/logout', handleLogout);

module.exports = router;
