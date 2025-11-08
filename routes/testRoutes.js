const express = require('express');
const router = express.Router();

const {CreateTestTemplate, GetAllTests, deleteTest, updateTest, searchTests} = require('../controller/testController');



router.post('/create-test', CreateTestTemplate);
router.get('/all', GetAllTests);
router.delete('/delete/:id', deleteTest);
router.put('/update/:id', updateTest);
router.get('/search', searchTests);

module.exports = router