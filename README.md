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

You can run this project either **Manually** (local Node.js) or via **Docker** (recommended for production-like environments).

---

### Method 1: Docker (Single Command Setup)
*Requires [Docker Desktop](https://www.docker.com/products/docker-desktop) to be installed and running.*

1. **Configure Environment:** Create a `.env` file in the root directory (where `docker-compose.yml` is) and add your Supabase credentials:
   ```batch
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=5000
   ```
2. **Launch:** Open your terminal in the root folder and run:
   ```powershell
   docker-compose up --build
   ```
3. **Access:** Once the containers are running, open your browser to:
   - **🏠 Web Portal:** `http://localhost:8080` (Automatically redirects to login)
   - **🔌 API Server:** `http://localhost:5000/api`

---

### Method 2: Manual Setup (Local Node.js)

#### 1. Configure the Backend
1. Ensure [Node.js](https://nodejs.org/) is installed.
2. Navigate to the `backend/` folder:
   ```powershell
   npm install
   ```
3. Create a `.env` file in the `backend/` folder:
   ```batch
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=5000
   ```
4. Start the server:
   ```powershell
   node src/server.js
   ```

#### 2. Launch the Frontend
1. **Option A (Recommended):** Use a local web server (like the **Live Server** extension in VS Code) on the `frontend/src/` folder.
2. **Option B (Direct):** Open `frontend/src/index.html` in your browser.
3. **Access:** Navigate to `index.html` and the system will automatically direct you to the login screen.

---

### Database Setup (Supabase)
To populate the system with students, teachers, and degree progress data:
1. Open your Supabase SQL Editor.
2. Run the code from `backend/database/schema.sql` to build the tables.
3. Run the code from `backend/database/testdata.sql` to populate Alice, Bob, and the course catalog.

### Test Accounts
- **Student:** `alice_j` / `password`
- **Admin:** `admin` / `adminpass`
- **Teacher:** `turing` / `password`
