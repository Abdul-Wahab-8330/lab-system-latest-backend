const express = require('express');
const router = express.Router();

const {CreateTestTemplate, GetAllTests, deleteTest, updateTest} = require('../controller/testController');



router.post('/create-test', CreateTestTemplate);
router.get('/all', GetAllTests);
router.delete('/delete/:id', deleteTest);
router.put('/update/:id', updateTest);

module.exports = router