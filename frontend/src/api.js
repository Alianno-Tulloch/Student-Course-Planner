const API_URL = 'http://localhost:5000/api';

/**
 * Sends a search query to the backend and logs the result
 */
async function searchCourses() {
    const searchInput = document.querySelector('.search-bar');
    if (!searchInput) return;

    const searchTerm = searchInput.value;
    console.log(`Searching for: ${searchTerm}`);

    try {
        const response = await fetch(`${API_URL}/courses/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        // For now, we just alert the placeholder message from the server
        alert(`Server says: ${data.message}`);
        console.log('Search response:', data);
    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('Could not connect to the backend server. Make sure it is running on port 5000.');
    }
}

/**
 * Sends a request to the backend to add a course to the schedule
 * @param {string} courseId - The ID of the course to add
 */
async function addCourse(courseId) {
    console.log(`Attempting to add course: ${courseId}`);

    try {
        const response = await fetch(`${API_URL}/courses/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId: courseId })
        });

        const data = await response.json();
        alert(`Server says: ${data.message}`);
        console.log('Add response:', data);
    } catch (error) {
        console.error('Error adding course:', error);
        alert('Could not connect to the backend server.');
    }
}

// Add event listener for the Search bar to trigger on "Enter" key
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchCourses();
            }
        });
    }
});
