document.addEventListener('DOMContentLoaded', function() {
    const teacherId = sessionStorage.getItem('teacherId');

    if (teacherId) {
        // Fetch subjects
        fetch(`/getSubjectsForTeacher?teacherId=${teacherId}`)
            .then(response => response.json())
            .then(subjects => {
                const subjectDropdown = document.getElementById('subject_id');
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.subject_id; // value is subject_id
                    option.textContent = `${subject.subject_id} - ${subject.subject_name}`; // display subject_id and subject_name
                    subjectDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching subjects:', error);
            });

        // Fetch classes
        fetch('/getClasses')
            .then(response => response.json())
            .then(classes => {
                const classDropdown = document.getElementById('class_id');
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class_id; // value is class_id
                    option.textContent = cls.class_name; // display class_name
                    classDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching classes:', error);
            });

        // Fetch batches
        fetch('/getBatches')
            .then(response => response.json())
            .then(batches => {
                const batchDropdown = document.getElementById('batch_id');
                batches.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.batch_id; // value is batch_id
                    option.textContent = batch.batch_name; // display batch_name
                    batchDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching batches:', error);
            });
    } else {
        console.error('Teacher ID not found in sessionStorage');
    }

    // Add event listener for form submission to store lecture_id in session storage
    document.getElementById('lectureForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(event.target);

        // Create an object from the form data
        const data = Object.fromEntries(formData.entries());

        // Send the data to the backend
        fetch('/addLecture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.lecture_id) {
                // Store the lecture_id in session storage
                sessionStorage.setItem('lecture_id', result.lecture_id);
                
                // Fetch class_id and batch_id using lecture_id
                return fetch(`/getClassAndBatchForLecture?lectureId=${result.lecture_id}`);
            } else {
                alert('Failed to add lecture');
                return Promise.reject('Failed to add lecture');
            }
        })
        .then(response => {
            if (!response) return Promise.reject('No response from fetch');
            return response.json();
        })
        .then(classAndBatch => {
            console.log('Class and Batch IDs:', classAndBatch);  // Log the received IDs
            if (classAndBatch) {
                // Display class_id and batch_id in a popup message
                alert(`Lecture added successfully!\nClass ID: ${classAndBatch.class_id}\nBatch ID: ${classAndBatch.batch_id}`);
            } else {
                alert('Class and Batch IDs not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding the lecture or fetching class/batch IDs.');
        });
    });
});
