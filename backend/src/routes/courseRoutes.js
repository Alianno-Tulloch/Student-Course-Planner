const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.post('/add', courseController.addCourse);
router.post('/create', courseController.createNewGlobalCourse);
router.get('/schedule/:student_id', courseController.getStudentSchedule);

module.exports = router;
