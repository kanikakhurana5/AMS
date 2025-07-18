let recognition;
let isRecording = false;

// Map of number words to digits
const numberWordsToDigits = {
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
    'zero': '0'
};

document.addEventListener('DOMContentLoaded', () => {
    const classSelect = document.getElementById('classSelect');
    const batchSelect = document.getElementById('batchSelect');
    const fetchStudentsButton = document.getElementById('fetchStudents');
    const studentsTableBody = document.querySelector('#studentsTable tbody');
    const submitAttendanceButton = document.getElementById('submitAttendance');
    const studentIdInput = document.getElementById('studentIdInput');
    const allPresentButton = document.getElementById('allPresent');
    const allAbsentButton = document.getElementById('allAbsent');
    const markByIdButton = document.getElementById('markById');
    const lectureIdInput = document.getElementById('lectureIdInput');
    const startBtn = document.createElement('button');
    const pauseBtn = document.createElement('button');
    startBtn.id = 'start-btn';
    startBtn.textContent = 'Start';
    pauseBtn.id = 'pause-btn';
    pauseBtn.textContent = 'Pause';
    document.body.appendChild(startBtn);
    document.body.appendChild(pauseBtn);

    let currentStatus = ''; // Track whether all are marked present or absent
    const attendanceRecords = [];

    // Fetch classes and batches on page load
    fetch('/api/classes')
        .then(response => response.json())
        .then(data => {
            data.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.class_id;
                option.textContent = classItem.class_name;
                classSelect.appendChild(option);
            });
        });

    fetch('/api/batches')
        .then(response => response.json())
        .then(data => {
            data.forEach(batchItem => {
                const option = document.createElement('option');
                option.value = batchItem.batch_id;
                option.textContent = batchItem.batch_name;
                batchSelect.appendChild(option);
            });
        });

    // Fetch students based on selected class and batch
    fetchStudentsButton.addEventListener('click', () => {
        const selectedClassId = classSelect.value;
        const selectedBatchId = batchSelect.value;

        let fetchUrl = `/api/students?classId=${selectedClassId}`;
        if (selectedBatchId !== '' && selectedBatchId !== 'all') {
            fetchUrl += `&batchId=${selectedBatchId}`;
        }

        fetch(fetchUrl)
            .then(response => response.json())
            .then(data => {
                studentsTableBody.innerHTML = ''; // Clear existing rows
                attendanceRecords.length = 0; // Reset attendance records
                data.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${student.umb_id}</td>
                        <td>
                            <button class="mark-present" data-id="${student.id}">Present</button>
                            <button class="mark-absent" data-id="${student.id}">Absent</button>
                        </td>
                    `;
                    studentsTableBody.appendChild(row);
                });
            });
    });

    // Add event listeners for marking present/absent
    studentsTableBody.addEventListener('click', (event) => {
        const lectureId = lectureIdInput.value.trim(); // Get lecture ID from input

        if (!lectureId) {
            alert('Please enter the lecture ID before marking attendance.');
            return;
        }

        if (event.target.classList.contains('mark-present')) {
            const presentButton = event.target;
            const absentButton = presentButton.nextElementSibling;
            const studentId = presentButton.getAttribute('data-id');
            
            presentButton.classList.add('selected');
            absentButton.classList.remove('selected');
            
            updateAttendance(lectureId, studentId, 'present');
        }

        if (event.target.classList.contains('mark-absent')) {
            const absentButton = event.target;
            const presentButton = absentButton.previousElementSibling;
            const studentId = absentButton.getAttribute('data-id');
            
            absentButton.classList.add('selected');
            presentButton.classList.remove('selected');
            
            updateAttendance(lectureId, studentId, 'absent');
        }
    });

    // Mark all students as present or absent
    allPresentButton.addEventListener('click', () => {
        markAll('present');
        currentStatus = 'present';
    });

    allAbsentButton.addEventListener('click', () => {
        markAll('absent');
        currentStatus = 'absent';
    });

    // Function to mark all students present/absent
    function markAll(status) {
        const lectureId = lectureIdInput.value.trim(); // Get lecture ID from input

        if (!lectureId) {
            alert('Please enter the lecture ID before marking attendance.');
            return;
        }

        document.querySelectorAll('#studentsTable tbody tr').forEach(row => {
            const presentButton = row.querySelector('.mark-present');
            const absentButton = row.querySelector('.mark-absent');
            const studentId = presentButton.getAttribute('data-id');

            if (status === 'present') {
                presentButton.classList.add('selected');
                absentButton.classList.remove('selected');
            } else {
                absentButton.classList.add('selected');
                presentButton.classList.remove('selected');
            }

            updateAttendance(lectureId, studentId, status);
        });
    }

    // Function to handle marking students by IDs from text field input
    markByIdButton.addEventListener('click', () => {
        const studentIds = studentIdInput.value.trim().split(',');
        const lectureId = lectureIdInput.value.trim(); // Get lecture ID from input

        if (!lectureId) {
            alert('Please enter the lecture ID before marking attendance.');
            return;
        }

        studentIds.forEach(studentId => {
            const studentRow = document.querySelector(`button[data-id="${studentId.trim()}"]`);
            if (studentRow) {
                const presentButton = studentRow.parentElement.querySelector('.mark-present');
                const absentButton = studentRow.parentElement.querySelector('.mark-absent');

                if (currentStatus === 'present') {
                    absentButton.classList.add('selected');
                    presentButton.classList.remove('selected');
                    updateAttendance(lectureId, studentId.trim(), 'absent');
                } else if (currentStatus === 'absent') {
                    presentButton.classList.add('selected');
                    absentButton.classList.remove('selected');
                    updateAttendance(lectureId, studentId.trim(), 'present');
                }
            }
        });
        studentIdInput.value = ''; // Clear input field after marking
    });

    // Update attendance record for individual students with lecture ID
    function updateAttendance(lectureId, studentId, status) {
        const existingRecordIndex = attendanceRecords.findIndex(
            record => record.lecture_id === lectureId && record.student_id === studentId
        );
        if (existingRecordIndex > -1) {
            attendanceRecords[existingRecordIndex].status = status;
        } else {
            attendanceRecords.push({ lecture_id: lectureId, student_id: studentId, status });
        }
    }

    // Submit attendance
    submitAttendanceButton.addEventListener('click', () => {
        const totalStudents = document.querySelectorAll('#studentsTable tbody tr').length;
        if (attendanceRecords.length < totalStudents) {
            alert('Please mark attendance for all students before submitting.');
            return;
        }

        fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attendanceRecords),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Show success message
            attendanceRecords.length = 0; // Clear records after submission
            window.location.href = 'Mark-or-ViewAttendance.html'; // Redirect to another page
        })
        .catch(error => {
            console.error('Error submitting attendance:', error);
        });
    });

    // Voice Recognition Setup
    startBtn.addEventListener('click', function () {
        if (!isRecording) {
            startRecognition();
        }
    });

    pauseBtn.addEventListener('click', function () {
        if (isRecording) {
            recognition.stop();
            isRecording = false;
            pauseBtn.disabled = true;
            startBtn.disabled = false;
        }
    });

    function startRecognition() {
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        isRecording = true;
        pauseBtn.disabled = false;
        startBtn.disabled = true;

        recognition.addEventListener('result', (e) => {
            const transcript = Array.from(e.results)
                .map(result => result[0].transcript)
                .join('')
                .trim();

            // Replace number words with digits
            const digitTranscript = transcript.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|zero)\b/g, matched => {
                return numberWordsToDigits[matched];
            });

            // Regular expression to match all single, two, or three-digit numbers
            const numberPattern = /\b\d{1,3}\b/g;
            const matchedNumbers = digitTranscript.match(numberPattern);

            if (matchedNumbers) {
                // Append recognized numbers to the studentIdInput field, separated by commas
                studentIdInput.value += matchedNumbers.join(', ') + ', ';
            }
        });

        recognition.addEventListener('end', () => {
            if (isRecording) {
                recognition.start(); // Continue listening if not paused
            }
        });

        recognition.start();
    }
});
