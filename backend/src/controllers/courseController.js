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

// Search courses strictly by active Term Offerings and Academic Level
exports.searchCourses = async (req, res) => {
    try {
        const query = req.query.q
        const term_id = req.query.term_id
        const level = req.query.level

        let supabaseQuery = supabase
            .from('course')
            .select('*, course_offering!inner(term_id, offering_id)')
            .order('course_code', { ascending: true })

        if (term_id) {
            supabaseQuery = supabaseQuery.eq('course_offering.term_id', term_id)
        }
        
        if (level && level !== 'all') {
            supabaseQuery = supabaseQuery.eq('level', level)
        }

        if (query && query.trim() !== '') {
            const searchTerm = query.trim()
            supabaseQuery = supabaseQuery.or(`course_code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        }

        const { data, error } = await supabaseQuery

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        // Map and clean response to extract offering_id explicitly for the frontend
        const cleanedData = data.map(course => {
            course.offering_id = course.course_offering[0].offering_id;
            delete course.course_offering;
            return course;
        });

        res.json(cleanedData)
    } catch (err) {
        res.status(500).json({ error: 'Server error while searching courses.' })
    }
}

// Add a normalized offering to a student's schedule
exports.addCourse = async (req, res) => {
    try {
        const { student_id, offering_id, status, grade } = req.body

        if (!student_id || !offering_id) {
            return res.status(400).json({
                error: 'student_id and offering_id are required.'
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
                    offering_id,
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

// Fetch a student's schedule natively through Deep Joins
exports.getStudentSchedule = async (req, res) => {
    try {
        const { student_id } = req.params

        if (!student_id) {
            return res.status(400).json({ error: 'Student ID is required.' })
        }

        // Deep Join: Enrollment -> Course Offering -> Course Database
        const { data, error } = await supabase
            .from('course_enrollment')
            .select(`
                enrollment_id,
                status,
                course_offering (
                    term_id,
                    course (
                        course_code,
                        title,
                        meeting_days,
                        meeting_times
                    )
                )
            `)
            .eq('student_id', student_id)
            .in('status', [0, 1]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: error.message })
        }

        // Flattens the deep join so the frontend receives a clean array
        const formattedSchedule = data.map(item => ({
            enrollment_id: item.enrollment_id,
            status: item.status,
            term_id: item.course_offering.term_id,
            course_code: item.course_offering.course.course_code,
            title: item.course_offering.course.title,
            meeting_days: item.course_offering.course.meeting_days,
            meeting_times: item.course_offering.course.meeting_times
        }));

        res.json(formattedSchedule)
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching schedule.' })
    }
}

// Admin function to create a brand new global course tied to a specific term and level
exports.createNewGlobalCourse = async (req, res) => {
    try {
        const { course_code, title, credits, description, meeting_days, meeting_times, term_id, level } = req.body

        if (!course_code || !title || !term_id) {
            return res.status(400).json({ error: 'course_code, title, and term_id are absolutely required.' })
        }

        // 1. Upsert into Course table (create if absent, update if exists)
        const { data: courseData, error: courseError } = await supabase
            .from('course')
            .upsert([
                {
                    course_code,
                    title,
                    level: level || 'undergrad',
                    credits: credits || 0.5,
                    description: description || null,
                    meeting_days: meeting_days || null,
                    meeting_times: meeting_times || null
                }
            ], { onConflict: 'course_code' })
            .select()

        if (courseError) {
            console.error(courseError);
            return res.status(500).json({ error: courseError.message })
        }

        // 2. Map course to specific term offering
        const { data: offeringData, error: offeringError } = await supabase
            .from('course_offering')
            .insert([{ course_code, term_id }])
            .select()

        if (offeringError) {
            console.error(offeringError);
            // Catch unique constraint violation (they already created this class in this term)
            if (offeringError.code === '23505') {
                return res.status(400).json({ error: `Course ${course_code} is already offered in Term ${term_id}.` })
            }
            return res.status(500).json({ error: offeringError.message })
        }

        res.status(201).json({
            message: `Course ${course_code} successfully published to Term ${term_id}!`,
            data: courseData
        })
    } catch (err) {
        res.status(500).json({ error: 'Server error while creating global course.' })
    }
}

// Fetch a student's degree progress
exports.getStudentProgress = async (req, res) => {
    try {
        const { student_id } = req.params;
        if (!student_id) return res.status(400).json({ error: 'Student ID required.' });
        
        // Sum total credits across enrolled courses deep join.
        const { data, error } = await supabase
            .from('course_enrollment')
            .select(`
                course_offering (
                    course (
                        credits
                    )
                )
            `)
            .eq('student_id', student_id);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }

        let totalCredits = 0;
        data.forEach(enroll => {
            if (enroll.course_offering && enroll.course_offering.course && enroll.course_offering.course.credits) {
                totalCredits += parseFloat(enroll.course_offering.course.credits);
            }
        });

        // Arbitrary standard graduation requirement: 30 credits
        const req_credits = 30.0;
        const progressPercentage = Math.min((totalCredits / req_credits) * 100, 100);

        res.json({
            total_credits: totalCredits,
            req_credits: req_credits,
            percentage: progressPercentage.toFixed(1)
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching progress.' });
    }
}
