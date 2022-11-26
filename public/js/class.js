const urlParams = new URLSearchParams(window.location.search)
const classId = urlParams.get('id')
var selectedStudents = []
var classData = ''

async function classInfo() {
    var active = true
    try {
        classData = (await db.collection('matches').doc(classId).get()).data()
    } catch {
        return notFound()
    }
    active = !classData.inactive
    const subject = classData.subject
    if (!active) {
        document.getElementById('name').innerHTML =
            'Inactive ' + capitalize(subject) + ' Class'
        document.getElementById('action').classList.add('invisible')
        document.getElementById('edit-control').classList.add('invisible')
        document.getElementById('archived').classList.remove('invisible')
        document.querySelector('i').classList.add('invisible')
    } else {
        document.getElementById('name').innerHTML =
            capitalize(subject) + ' Class'
    }

    if (classData.nickName) {
        document.getElementById('name').innerHTML = classData.nickName
    }

    let tables = []

    if (classData.tutor === localStorage.getItem('uid')) {
        document.getElementById('tutor').remove()
        document.getElementById('class-mates').remove()
        let students = []
        for (const student of classData.students) {
            students.push([
                student.student,
                student.studentName,
                student.studentEmail,
            ])
        }
        tables.push([students, true, 'students'])
        if (students.length === 0 && active) {
            inactivate()
        }
    } else {
        document.getElementById('tutor-action').remove()
        document.getElementById('edit-control').remove()
        document.getElementById('students').remove()
        const tutorData = [
            [classData.tutor, classData.tutorName, classData.tutorEmail],
        ]
        tables.push([tutorData, false, 'tutor'])
        var classmate = false
        let classMates = []
        for (const student of classData.students) {
            if (student.student != localStorage.getItem('uid')) {
                classmate = true
                classMates.push([
                    student.student,
                    student.studentName,
                    student.studentEmail,
                ])
            }
        }
        if (!classmate) {
            document.getElementById('class-mates').remove()
        } else {
            tables.push([classMates, false, 'class-mates'])
        }
    }
    for (const table of tables) {
        const tutor = table[1]
        const tableElm = document.createElement('table')
        const tableHead = document.createElement('tr')
        const nameHead = document.createElement('th')
        nameHead.innerHTML = 'Name'
        const emailHead = document.createElement('th')
        emailHead.innerHTML = 'Email'
        tableHead.appendChild(nameHead)
        tableHead.appendChild(emailHead)
        if (tutor) {
            const attendanceHead = document.createElement('th')
            attendanceHead.innerHTML = 'Attendance'
            tableHead.appendChild(attendanceHead)
        }

        tableElm.appendChild(tableHead)

        for (const person of table[0]) {
            const tr = document.createElement('tr')
            tr.id = person[0]
            const nameCollumn = document.createElement('td')
            nameCollumn.innerHTML = person[1]
            const emailCollumn = document.createElement('td')
            emailCollumn.innerHTML = person[2]
            tr.appendChild(nameCollumn)
            tr.appendChild(emailCollumn)
            if (tutor) {
                const actionCollumn = document.createElement('td')
                const actionButton = document.createElement('button')
                actionButton.classList.add('table-btn')
                actionButton.classList.add('attendance-btn')
                actionButton.onclick = function () {
                    addStudent(this)
                }
                actionButton.innerHTML = 'Mark Present'
                actionCollumn.appendChild(actionButton)
                const removeButton = document.createElement('button')
                removeButton.classList.add('table-btn')
                removeButton.onclick = function () {
                    removeStudent(this.parentNode.parentNode.id)
                }
                removeButton.innerHTML = 'Remove Student'
                removeButton.classList.add('remove-btn')
                removeButton.classList.add('invisible')
                actionCollumn.appendChild(removeButton)
                tr.appendChild(actionCollumn)
            }
            tableElm.appendChild(tr)
        }
        if (!active) {
            tableElm.classList.add('inactive-table')
        }
        document.getElementById(table[2]).appendChild(tableElm)
    }
}

classInfo()

async function addStudent(button) {
    const studentId = button.parentNode.parentNode.id
    document.getElementById(studentId).classList.toggle('selected')
    if (selectedStudents.includes(studentId)) {
        button.innerHTML = 'Select Student'
        const index = selectedStudents.indexOf(studentId)
        selectedStudents.splice(index, 1)
    } else {
        button.innerHTML = 'Mark Absent'
        selectedStudents.push(studentId)
    }
}

function editClass(icon) {
    document.getElementById('action').classList.toggle('invisible')
    document.getElementById('edit-control').classList.toggle('invisible')
    icon.classList.toggle('bi-pencil')
    icon.classList.toggle('bi-check-lg')
    const attendanceButtons = document.querySelectorAll('.attendance-btn')
    for (const button of attendanceButtons) {
        button.classList.toggle('invisible')
    }
    const removeButtons = document.querySelectorAll('.remove-btn')
    for (const button of removeButtons) {
        button.classList.toggle('invisible')
    }
}

function sendEmail() {
    var emails = ''
    if (localStorage.getItem('uid') != classData.tutor) {
        emails = classData.tutorEmail
    }
    classData.students.forEach((student) => {
        if (localStorage.getItem('uid') != student.student) {
            emails += student.studentEmail + ','
        }
    })
    openLink('mailto:' + emails + '?subject=Educationist Tutoring Class')
}

async function removeStudent(studentId) {
    let studentInfo
    classData.students.forEach((studentData) => {
        if (studentData.student === studentId) {
            studentInfo = studentData
        }
    })
    customAlert(
        'Are you sure you want to remove ' +
            studentInfo.studentName +
            ' from this class?',
        async () => {
            var update = {
                students:
                    firebase.firestore.FieldValue.arrayRemove(studentInfo),
                formerStudents:
                    firebase.firestore.FieldValue.arrayUnion(studentInfo),
            }
            await db.collection('matches').doc(classId).update(update)
            document.getElementById(studentId).remove()
            notify('Removed Student')
        }
    )
}

async function inactivate() {
    customAlert('Are you sure you want to archive this class?', async () => {
        await db.collection('matches').doc(classId).update({
            inactive: true,
        })
        notify('Class is now declared inactive')
        document.getElementById('action').classList.add('invisible')
        document.getElementById('edit-control').classList.add('invisible')
        document.getElementById('archived').classList.remove('invisible')
        document.querySelector('i').classList.add('invisible')
        const tables = document.querySelectorAll('table')
        for (const table of tables) {
            table.classList.add('inactive-table')
        }
        if (!classData.nickName) {
            document.getElementById('name').innerHTML =
                'Inactive ' + capitalize(classData.subject) + ' Class'
        }
    })
}

async function activate() {
    customAlert('Are you sure you want to archive this class?', async () => {
        await db.collection('matches').doc(classId).update({
            inactive: firebase.firestore.FieldValue.delete(),
        })
        notify('Class is now declared active')
        document.getElementById('action').classList.remove('invisible')
        document.getElementById('archived').classList.add('invisible')
        document.querySelector('i').classList.remove('invisible')
        const tables = document.querySelectorAll('table')
        for (const table of tables) {
            table.classList.remove('inactive-table')
        }
        if (!classData.nickName) {
            document.getElementById('name').innerHTML =
                capitalize(classData.subject) + ' Class'
        }
    })
}

async function nickName() {
    const nick = document.getElementById('nick-name').value
    customAlert(
        'Are you sure you want to change the name of your class to ' +
            nick +
            '?',
        async () => {
            if (nick.length > 12) {
                token(
                    'This nick name is too long. Please choose something shorter.'
                )
                return
            }
            await db
                .collection('matches')
                .doc(classId)
                .update({ nickName: nick })
            notify('Updated nick name to ' + nick)
            document.getElementById('name').innerHTML = nick
        }
    )
}

async function logClass() {
    const date = document.getElementById('date-class')
    const minutes = document.getElementById('minutes-class')
    if (minutes.value > 300) {
        return customAlert(
            'You may only log a maximum of 300 minutes at a time!',
            false,
            true
        )
    }
    const dateValidate = validate(date)
    const minutesValidate = validate(minutes)
    if (!dateValidate || !minutesValidate) {
        return notify(
            'Make sure to fill out all of the fields to log your volunteering!'
        )
    }

    if (selectedStudents.length === 0) {
        return customAlert(
            'You must first mark students present before logging a class.',
            false,
            true
        )
    }

    customAlert(
        'Are you sure you want to log a class of ' +
            minutes.value +
            ' minutes on ' +
            date.value +
            '? By continuing you verify that this information is accurate.',
        async () => {
            let subject = classData.subject
            const students = classData.students.filter((student) =>
                selectedStudents.includes(student.student)
            )

            const entry = {
                date: firebase.firestore.Timestamp.fromMillis(
                    new Date(date.value).getTime()
                ),
                minutes: parseInt(minutes.value),
                information: {
                    type: 'tutor',
                    reference: {
                        students: students,
                        subject: subject,
                        match: classId,
                    },
                },
            }

            const entryStudent = {
                date: date.value,
                minutes: parseInt(minutes.value),
                information: {
                    tutor: classData.tutorName,
                    subject: subject,
                    match: classId,
                },
            }

            request(
                '/volunteer-log',
                'POST',
                () => {
                    if (this.response === 'false') {
                        customAlert(
                            'We have found fraudulent information in your records for this class. Please contact educationist for more information.',
                            false,
                            true
                        )
                        inactivate()
                        return
                    }
                    db.collection('users')
                        .doc(localStorage.getItem('uid'))
                        .update({
                            'volunteer-entries':
                                firebase.firestore.FieldValue.arrayUnion(entry),
                        })
                    document.getElementById('minutes-class').value = ''
                    document.getElementById('date-class').value = ''
                    if (this.response === 'Failure') {
                        customAlert(
                            'We were unable to send a confirmation email, but your class was logged. Please contact educationist for more information.',
                            false,
                            true
                        )
                    } else {
                        notify('This class has been logged!')
                    }
                },
                false,
                {
                    entry: entryStudent,
                    tutorEmail: classData.tutorEmail,
                    students: students,
                }
            )
        }
    )
}

function validate(element) {
    if (element.value === '') {
        element.classList.add('error-decorator')
        return false
    }
    var re = /\S+@\S+\.\S+/
    if (element.id === 'email' && !re.test(element.value)) {
        element.classList.add('error-decorator')
        return false
    }
    element.classList.remove('error-decorator')
    return true
}
