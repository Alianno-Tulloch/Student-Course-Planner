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

    // 3. Populate Home Page Dashboard elements
    loadUpcomingCourses();
    
    // 4. Populate Schedule page
    loadScheduleTable();
});

// Fetch and render upcoming courses on the Home Dashboard
async function loadUpcomingCourses() {
    const flowContainer = document.getElementById('upcoming-courses-flow');
    if (!flowContainer) return;

    const user = checkLoginStatus();
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/courses/schedule/${user.id}`);
        const courses = await response.json();

        flowContainer.innerHTML = '';

        if (!courses || courses.length === 0) {
            flowContainer.innerHTML = '<p style="color: #a0aec0;">No upcoming courses scheduled. Go add some!</p>';
            return;
        }

        courses.forEach((course, index) => {
            const card = document.createElement('div');
            card.className = 'course-card-orange';
            card.innerHTML = `
                <strong>${course.course_code}</strong>
                <p style="font-size: 0.85rem; margin-top: 5px;">${course.meeting_days || 'TBA'} ${course.meeting_times || ''}</p>
            `;
            flowContainer.appendChild(card);

            if (index < courses.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.innerHTML = '&#8594;';
                flowContainer.appendChild(arrow);
            }
        });
    } catch (error) {
        console.error('Error loading upcoming courses:', error);
        flowContainer.innerHTML = '<p style="color: #e53e3e;">Failed to load courses.</p>';
    }
}

// Fetch and render the full schedule on the Schedule page
async function loadScheduleTable() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return;

    const user = checkLoginStatus();
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/courses/schedule/${user.id}`);
        const courses = await response.json();

        if (!courses || courses.length === 0) {
            document.getElementById('schedule-Mon').innerHTML = '<p style="color: #a0aec0; font-size:0.8rem;">Empty...</p>';
            return;
        }

        courses.forEach(course => {
            const daysString = course.meeting_days || '';
            const cardHTML = `
                <div style="background-color: #6c5ce7; color: white; padding: 10px; margin-bottom: 10px; border-radius: 6px; font-size: 0.9rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <strong>${course.course_code}</strong><br>
                    <span style="font-size: 0.8rem;">${course.meeting_times || 'TBA'}</span>
                </div>
            `;

            const days = daysString.replace(/Th/g, 'R');
            if (days.includes('M')) document.getElementById('schedule-Mon').innerHTML += cardHTML;
            if (days.includes('T')) document.getElementById('schedule-Tues').innerHTML += cardHTML;
            if (days.includes('W')) document.getElementById('schedule-Wed').innerHTML += cardHTML;
            if (days.includes('R')) document.getElementById('schedule-Thurs').innerHTML += cardHTML;
            if (days.includes('F')) document.getElementById('schedule-Fri').innerHTML += cardHTML;
        });

    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}
