const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.get('/departments', courseController.getDepartments);
router.get('/search', courseController.searchCourses);
router.post('/add', courseController.addCourse);
router.post('/create', courseController.createNewGlobalCourse);
router.get('/schedule/:student_id', courseController.getStudentSchedule);
router.get('/progress/:student_id', courseController.getStudentProgress);
router.delete('/delete/:enrollment_id', courseController.deleteCourse);

module.exports = router;
