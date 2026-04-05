# Student Course Planner (CP476 Group Project)

Course: CP476 – Internet Computing (Winter 2026)  
Instructor: Dr. Mustafa Daraghmeh  

## Team

- Kyle Cordy
- Alianno Tulloch
- Tolulope Roluga

## Project Overview

A system that helps students plan courses across academic terms.

## Target Users

- Undergraduate students
- Upper-year students
- Transfer students
- Part-time or returning students

## Links to Additional Project Requirements

GitHub Repo: <https://github.com/Alianno-Tulloch/Student-Course-Planner>

GitHub Project Board: <https://github.com/users/Alianno-Tulloch/projects/2/views/1>

Wiki / Activity Blog: <https://github.com/Alianno-Tulloch/Student-Course-Planner/wiki/Week-1:-Jan-26th-to-30th>

## How to Run the Project

### Download Node.js AND npm
1. Download Node.js and download npm, from this link: <https://nodejs.org/en/download>

### Start the Backend
1. Open your terminal or command prompt.
2. Navigate to the backend folder
3. Install the required dependencies, using this terminal command:

    `npm install`

4. Create a .env file in the backend folder, and add the following environment variables:
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=supabase_publishable_key
PORT=5000

5. Start the server, using this terminal command:

    `npm start`

6. The console should display: Server is running on port 5000

### Start the Frontend
1. Open your file explorer and navigate to frontend/src/.
2. Open login.html in your preferred web browser (Chrome, Firefox, etc.)

### Verify the Connection
1. Navigate to the View Courses page.
2. Type anything into the search bar and press Enter.
3. If you see an alert saying Server says: ..., your frontend and backend are communicating correctly!
