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

        if (!query || query.trim() === '') {
            return res.status(400).json({ error: 'Search query is required.' })
        }

        const searchTerm = query.trim()

        const { data, error } = await supabase
            .from('course')
            .select('*')
            .or(`course_code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
            .order('course_code', { ascending: true })

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
