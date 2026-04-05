-- ========================================================
-- TEST DATA FOR STUDENT COURSE PLANNER
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

-- (Optional) Insert Minors if you ran the bonus script
INSERT INTO Minor (minor_name, req_credits) VALUES 
('Mathematics', 15.0),
('Psychology', 15.0);

-- 3. Insert Global Course Catalog
INSERT INTO Course (course_code, title, level, credits, description, meeting_days, meeting_times) VALUES 
('CP104', 'Intro to Programming', 'undergrad', 3.0, 'An introduction to Python programming concepts, basic data types, and logical flow.', 'MW', '10:00 AM - 11:20 AM'),
('CP164', 'Data Structures', 'undergrad', 3.0, 'Advanced Python algorithms mapping and complex object hierarchies.', 'TTh', '2:00 PM - 3:20 PM'),
('MA103', 'Calculus I', 'undergrad', 3.0, 'Exploration of limits, derivatives, applications of the derivative, and foundational integral calculus.', 'MWF', '9:00 AM - 9:50 AM'),
('BU111', 'Business Environment', 'undergrad', 3.0, 'Understanding the corporate business landscape, competitive models, and market positioning.', 'TTh', '4:00 PM - 5:20 PM'),
('DS500', 'Machine Learning', 'graduate', 3.0, 'Advanced statistical learning paradigms and neural network prediction algorithms.', 'WF', '6:00 PM - 7:20 PM');

-- 4. Map Courses to Explicit Terms using the Course_Offering Junction
INSERT INTO Course_Offering (course_code, term_id) VALUES 
('CP104', 1), -- CP104 in Fall (Offering ID 1)
('MA103', 1), -- MA103 in Fall (Offering ID 2)
('BU111', 1), -- BU111 in Fall (Offering ID 3)
('CP164', 2), -- CP164 in Winter (Offering ID 4)
('DS500', 2), -- DS500 in Winter (Offering ID 5)
('CP104', 3); -- CP104 in Spring (Offering ID 6)

-- 5. Insert Students (Using minor_id 1 'Mathematics' for Alice since it was requested earlier)
INSERT INTO Student (name, username, password, role, major_id, minor_id, gpa) VALUES 
('Alice Johnson', 'alice_j', 'password', 'student', 1, 1, 3.80),
('Bob Smith', 'bob_s', 'password', 'student', 2, null, 2.90),
('Admin Account', 'admin', 'adminpass', 'admin', null, null, 4.00);

-- 6. Insert Mock Enrollments natively into the new Normalized Architecture
INSERT INTO Course_Enrollment (student_id, offering_id, status, grade) VALUES 
(1, 1, 2, 95.0), -- Alice COMPLETED CP104 in Fall
(1, 2, 2, 88.5), -- Alice COMPLETED MA103 in Fall
(1, 4, 1, null), -- Alice is IN PROGRESS for CP164 in Winter
(2, 3, 2, 75.0), -- Bob COMPLETED BU111 in Fall
(2, 4, 0, null); -- Bob is PLANNING to take CP164 in Winter
