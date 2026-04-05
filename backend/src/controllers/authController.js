const { supabase } = require('../supabaseClient');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query Supabase for a student with this username and password
        const { data, error } = await supabase
            .from('student') // Standardized to lowercase to match standard Postgres behavior
            .select('student_id, name, username, role')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) {
            console.error("Supabase Login Error:", error);
        }

        if (error || !data) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: { id: data.student_id, name: data.name, username: data.username, role: data.role || 'student' }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

exports.signup = async (req, res) => {
    const { username, password, name } = req.body;

    try {
        if (!username || !password || !name) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const { data, error } = await supabase
            .from('student')
            .insert([{ username, password, name, role: 'student' }])
            .select('student_id, name, username, role')
            .single();

        if (error) {
            console.error("Supabase Signup Error:", error);
            if (error.code === '23505') {
                return res.status(400).json({ success: false, message: 'Username is already taken.' });
            }
            return res.status(500).json({ success: false, message: 'Database error during signup.' });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: { id: data.student_id, name: data.name, username: data.username, role: data.role || 'student' }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
};
