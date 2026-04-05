// Controller for handling course-related logic

const { supabase } = require('../supabaseClient')

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('course')
            .select('*')
            .order('course_code', { ascending: true })

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        res.json(data)
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching courses.' })
    }
}

// Search courses by code or title
exports.searchCourses = async (req, res) => {
    try {
        const query = req.query.q

        let supabaseQuery = supabase
            .from('course')
            .select('*')
            .order('course_code', { ascending: true })

        if (query && query.trim() !== '') {
            const searchTerm = query.trim()
            supabaseQuery = supabaseQuery.or(`course_code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        }

        const { data, error } = await supabaseQuery

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        res.json(data)
    } catch (err) {
        res.status(500).json({ error: 'Server error while searching courses.' })
    }
}

// Add a course to a student's schedule
exports.addCourse = async (req, res) => {
    try {
        const { student_id, course_code, term_id, status, grade } = req.body

        if (!student_id || !course_code || !term_id) {
            return res.status(400).json({
                error: 'student_id, course_code, and term_id are required.'
            })
        }

        if (status !== undefined && ![0, 1, 2].includes(status)) {
            return res.status(400).json({
                error: 'Status must be 0 (planned), 1 (in progress), or 2 (completed).'
            })
        }

        const { data, error } = await supabase
            .from('course_enrollment')
            .insert([
                {
                    student_id,
                    course_code,
                    term_id,
                    status: status !== undefined ? status : 0,
                    grade: grade !== undefined ? grade : null
                }
            ])
            .select()

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        res.status(201).json({
            message: `Course ${course_code} added successfully.`,
            data
        })
    } catch (err) {
        res.status(500).json({ error: 'Server error while adding course.' })
    }
}

// Update a course enrollment
exports.updateCourse = async (req, res) => {
    try {
        const { enrollment_id } = req.params
        const { status, grade, term_id } = req.body

        if (!enrollment_id) {
            return res.status(400).json({ error: 'Enrollment ID is required.' })
        }

        if (status !== undefined && ![0, 1, 2].includes(status)) {
            return res.status(400).json({
                error: 'Status must be 0 (planned), 1 (in progress), or 2 (completed).'
            })
        }

        const updateFields = {}

        if (status !== undefined) updateFields.status = status
        if (grade !== undefined) updateFields.grade = grade
        if (term_id !== undefined) updateFields.term_id = term_id

        const { data, error } = await supabase
            .from('course_enrollment')
            .update(updateFields)
            .eq('enrollment_id', enrollment_id)
            .select()

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        res.json({
            message: `Enrollment ${enrollment_id} updated successfully.`,
            data
        })
    } catch (err) {
        res.status(500).json({ error: 'Server error while updating course.' })
    }
}

// Delete a course from a student's schedule
exports.deleteCourse = async (req, res) => {
    try {
        const { enrollment_id } = req.params

        if (!enrollment_id) {
            return res.status(400).json({ error: 'Enrollment ID is required.' })
        }

        const { error } = await supabase
            .from('course_enrollment')
            .delete()
            .eq('enrollment_id', enrollment_id)

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        res.json({
            message: `Enrollment ${enrollment_id} deleted successfully.`
        })
    } catch (err) {
        res.status(500).json({ error: 'Server error while deleting course.' })
    }
}

// Fetch a student's schedule (enrolled courses with meeting times)
exports.getStudentSchedule = async (req, res) => {
    try {
        const { student_id } = req.params

        if (!student_id) {
            return res.status(400).json({ error: 'Student ID is required.' })
        }

        // Fetch course enrollments with status 0 (planned) or 1 (in progress) and join the matching course details
        const { data, error } = await supabase
            .from('course_enrollment')
            .select(`
                enrollment_id,
                status,
                course (
                    course_code,
                    title,
                    meeting_days,
                    meeting_times
                )
            `)
            .eq('student_id', student_id)
            .in('status', [0, 1]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: error.message })
        }

        // Flattens the response so the frontend receives a clean array of courses
        const formattedSchedule = data.map(item => ({
            enrollment_id: item.enrollment_id,
            status: item.status,
            course_code: item.course.course_code,
            title: item.course.title,
            meeting_days: item.course.meeting_days,
            meeting_times: item.course.meeting_times
        }));

        res.json(formattedSchedule)
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching schedule.' })
    }
}
