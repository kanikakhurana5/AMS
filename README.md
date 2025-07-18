# Attendance Management System

Attendance Management System is a web-based platform developed to simplify and digitalize the process of marking and analyzing student attendance in educational institutions. It supports multiple user roles Teacher and Student while managing lectures and labs across various classes and batches. The system provides a seamless experience for marking, storing, viewing, and analyzing attendance records efficiently.

Demo Video
-----

https://github.com/user-attachments/assets/35d170cf-2b4b-48ee-ab38-34552eaee1d7



Table of Contents
-----

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Database Structure](#database-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Challenges Faced](#challenges-faced)
- [Future Scope](#future-scope)
- [Contributing](#contributing)

Features
-----

### Role-Based Access

- **Teacher**

    - Mark attendance (lecture/lab)
    - View attendance records

- **Student**

    - View personal attendance in graphical and tabular formats
    - Get access to Syllabus and notes of the semester


### Class & Batch Management

- Support for two main classes: T1 and T2

- Each class has three batches:
    - T1: T11, T12, T13
    - T2: T21, T22, T23

- Lectures are conducted at the class level

- Labs are conducted at the batch level


### Attendance Analytics

- Daily and subject-wise attendance summaries
- Graphical charts for students to visualize their attendance

Technologies Used
----

- HTML, CSS, JavaScript (Frontend)
- Node.js (for backend logic)
- MySQL (Database)
- Chart.js / Google charts (for attendance visualization)
- Express (for routing)

Database Structure
----

### `users`  
Stores user credentials and role-based data  
- `id`, `username`, `password`, `role`, `umb_id`, `name`, `email`, `class_id`, `batch_id`

### `classes`  
- `class_id`, `class_name` (e.g., T1, T2)

### `batches`  
- `batch_id`, `batch_name`, `class_id`

### `subjects`  
- `subject_id`, `subject_name`, `teacher_id`

### `lecture_details`  
Stores individual lecture/lab session info  
- `lecture_id`, `lecture_type` (`lecture` or `lab`), `subject_id`, `lecture_number`, `date`, `topic`, `time`, `class_id`, `batch_id`

### `attendance`  
Records attendance status of students per session  
- `attendance_id`, `lecture_id`, `student_id`, `status` (`present`/`absent`)

### `student_subject`  
Linking students with their subjects  
- `student_id`, `subject_id`

### `student_attendance_summary`  
Stores computed analytics  
- `student_id`, `subject_id`, `total_lectures`, `lectures_attended`


Installation
----

**Prerequisites**
- Node.js and npm 
- MySQL Server

**Steps**

1. Clone the repository:
```
git clone https://github.com/yourusername/attendance-management-system.git
```
```
cd attendance-management-system
```

2. Install dependencies:
```
npm install express http ws mysql2 fs path vosk wav cors body-parser
```
3. Download the VOSK Models:

[vosk-model-small-en-us-0.15](https://alphacephei.com/vosk/models)
 
4. Set up the database:

- Create a database (e.g., attendance_db)
- Import the provided schema.sql file
- Update DB config in config/db.js or .env

5. Start the server:
```
node server.js
```


Usage
----

1. Open your browser and go to http://localhost:3000
2. Log in as Teacher or Student
3. Teacher: Create lectures/labs and mark attendance
4. Student: View attendance data and graphs and access notes and syllabus

Challenges Faced
---

- Handling separate workflows for lectures and labs
- Efficient data mapping for users across classes and batches
- Implementing Speech recognition feature
- Designing feature which show only those to teacher which they are assigned

Future Scope
----

- Biometric/QR-based attendance marking
- Edit the mrked attendace
- Download the attendnce in different forms (like pdf, excel, etc)

Contributing
----

1. Fork the repository
2. Create a new branch (git checkout -b feature-name)
3. Commit your changes (git commit -m "Added feature")
4. Push to your branch (git push origin feature-name)
5. Create a pull request
