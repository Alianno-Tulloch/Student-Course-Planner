-- ========================================================
-- UPDATED TEST DATA FOR STUDENT COURSE PLANNER
-- Paste this entirely into Supabase SQL Editor
-- ========================================================

-- 1. Insert Core Terms
INSERT INTO Term (term_name, start_date, end_date) VALUES 
('Fall 2026', '2026-09-01', '2026-12-15'),
('Winter 2027', '2027-01-05', '2027-04-20'),
('Spring 2027', '2027-05-01', '2027-08-15');

-- 2. Insert Majors
INSERT INTO Major (major_name, level, gpa_req, req_credits) VALUES 
('Computer Science B.Sc.', 'undergrad', 2.50, 30.0),
('Business Administration B.B.A.', 'undergrad', 2.00, 30.0),
('Advanced Data Science M.Sc.', 'graduate', 3.00, 30.0);

-- 2.5 Insert Academic Minors (Required for new Student validation)
INSERT INTO Minor (minor_name, req_credits) VALUES 
('Mathematics', 15.0),
('Psychology', 15.0);

-- 3. Insert Teachers
INSERT INTO Teacher (name, email, department) VALUES 
('Prof. Alan Turing', 'turing@university.edu', 'Computer Science'),
('Dr. Grace Hopper', 'hopper@university.edu', 'Computing'),
('Prof. Elon Musk', 'elon@university.edu', 'Business');

-- 4. Insert Global Course Catalog
INSERT INTO Course (course_code, title, level, credits, description, meeting_days, meeting_times) VALUES 
('CP104', 'Intro to Programming', 'undergrad', 3.0, 'An introduction to Python programming concepts, basic data types, and logical flow.', 'MW', '10:00 AM - 11:20 AM'),
('CP164', 'Data Structures', 'undergrad', 3.0, 'Advanced Python algorithms mapping and complex object hierarchies.', 'TTh', '2:00 PM - 3:20 PM'),
('MA103', 'Calculus I', 'undergrad', 3.0, 'Exploration of limits, derivatives, and foundational integral calculus.', 'MWF', '9:00 AM - 9:50 AM'),
('BU111', 'Business Environment', 'undergrad', 3.0, 'Understanding the corporate business landscape and competitive models.', 'TTh', '4:00 PM - 5:20 PM'),
('DS500', 'Machine Learning', 'graduate', 3.0, 'Advanced statistical learning paradigms and neural network algorithms.', 'WF', '6:00 PM - 7:20 PM');

-- 4.5 MAP MAJORS TO COURSES (This specifies which courses are "Core")
-- Table: major_course_junction
INSERT INTO major_course_junction (major_id, course_code, core_course) VALUES 
(1, 'CP104', TRUE), (1, 'CP164', TRUE), (1, 'MA103', TRUE), -- CS Cores
(2, 'BU111', TRUE), (2, 'MA103', FALSE), -- Business (Calculus is an elective for them)
(3, 'DS500', TRUE);

-- 5. Map Courses to Explicit Terms and Assigned Teachers
INSERT INTO Course_Offering (course_code, term_id, teacher_id) VALUES 
('CP104', 1, 1), -- CP104 in Fall taught by Turing
('MA103', 1, 2), -- MA103 in Fall taught by Hopper
('BU111', 1, 3), -- BU111 in Fall taught by Musk
('CP164', 2, 1), -- CP164 in Winter taught by Turing
('DS500', 2, 2), -- DS500 in Winter taught by Hopper
('CP104', 3, 1); -- CP104 in Spring taught by Turing

-- 6. Insert Students (Using minor_id 1 'Mathematics' for Alice)
INSERT INTO Student (student_id, name, username, password, role, major_id, minor_id, gpa) VALUES 
(1, 'Alice Johnson', 'alice_j', 'password', 'student', 1, 1, 3.80),
(2, 'Bob Smith', 'bob_s', 'password', 'student', 2, null, 2.90),
(3, 'Admin Account', 'admin', 'adminpass', 'admin', null, null, 4.00),
(4, 'Turing Teacher', 'turing', 'password', 'teacher', null, null, null);

-- 7. Insert Mock Enrollments natively into the new Architecture
INSERT INTO Course_Enrollment (student_id, offering_id, status, grade) VALUES 
(1, 1, 2, 95.0), -- Alice COMPLETED CP104 (Fall)
(1, 2, 2, 88.5), -- Alice COMPLETED MA103 (Fall)
(1, 4, 1, null), -- Alice IN PROGRESS for CP164 (Winter)
(2, 3, 2, 75.0), -- Bob COMPLETED BU111 (Fall)
(2, 4, 0, null); -- Bob PLANNING to take CP164 (Winter)
