const express = require('express');
const router = express.Router();
const { Register, Login, getAllUsers, deleteUser } = require('../controller/userController');

const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

router.post('/login', Login);

router.post('/register', verifyToken, isAdmin, Register);
router.get('/all', verifyToken, isAdmin, getAllUsers);
router.delete('/delete/:id', verifyToken, isAdmin, deleteUser);


module.exports = router;
