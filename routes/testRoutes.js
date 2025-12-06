const express = require('express');
const router = express.Router();

const {CreateTestTemplate, GetAllTests, deleteTest, updateTest, searchTests} = require('../controller/testController');
const verifyToken = require('../middleware/verifyToken');



router.post('/create-test', verifyToken, CreateTestTemplate);
router.get('/all', verifyToken, GetAllTests);
router.delete('/delete/:id', verifyToken, deleteTest);
router.put('/update/:id', verifyToken, updateTest);
router.get('/search', verifyToken, searchTests);

module.exports = router