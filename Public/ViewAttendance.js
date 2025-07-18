function fetchAttendance() {
            const lectureId = document.getElementById('lectureId').value.trim();

            if (!lectureId) {
                alert('Please enter a Lecture ID.');
                return;
            }

            fetch(`/api/attendanceByLecture/${lectureId}`)
                .then(res => res.json())
                .then(data => {
                    const table = document.getElementById('attendanceTable');
                    const tbody = document.getElementById('attendanceBody');
                    tbody.innerHTML = '';

                    if (data.length === 0) {
                        alert('No attendance data found for this lecture ID.');
                        table.style.display = 'none';
                        return;
                    }

                    data.forEach(record => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${record.student_id}</td>
                            <td>${record.student_name}</td>
                            <td>${record.status}</td>
                        `;
                        tbody.appendChild(row);
                    });

                    table.style.display = 'table';
                })
                .catch(err => {
                    console.error('Fetch error:', err);
                    alert('Error fetching attendance data.');
                });
        }