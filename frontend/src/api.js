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

// Sends a search query to the backend and renders result cards from Supabase, filtering by Course_Offering terms
async function searchCourses() {
    const searchInput = document.getElementById('search-input');
    const termSelect = document.getElementById('term-select');
    const levelSelect = document.getElementById('level-select');
    const departmentSelect = document.getElementById('department-select');
    const resultsGrid = document.getElementById('results-grid');
    if (!searchInput || !resultsGrid || !termSelect) return;

    const searchTerm = searchInput.value;
    const termId = termSelect.value;
    const levelId = levelSelect ? levelSelect.value : 'all';
    const departmentId = departmentSelect ? departmentSelect.value : 'all';

    // CHECK IF URL PARAMETER EXISTS (For recommendations)
    const urlParams = new URLSearchParams(window.location.search);
    const prefillSearch = urlParams.get('search');
    if (prefillSearch && !searchTerm) {
        searchInput.value = prefillSearch;
        // Re-call search with new value
        return searchCourses();
    }

    try {
        const response = await fetch(`${API_URL}/courses/search?q=${encodeURIComponent(searchTerm)}&term_id=${termId}&level=${levelId}&department=${departmentId}`);
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
                <div style="font-weight: bold; font-size: 1.1rem; color: #6c5ce7; margin-bottom: 5px;">${course.course_code} ${course.level === 'graduate' ? '(Grad)' : ''}</div>
                <p style="margin-bottom: 5px; color: #333; font-weight: 600; line-height: 1.2;">${course.title}</p>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px; height: 40px; overflow: hidden; text-overflow: ellipsis;">
                    ${course.description || 'No description available.'}
                </p>
                <button onclick="addCourse(${course.offering_id}, this)">Add to Schedule</button>
                <p style="font-size: 0.8rem; margin-top: 10px; color: #a0aec0;">${course.credits || '0.5'} Credits</p>
            `;
            resultsGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('Could not connect to the backend server. Make sure it is running on port 5000.');
    }
}

// Sends a request to add a normalized offering to the Course_Enrollment table
async function addCourse(offeringId, buttonElement) {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    // Ensure student is logged in
    if (!user) {
        alert("You must be logged in to add courses.");
        return;
    }
    const studentId = user.id; 

    try {
        const response = await fetch(`${API_URL}/courses/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                student_id: studentId, 
                offering_id: offeringId, 
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

        // Bind Term Dropdown filter changing logic
        const termSelect = document.getElementById('term-select');
        if (termSelect) {
            termSelect.addEventListener('change', searchCourses);
        }

        // Bind Level Dropdown filter changing logic
        const levelSelect = document.getElementById('level-select');
        if (levelSelect) {
            levelSelect.addEventListener('change', searchCourses);
        }
        
        // Populate Departments and bind filter
        loadDepartments();
        const departmentSelect = document.getElementById('department-select');
        if (departmentSelect) {
            departmentSelect.addEventListener('change', searchCourses);
        }
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
                    
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (data.user.role === 'teacher') {
                        // Placeholder for teacher dashboard, shared home for now
                        window.location.href = 'home.html';
                    } else {
                        window.location.href = 'home.html';
                    }
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

    // Signup Page dynamic population
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        loadSignupOptions(); 
        signupForm.addEventListener('submit', submitSignup);
    }

    // 3. Populate Home Page Dashboard elements
    loadUpcomingCourses();
    loadRecommendedCourses();
    
    // 4. Populate Schedule page
    loadScheduleTable();

    // 5. Populate Progress page
    loadProgress();
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

// Load department dropdown dynamically
async function loadDepartments() {
    const departmentSelect = document.getElementById('department-select');
    if (!departmentSelect) return;

    try {
        const response = await fetch(`${API_URL}/courses/departments`);
        const data = await response.json();
        
        data.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.innerText = dept;
            departmentSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading departments:', err);
    }
}

let globalScheduleCourses = []; // Cache to enable dynamic re-rendering

// Fetch and render the full schedule on the Schedule page
async function loadScheduleTable() {
    const tableBody = document.getElementById('schedule-table-body');
    if (!tableBody) return;

    const user = checkLoginStatus();
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/courses/schedule/${user.id}`);
        globalScheduleCourses = await response.json();

        // Dynamically build terms selector based on enrollments
        const termSelect = document.getElementById('schedule-term-select');
        if (termSelect && globalScheduleCourses.length > 0) {
            const uniqueTerms = new Map(); // deduplicate term_id -> term_name
            globalScheduleCourses.forEach(course => uniqueTerms.set(course.term_id, course.term_name));
            
            termSelect.innerHTML = '';
            uniqueTerms.forEach((name, id) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.innerText = name;
                termSelect.appendChild(opt);
            });
            
            // Re-render when changed
            termSelect.addEventListener('change', renderScheduleGrid);
        }

        renderScheduleGrid();

    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// Subordinate rendering component mapping data onto the Schedule Grid natively
function renderScheduleGrid() {
    const tableBody = document.getElementById('schedule-table-body');
    const termSelect = document.getElementById('schedule-term-select');
    const creditsSpan = document.getElementById('schedule-credits');
    if (!tableBody) return;

    // Clear existing schedule grid
    const daysArr = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri'];
    daysArr.forEach(d => {
        const el = document.getElementById(`schedule-${d}`);
        if(el) el.innerHTML = '';
    });
    
    if (globalScheduleCourses.length === 0) {
        document.getElementById('schedule-Mon').innerHTML = '<p style="color: #a0aec0; font-size:0.8rem;">Empty...</p>';
        if (creditsSpan) creditsSpan.innerText = '0';
        return;
    }

    const activeTermId = termSelect ? parseInt(termSelect.value) : globalScheduleCourses[0].term_id;

    // Filter courses matching active term
    const activeCourses = globalScheduleCourses.filter(c => c.term_id === activeTermId);

    let totalCredits = 0;

    activeCourses.forEach(course => {
        totalCredits += course.credits;
        const daysString = course.meeting_days || '';
        const cardHTML = `
            <div style="background-color: #6c5ce7; color: white; padding: 10px; margin-bottom: 10px; border-radius: 6px; font-size: 0.9rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: relative;">
                <strong>${course.course_code}</strong><br>
                <span style="font-size: 0.8rem;">${course.meeting_times || 'TBA'}</span>
                <button onclick="dropCourse(${course.enrollment_id}, this)" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: white; font-weight: bold; cursor: pointer; font-size: 0.9rem;" title="Drop Course">&#10005;</button>
            </div>
        `;

        const days = daysString.replace(/Th/g, 'R');
        if (days.includes('M')) document.getElementById('schedule-Mon').innerHTML += cardHTML;
        if (days.includes('T')) document.getElementById('schedule-Tues').innerHTML += cardHTML;
        if (days.includes('W')) document.getElementById('schedule-Wed').innerHTML += cardHTML;
        if (days.includes('R')) document.getElementById('schedule-Thurs').innerHTML += cardHTML;
        if (days.includes('F')) document.getElementById('schedule-Fri').innerHTML += cardHTML;
    });
    
    if (creditsSpan) creditsSpan.innerText = `${totalCredits}`;
}

// Function for Admins to create new global courses
async function submitNewCourse(event) {
    event.preventDefault();
    
    // Check if the user is truly an admin (basic frontend check)
    const user = checkLoginStatus();
    if (!user || user.role !== 'admin') {
        alert("Unauthorized access. Only admins can create courses.");
        return;
    }

    const course_code = document.getElementById('new-course-code').value;
    const title = document.getElementById('new-course-title').value;
    const credits = document.getElementById('new-course-credits').value;
    const description = document.getElementById('new-course-desc').value;
    const meeting_days = document.getElementById('new-course-days').value;
    const meeting_times = document.getElementById('new-course-times').value;
    const term_id = document.getElementById('new-course-term').value;
    const level = document.getElementById('new-course-level').value;
    
    const messageDisplay = document.getElementById('admin-message');

    try {
        const response = await fetch(`${API_URL}/courses/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                course_code, title, credits, description, meeting_days, meeting_times, term_id: parseInt(term_id), level
            })
        });

        const data = await response.json();

        if (response.ok) {
            messageDisplay.innerText = data.message;
            messageDisplay.style.color = '#20c997'; // Green success
            document.getElementById('admin-course-form').reset();
        } else {
            messageDisplay.innerText = data.error || 'Failed to create course.';
            messageDisplay.style.color = '#e53e3e'; // Red error
        }
    } catch (error) {
        console.error('Error creating course:', error);
        messageDisplay.innerText = 'Server error during creation.';
        messageDisplay.style.color = '#e53e3e';
    }
}

// Function to drop a course from schedule
async function dropCourse(enrollmentId, buttonElement) {
    if (!confirm("Are you sure you want to drop this course?")) return;

    try {
        const response = await fetch(`${API_URL}/courses/delete/${enrollmentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Remove the card visually
            buttonElement.parentElement.remove();
        } else {
            alert('Failed to drop course. It may have already been removed.');
        }
    } catch (error) {
        console.error('Error dropping course:', error);
    }
}

// Toggle Major/Minor inputs on signup
function toggleStudentFields() {
    const role = document.getElementById('signup-role').value;
    const extras = document.getElementById('student-extras');
    if (extras) {
        extras.style.display = (role === 'student') ? 'block' : 'none';
    }
}

// Populate Majors/Minors for signup
async function loadSignupOptions() {
    const majorSelect = document.getElementById('signup-major');
    const minorSelect = document.getElementById('signup-minor');
    if (!majorSelect || !minorSelect) return;

    try {
        const majorsResponse = await fetch(`${API_URL}/auth/majors`);
        const majors = await majorsResponse.json();
        majors.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.major_id;
            opt.innerText = m.major_name;
            majorSelect.appendChild(opt);
        });

        const minorsResponse = await fetch(`${API_URL}/auth/minors`);
        const minors = await minorsResponse.json();
        minors.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.minor_id;
            opt.innerText = m.minor_name;
            minorSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading signup options:", err);
    }
}

// Function to process user signups
async function submitSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const major_id = document.getElementById('signup-major').value;
    const minor_id = document.getElementById('signup-minor').value;
    
    const errorText = document.getElementById('signup-error');

    try {
        const body = { name, username, password, role };
        if (role === 'student') {
            if (major_id) body.major_id = parseInt(major_id);
            if (minor_id) body.minor_id = parseInt(minor_id);
        }

        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            window.location.href = 'login.html';
        } else {
            errorText.innerText = data.message;
            errorText.style.display = 'block';
        }
    } catch (error) {
        errorText.innerText = "Could not connect to the Backend server.";
        errorText.style.display = 'block';
    }
}

// Function to load degree progress dynamically
async function loadProgress() {
    const progressBar = document.getElementById('progress-bar-fill');
    const textDisplay = document.getElementById('progress-text');
    const electivesBar = document.querySelector('.fill-electives');
    const overviewBox = document.getElementById('progress-overview');
    const historyBox = document.getElementById('progress-history');
    
    // Attempt load universally to populate parallel blocks (Home page)
    const user = checkLoginStatus();
    if (!user) {
        if (overviewBox) overviewBox.innerHTML = '<p style="color: #a0aec0; padding: 10px;">Please log in to view your progress.</p>';
        if (historyBox) historyBox.innerHTML = '<div style="color: #a0aec0; width: 100%; border: none; background: none;">Please log in to view course history.</div>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/courses/progress/${user.id}`);
        const data = await response.json();

        if (response.ok) {
            // Update page title with major name
            const pageTitle = document.getElementById('page-title-text');
            if (pageTitle) pageTitle.innerText = `${data.major} Degree Progress`;

            const coreReq = (data.req_credits * 0.7).toFixed(1);
            const elecReq = (data.req_credits * 0.3).toFixed(1);

            const coreIpBar = document.getElementById('core-ip-fill');
            const elecIpBar = document.getElementById('elec-ip-fill');

            if (progressBar) progressBar.style.width = `${data.core_percentage}%`;
            if (coreIpBar) coreIpBar.style.width = `${data.core_ip_percentage}%`;
            if (textDisplay) textDisplay.innerHTML = `<strong>${data.core_credits} / ${coreReq}</strong> Credits Completed (${data.core_percentage}%)`;
            
            const electiveText = document.getElementById('elective-text');
            if (electivesBar) electivesBar.style.width = `${data.elective_percentage}%`;
            if (elecIpBar) elecIpBar.style.width = `${data.elective_ip_percentage}%`;
            if (electiveText) electiveText.innerHTML = `<strong>${data.elective_credits} / ${elecReq}</strong> Credits Completed (${data.elective_percentage}%)`;
            
            if (overviewBox) {
                overviewBox.innerHTML = `
                    <p style="font-weight:bold; font-size: 1.25rem; margin-bottom: 5px; color: #2d3748;">GPA: ${parseFloat(data.gpa).toFixed(2)}</p>
                    <p style="color: #4a5568; font-weight: 500; margin-bottom: 5px;">Major: <span style="font-weight: 400;">${data.major}</span></p>
                    <p style="color: #4a5568; font-weight: 500;">Minor: <span style="font-weight: 400; font-style: italic;">${data.minor}</span></p>
                `;
            }
            
            if (historyBox) {
                if (!data.history || data.history.length === 0) {
                    historyBox.innerHTML = '<div style="color: #a0aec0; width: 100%; border: none; background: none;">No courses on record.</div>';
                } else {
                    historyBox.innerHTML = '';
                    data.history.forEach(item => {
                        const historyCard = document.createElement('div');
                        // Status styling: 0=Planned, 2=Completed
                        if (item.status === 0) historyCard.className = 'planned';
                        else historyCard.style.cssText = item.status === 1 ? 'border-left: 4px solid #6c5ce7;' : '';
                        
                        historyCard.innerHTML = `<strong>${item.course_code}</strong> <br> <span style="font-size:0.75em; color: #718096;">${item.term_name || 'N/A'}</span>`;
                        historyBox.appendChild(historyCard);
                    });
                }
            }
        } else {
            console.error("API Error Response:", data);
            throw new Error(data.error || "Server responded with an error");
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        if (overviewBox) overviewBox.innerHTML = `<p style="color: #e53e3e; padding: 10px;">Backend Error: ${error.message}</p>`;
        if (historyBox) historyBox.innerHTML = '<p style="color: #e53e3e; grid-column: span 2; padding: 10px;">Failed to load data. Please restart the backend.</p>';
    }
}

// Fetch and render recommended core courses on the Home Dashboard
async function loadRecommendedCourses() {
    const grid = document.querySelector('.recommended-grid');
    if (!grid) return;

    const user = checkLoginStatus();
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/courses/recommended/${user.id}`);
        const recommendations = await response.json();

        if (response.ok && recommendations.length > 0) {
            grid.innerHTML = '';
            recommendations.forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-card-dark';
                card.style.cursor = 'pointer';
                card.innerHTML = `<strong>${course.course_code}</strong>`;
                card.title = course.title; // Show full title on hover
                card.onclick = () => {
                    // Redirect to search page with this course pre-filled
                    window.location.href = `course_search.html?search=${course.course_code}`;
                };
                grid.appendChild(card);
            });
        } else {
            // No recommendations or error
            grid.innerHTML = '<p style="color: #a0aec0; width: 100%; text-align: center;">You have completed all core requirements!</p>';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}
