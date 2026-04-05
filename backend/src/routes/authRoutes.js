const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/majors', authController.getMajors);
router.get('/minors', authController.getMinors);

module.exports = router;
