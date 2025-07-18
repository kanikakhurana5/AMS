const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const vosk = require('vosk');
const wav = require('wav');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const MODEL_PATH = "models/vosk-model-small-en-us-0.15";
const SAMPLE_RATE = 16000;

// Vosk model check
if (!fs.existsSync(MODEL_PATH)) {
    console.error("Model not found, please download from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH);
    process.exit();
}
const model = new vosk.Model(MODEL_PATH);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ayush@0401',  // Update your MySQL password
    database: 'attendance_management'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// WebSocket connection for voice recognition
wss.on('connection', function connection(ws) {
    const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });
    const wavReader = new wav.Reader();

    wavReader.on('format', function (format) {
        if (format.sampleRate !== SAMPLE_RATE || format.channels !== 1) {
            console.error("Audio format not supported. Expected 16kHz, mono audio.");
            ws.close();
        }
    });

    wavReader.on('data', function (data) {
        if (rec.acceptWaveform(data)) {
            const result = rec.result();
            const numbers = result.text.match(/\b\d{1,3}\b/g); // Only match 1-3 digit numbers
            if (numbers) {
                ws.send(JSON.stringify({ numbers: numbers.join(', ') }));
            }
        } else {
            const partial = rec.partialResult();
            const numbers = partial.partial.match(/\b\d{1,3}\b/g);
            if (numbers) {
                ws.send(JSON.stringify({ numbers: numbers.join(', ') }));
            }
        }
    });

    ws.on('message', function incoming(data) {
        const audioData = Buffer.from(data);
        wavReader.write(audioData);
    });

    ws.on('close', () => {
        rec.finalResult();
        rec.free();
    });
});

// Routes

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Route to fetch classes
app.get('/getClasses', (req, res) => {
    const query = 'SELECT class_id, class_name FROM classes';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});


// Route to fetch batches
app.get('/getBatches', (req, res) => {
    const query = 'SELECT batch_id, batch_name FROM batches';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching batches:', err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});


// Route to fetch subjects based on teacher_id
app.get('/getSubjectsForTeacher', (req, res) => {
    const teacherId = req.query.teacherId;

    const query = `
        SELECT subject_id, subject_name 
        FROM subjects 
        WHERE teacher_id = ?`;

    db.query(query, [teacherId], (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            res.status(500).send('Server error');
        } else {
            res.json(results);
        }
    });
});

// Route to handle user login
app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND role = ?';
    
    db.query(query, [email, userType], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const user = result[0];
            if (password === user.password) {
                if (userType === 'teacher') {
                    res.send(`
                        <script>
                            sessionStorage.setItem('teacherId', '${user.id}');
                            window.location.href = 'Mark-or-ViewAttendance.html';
                        </script>
                    `);
                } else if (userType === 'student') {
                    res.redirect('graph.html');
                }
            } else {
                res.send('Incorrect password.');
            }
        } else {
            res.send('User not found.');
        }
    });
});

// Fetch classes
app.get('/api/classes', (req, res) => {
    const query = 'SELECT class_id, class_name FROM classes';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Fetch batches
app.get('/api/batches', (req, res) => {
    const query = 'SELECT batch_id, batch_name FROM batches';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Fetch students by class and batch
app.get('/api/students', (req, res) => {
    const { classId, batchId } = req.query;
    let query = 'SELECT id, name, umb_id FROM users WHERE class_id = ?';
    const queryParams = [classId];

    if (batchId && batchId !== 'all') {
        query += ' AND batch_id = ?';
        queryParams.push(batchId);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Submit attendance
app.post('/api/attendance', (req, res) => {
    const attendanceData = req.body; // Expecting an array of attendance records

    // Log the received data for debugging purposes
    console.log("Received attendance data:", attendanceData);

    // Validate attendanceData
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({ error: "Invalid attendance data" });
    }

    // Prepare data for batch insertion
    const values = attendanceData.map(record => {
        if (!record.lecture_id || !record.student_id || !record.status) {
            console.error("Missing data in attendance record:", record);
            return null; // Skip invalid records
        }
        return [record.lecture_id, record.student_id, record.status.toLowerCase()];
    }).filter(value => value !== null); // Filter out any invalid records

    if (values.length === 0) {
        return res.status(400).json({ error: "No valid attendance records to insert" });
    }

    const query = `
        INSERT INTO attendance (lecture_id, student_id, status) 
        VALUES ?
    `;

    // Execute the batch insertion query
    db.query(query, [values], (err, results) => {
        if (err) {
            console.error("SQL error while inserting attendance:", err); // Log the error object
            return res.status(500).json({ error: "Failed to insert attendance records. " + err.message });
        }
        console.log("Attendance inserted successfully:", results);
        res.status(201).json({ message: 'Attendance submitted successfully', results });
    });
});

// Helper function to update or add attendance records locally
/*function updateAttendance(lectureId, studentId, status) {
    const existingRecordIndex = attendanceRecords.findIndex(
        record => record.student_id === studentId && record.lecture_id === lectureId
    );
    if (existingRecordIndex > -1) {
        // Update existing record
        attendanceRecords[existingRecordIndex].status = status.toLowerCase();
    } else {
        // Add new record
        attendanceRecords.push({ lecture_id: lectureId, student_id: studentId, status: status.toLowerCase() });
    }
}*/


//fetch marked attendance 

app.get('/api/attendanceByLecture/:lectureId', (req, res) => {
    const lectureId = req.params.lectureId;

    const query = `
        SELECT a.student_id, u.name AS student_name, a.status
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.lecture_id = ?`;

    db.query(query, [lectureId], (err, results) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});


// Save attendance details and store lecture_id in session storage
app.post('/saveAttendance', (req, res) => {
    const { attendanceType, date, time, lectureNumber, subject_id, topic, class_id, batch_id } = req.body;

    const query = `
        INSERT INTO lecture_details (lecture_type, subject_id, lecture_number, date, topic, time, class_id, batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [attendanceType, subject_id, lectureNumber, date, topic, time, class_id, batch_id], (err, result) => {
        if (err) {
            console.error('Error inserting lecture details:', err);
            return res.status(500).send('Server error');
        }
        
        const insertedLectureId = result.insertId;

        res.send(`
          <script>
            sessionStorage.setItem('recentLectureId', '${insertedLectureId-1}');
            alert('Lecture ID ${insertedLectureId-1} has been saved in session storage for further use and Lecture added successfully!');
            window.location.href = 'MarkAttendance.html';
          </script>
        `);
    });
});

// Start server
server.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});
