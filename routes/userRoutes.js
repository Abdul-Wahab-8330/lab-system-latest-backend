const express = require('express');
const router = express.Router();
const { Register, Login, getAllUsers, deleteUser, changePassword, resetUserPassword } = require('../controller/userController');

const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

router.post('/login', Login);

router.post('/register', verifyToken, isAdmin, Register);
router.get('/all', verifyToken, isAdmin, getAllUsers);
router.delete('/delete/:id', verifyToken, isAdmin, deleteUser);

// User changes their own password (requires authentication)
router.post('/change-password', verifyToken, changePassword);

// Admin resets any user's password (requires authentication + admin role)
router.post('/reset-password', verifyToken, isAdmin, resetUserPassword);


module.exports = router;
