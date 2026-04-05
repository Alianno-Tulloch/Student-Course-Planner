-- 1. Create Major first (so Student can reference it)
CREATE TABLE Major (
    major_id SERIAL PRIMARY KEY,
    major_name VARCHAR(100) NOT NULL,
    level VARCHAR(20) DEFAULT 'undergrad',
    gpa_req DECIMAL(4,2),
    req_credits DECIMAL(4,2)
);

-- 1.5 Create Minor
CREATE TABLE Minor (
    minor_id SERIAL PRIMARY KEY,
    minor_name VARCHAR(100) NOT NULL,
    req_credits DECIMAL(4,2)
);

-- 2. Create Student
CREATE TABLE Student (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    major_id INT REFERENCES Major(major_id),
    minor_id INT REFERENCES Minor(minor_id),
    gpa DECIMAL(4,2)
);

-- 3. Create Term
CREATE TABLE Term (
    term_id SERIAL PRIMARY KEY,
    term_name VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- 3.5 Create Teacher
CREATE TABLE Teacher (
    teacher_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department VARCHAR(50)
);

-- 4. Create Course
CREATE TABLE Course (
    course_code VARCHAR(10) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(20) DEFAULT 'undergrad',
    credits DECIMAL(3,1),
    description TEXT,
    meeting_days VARCHAR(20),  -- e.g., 'MWF', 'TT'
    meeting_times VARCHAR(50)  -- e.g., '10:00 AM - 11:20 AM'
);

-- 4.5 Junction for Course vs Term (Course Offerings)
CREATE TABLE Course_Offering (
    offering_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) REFERENCES Course(course_code),
    term_id INT REFERENCES Term(term_id),
    teacher_id INT REFERENCES Teacher(teacher_id),
    UNIQUE(course_code, term_id)
);

-- 5. Junction for Major Requirements
CREATE TABLE Major_Course_Junction (
    major_id INT REFERENCES Major(major_id),
    course_code VARCHAR(10) REFERENCES Course(course_code),
    core_course BOOLEAN DEFAULT TRUE, -- TRUE = core, FALSE = elective
    PRIMARY KEY (major_id, course_code)
);

-- 6. Course Enrollment (The "Schedule")
CREATE TABLE Course_Enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Student(student_id),
    offering_id INT REFERENCES Course_Offering(offering_id),
    status SMALLINT DEFAULT 0, -- 0 = planned, 1 = in progress, 2 = completed
    grade DECIMAL(4,2)
);
