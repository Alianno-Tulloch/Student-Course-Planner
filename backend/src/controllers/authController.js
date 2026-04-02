// This acts as a fake database for users
const MOCK_USERS = [
    { id: 1, username: 'kyle', password: 'password', name: 'Kyle' },
    { id: 2, username: 'ali', password: 'password', name: 'Ali' },
    { id: 3, username: 'tolu', password: 'password', name: 'Tolulope' }
];

exports.login = (req, res) => {
    const { username, password } = req.body;

    const user = MOCK_USERS.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, name: user.name, username: user.username }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
};
