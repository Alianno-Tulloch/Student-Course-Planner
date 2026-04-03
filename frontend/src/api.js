const API_URL = 'http://localhost:5000/api';

// Check if someone is logged in when the script loads
const checkLoginStatus = () => {
    const userData = localStorage.getItem('loggedInUser');
    
    // Update the welcome message on the home page if it exists
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        if (userData) {
            const user = JSON.parse(userData);
            welcomeMessage.innerText = `Welcome ${user.name}!`;
        } else {
            welcomeMessage.innerText = `Welcome Guest!`;
        }
    }
    
    // You could also add logic here to redirect away from /login if already logged in,
    // or redirect to /login if NOT logged in, but we'll leave it open for now.
    return userData ? JSON.parse(userData) : null;
};

// Sends a search query to the backend and renders result cards from Supabase
async function searchCourses() {
    const searchInput = document.getElementById('search-input');
    const resultsGrid = document.getElementById('results-grid');
    if (!searchInput || !resultsGrid) return;

    const searchTerm = searchInput.value;

    try {
        const response = await fetch(`${API_URL}/courses/search?q=${encodeURIComponent(searchTerm)}`);
        const courses = await response.json();

        // Clear out the previous results
        resultsGrid.innerHTML = '';

        if (!courses || courses.length === 0) {
            resultsGrid.innerHTML = '<p style="grid-column: span 3; text-align: center; color: #a0aec0; width: 100%;">No courses found matching your query.</p>';
            return;
        }

        // Generate a card for each course based on your schema
        courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <div style="font-weight: bold; font-size: 1.1rem; color: #6c5ce7; margin-bottom: 5px;">${course.course_code}</div>
                <p style="margin-bottom: 5px; color: #333; font-weight: 600; line-height: 1.2;">${course.title}</p>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px; height: 40px; overflow: hidden; text-overflow: ellipsis;">
                    ${course.description || 'No description available.'}
                </p>
                <button onclick="addCourse('${course.course_code}', this)">Add to Schedule</button>
                <p style="font-size: 0.8rem; margin-top: 10px; color: #a0aec0;">${course.credits || '0.5'} Credits</p>
            `;
            resultsGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('Could not connect to the backend server. Make sure it is running on port 5000.');
    }
}

// Sends a request to add a course to the Course_Enrollment table
async function addCourse(courseCode, buttonElement) {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    // Fallback values for now since we haven't linked Users to Students yet
    const studentId = user ? user.id : 1; 
    const termId = 1; // Default to the first term (e.g., Fall 2026)

    try {
        const response = await fetch(`${API_URL}/courses/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                student_id: studentId, 
                course_code: courseCode, 
                term_id: termId,
                status: 0 // Default to "Planned"
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            buttonElement.innerText = "Added!";
            buttonElement.style.backgroundColor = "#20c997";
            buttonElement.disabled = true;
        } else {
            alert(data.error || "Failed to add course.");
        }
        
    } catch (error) {
        console.error('Error adding course:', error);
        alert('An error occurred while communicating with the database.');
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    
    // Check login state on every page
    checkLoginStatus();

    // 1. Setup Search Bar Event Listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchCourses();
            }
        });
        
        // Also trigger an initial search instantly to load all courses by default
        searchCourses();
    }

    // 2. Setup Login Form Event Listener
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorText = document.getElementById('error-message');

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    window.location.href = 'home.html';
                } else {
                    errorText.innerText = data.message;
                    errorText.style.display = 'block';
                }
            } catch (error) {
                console.error("Login Error:", error);
                errorText.innerText = "Could not connect to the Backend server.";
                errorText.style.display = 'block';
            }
        });
    }
});
