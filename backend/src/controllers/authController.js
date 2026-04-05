const { supabase } = require('../supabaseClient');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query Supabase for a student with this username and password
        const { data, error } = await supabase
            .from('student') // Standardized to lowercase to match standard Postgres behavior
            .select('student_id, name, username')
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
            user: { id: data.student_id, name: data.name, username: data.username }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};
