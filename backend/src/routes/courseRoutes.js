const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.post('/add', courseController.addCourse);

module.exports = router;
