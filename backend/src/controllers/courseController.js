// Controller for handling course-related logic using Mock Data

const MOCK_COURSES = [
    { id: 'CP104', name: 'Introduction to Programming', department: 'Computer Science', term: 'Fall', instructor: 'Dr. Brown', time: 'MWF 10:00 - 11:20', credits: 0.5 },
    { id: 'CP164', name: 'Data Structures I', department: 'Computer Science', term: 'Winter', instructor: 'Dr. Smith', time: 'TTh 13:00 - 14:20', credits: 0.5 },
    { id: 'CP213', name: 'Introduction to Object-Oriented Programming', department: 'Computer Science', term: 'Fall', instructor: 'Dr. Green', time: 'MWF 14:30 - 15:50', credits: 0.5 },
    { id: 'CP264', name: 'Data Structures II', department: 'Computer Science', term: 'Winter', instructor: 'Dr. White', time: 'TTh 10:00 - 11:20', credits: 0.5 },
    { id: 'CP312', name: 'Algorithm Design and Analysis I', department: 'Computer Science', term: 'Fall', instructor: 'Dr. Black', time: 'MWF 08:30 - 09:50', credits: 0.5 },
    { id: 'CP476', name: 'Internet Computing', department: 'Computer Science', term: 'Winter', instructor: 'Dr. Daraghmeh', time: 'TTh 16:00 - 17:20', credits: 0.5 }
];

// In-memory mock user schedules
const MOCK_USER_SCHEDULES = {};

exports.getAllCourses = (req, res) => {
    res.json(MOCK_COURSES);
};

exports.searchCourses = (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filteredCourses = MOCK_COURSES.filter(course => 
        course.id.toLowerCase().includes(query) || 
        course.name.toLowerCase().includes(query)
    );
    res.json(filteredCourses);
};

exports.addCourse = (req, res) => {
    const { courseId, userId } = req.body;
    
    // Default to a guest user if no user is provided
    const targetUser = userId || 'anonymous';
    
    if (!MOCK_USER_SCHEDULES[targetUser]) {
        MOCK_USER_SCHEDULES[targetUser] = [];
    }
    
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: `Course ${courseId} not found` });
    }
    
    // Check if duplicate course
    if (MOCK_USER_SCHEDULES[targetUser].find(c => c.id === courseId)) {
        return res.status(400).json({ success: false, message: `Course ${courseId} is already in your schedule` });
    }

    MOCK_USER_SCHEDULES[targetUser].push(course);
    res.json({ success: true, message: `Course ${courseId} added to schedule!`, schedule: MOCK_USER_SCHEDULES[targetUser] });
};
