const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Student Course Planner API is running...');
});

// Routes
app.use('/api/courses', courseRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
