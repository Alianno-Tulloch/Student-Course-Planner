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

// Fetch dynamically generated departments from active courses
exports.getDepartments = async (req, res) => {
    try {
        const { data, error } = await supabase.from('course').select('course_code');
        if (error) return res.status(500).json({ error: error.message });
        
        const depts = new Set();
        data.forEach(course => {
            const match = course.course_code.match(/^[A-Za-z]+/);
            if (match) depts.add(match[0].toUpperCase());
        });
        
        res.json(Array.from(depts).sort());
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

// Search courses strictly by active Term Offerings and Academic Level
exports.searchCourses = async (req, res) => {
    try {
        const query = req.query.q
        const term_id = req.query.term_id
        const level = req.query.level
        const department = req.query.department

        let supabaseQuery = supabase
            .from('course')
            .select('*, course_offering!inner(term_id, offering_id)')
            .order('course_code', { ascending: true })

        if (term_id && term_id !== 'all') {
            supabaseQuery = supabaseQuery.eq('course_offering.term_id', term_id)
        }
        
        if (level && level !== 'all') {
            supabaseQuery = supabaseQuery.eq('level', level)
        }
        
        if (department && department !== 'all') {
            supabaseQuery = supabaseQuery.ilike('course_code', `${department}%`)
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
            message: `Course added to schedule successfully.`,
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

        // GPA Recalculation Trigger (Triggers only on completion statuses)
        if (status === 2 && data && data.length > 0) {
            const student_id = data[0].student_id;
            recalculateGPA(student_id);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while updating course.' })
    }
}

// Logic to mathematically average alphabetical/numerical grades based on enrollment history
const recalculateGPA = async (student_id) => {
    try {
        const { data, error } = await supabase
            .from('course_enrollment')
            .select('grade')
            .eq('student_id', student_id)
            .eq('status', 2)
            .not('grade', 'is', null);

        if (error || !data || data.length === 0) return;

        const total = data.reduce((sum, item) => sum + parseFloat(item.grade), 0);
        const averageGrade = (total / data.length);
        
        // Convert Percentage to GPA (Assuming 100-point scale maps to 4.0 scale)
        const gpaScale = ((averageGrade / 100) * 4).toFixed(2);

        await supabase
            .from('student')
            .update({ gpa: gpaScale })
            .eq('student_id', student_id);

    } catch (err) {
        console.error("GPA Recalc fail:", err);
    }
}

// Fetch all students and their history (For Teachers and Admins)
exports.getAllStudentsWithEnrollments = async (req, res) => {
    try {
        const { teacher_id } = req.query;

        let query = supabase
            .from('course_enrollment')
            .select(`
                enrollment_id,
                grade,
                status,
                student (
                    student_id,
                    name,
                    username
                ),
                course_offering!inner (
                    teacher_id,
                    course (
                        course_code,
                        title
                    ),
                    term (
                        term_name
                    )
                )
            `);
        
        if (teacher_id && teacher_id !== 'null') {
            query = query.eq('course_offering.teacher_id', teacher_id);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching student roster.' });
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

        // Deep Join: Enrollment -> Course Offering -> Term & Course Database
        const { data, error } = await supabase
            .from('course_enrollment')
            .select(`
                enrollment_id,
                status,
                course_offering (
                    term (
                        term_id,
                        term_name
                    ),
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
        const formattedSchedule = data.map(item => {
            // Guard against broken joins or incomplete data during prototyping
            const offering = item.course_offering || {};
            const term = offering.term || {};
            const course = offering.course || {};

            return {
                enrollment_id: item.enrollment_id,
                status: item.status,
                term_id: term.term_id,
                term_name: term.term_name || 'Unknown Term',
                course_code: course.course_code,
                title: course.title,
                meeting_days: course.meeting_days,
                meeting_times: course.meeting_times,
                credits: parseFloat(course.credits || 0)
            };
        });

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

// Fetch a student's degree progress natively with Deep Joins
exports.getStudentProgress = async (req, res) => {
    try {
        const { student_id } = req.params;
        if (!student_id) return res.status(400).json({ error: 'Student ID required.' });
        
        // Retrieve explicit Student traits (GPA, Major, Minor)
        const { data: studentData, error: studentError } = await supabase
            .from('student')
            .select(`
                gpa,
                major_id,
                major ( major_name, req_credits ),
                minor ( minor_name )
            `)
            .eq('student_id', student_id)
            .single();

        if (studentError) {
            console.error("Supabase Student fetch error:", studentError);
        }

        // Sum total credits and history across enrolled courses deep join.
        const { data, error } = await supabase
            .from('course_enrollment')
            .select(`
                status,
                course_offering (
                    term ( term_name ),
                    course (
                        course_code,
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
        let history = [];
        if (data) {
            data.forEach(enroll => {
                if (enroll.course_offering && enroll.course_offering.course) {
                    if (enroll.course_offering.course.credits) {
                        totalCredits += parseFloat(enroll.course_offering.course.credits);
                    }
                    history.push({
                        course_code: enroll.course_offering.course.course_code,
                        status: enroll.status,
                        term_name: enroll.course_offering.term ? enroll.course_offering.term.term_name : ''
                    });
                }
            });
        }

        // 3. Separate Core vs Elective Credits
        let coreCredits = 0;
        let electiveCredits = 0;
        let coreIpCredits = 0;
        let electiveIpCredits = 0;

        if (studentData && studentData.major_id) {
            const { data: junctionData } = await supabase
                .from('major_course_junction')
                .select('course_code, core_course')
                .eq('major_id', studentData.major_id);

            const coreCourseMap = new Set(junctionData?.filter(j => j.core_course).map(j => j.course_code) || []);

            data?.forEach(enroll => {
                if (enroll.course_offering && enroll.course_offering.course) {
                    const c = enroll.course_offering.course;
                    const creds = parseFloat(c.credits) || 0;
                    
                    if (enroll.status === 2) {
                        // COMPLETED
                        if (coreCourseMap.has(c.course_code)) coreCredits += creds;
                        else electiveCredits += creds;
                    } else if (enroll.status === 1) {
                        // IN PROGRESS
                        if (coreCourseMap.has(c.course_code)) coreIpCredits += creds;
                        else electiveIpCredits += creds;
                    }
                }
            });
        }

        // Standard requirement: 30 credits (or from Major table)
        const req_credits = studentData?.major?.req_credits || 30.0;
        const totalProgress = Math.min(((coreCredits + electiveCredits) / req_credits) * 100, 100);
        
        // Let's assume 70% of credits are core, 30% are electives for requirements
        const core_req = req_credits * 0.7;
        const elective_req = req_credits * 0.3;

        const coreProgress = Math.min((coreCredits / core_req) * 100, 100); 
        const electiveProgress = Math.min((electiveCredits / elective_req) * 100, 100); 

        const coreIpProgress = Math.min((coreIpCredits / core_req) * 100, 100);
        const electiveIpProgress = Math.min((electiveIpCredits / elective_req) * 100, 100);

        const responsePayload = {
            gpa: studentData?.gpa || 4.0,
            major: studentData?.major?.major_name || 'Undeclared',
            minor: studentData?.minor?.minor_name || 'Undeclared',
            total_credits: totalCredits,
            core_credits: coreCredits,
            elective_credits: electiveCredits,
            core_ip_credits: coreIpCredits,
            elective_ip_credits: electiveIpCredits,
            req_credits: req_credits,
            percentage: totalProgress.toFixed(1),
            core_percentage: coreProgress.toFixed(1),
            elective_percentage: electiveProgress.toFixed(1),
            core_ip_percentage: coreIpProgress.toFixed(1),
            elective_ip_percentage: electiveIpProgress.toFixed(1),
            history: history
        };
        res.json(responsePayload);
    } catch (err) {
        console.error('CRASH IN PROGRESS ENDPOINT:', err);
        res.status(500).json({ error: 'Server error fetching progress.' });
    }
}

// Intelligent Core Course Recommender
exports.getRecommendedCourses = async (req, res) => {
    try {
        const { student_id } = req.params;
        
        // 1. Get Student's Major
        const { data: student } = await supabase
            .from('student')
            .select('major_id')
            .eq('student_id', student_id)
            .single();

        if (!student || !student.major_id) return res.json([]);

        // 2. Get all Core Requirements for that Major
        const { data: coreRequirements } = await supabase
            .from('major_course_junction')
            .select('course_code')
            .eq('major_id', student.major_id)
            .eq('core_course', true);

        const coreCodes = coreRequirements?.map(c => c.course_code) || [];

        // 3. Get Student's Current Enrollments (to avoid recommending what they already have)
        const { data: enrollments } = await supabase
            .from('course_enrollment')
            .select('course_offering(course_code)')
            .eq('student_id', student_id);
        
        const takenCodes = enrollments?.map(e => e.course_offering.course_code) || [];

        // 4. Filter: Core courses NOT in enrollment history
        const recommendedCodes = coreCodes.filter(code => !takenCodes.includes(code));

        if (recommendedCodes.length === 0) return res.json([]);

        // 5. Fetch full Course details for the results
        const { data: courses } = await supabase
            .from('course')
            .select('course_code, title')
            .in('course_code', recommendedCodes)
            .limit(4);

        res.json(courses || []);
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        res.status(500).json({ error: 'Server error' });
    }
}
