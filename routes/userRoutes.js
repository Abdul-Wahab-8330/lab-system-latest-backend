const express = require('express');
const router = express.Router();
const { Register, Login, getAllUsers, deleteUser } = require('../controller/userController');


router.post('/register', Register);
router.post('/login', Login);
router.get('/all', getAllUsers);
router.delete('/delete/:id', deleteUser);


module.exports = router;
