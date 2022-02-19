const classId = window.location.pathname.split('/')[2]
var selectedStudents = []
var active = true
var classData = ''

async function classInfo() {
    classData = (await db.collection('matches').doc(classId).get()).data()
    if (classData.inactive) {
        active = false
    }
    const subject = classData.subject
    const tutor = classData.tutor
    const students = classData.students
    if (!active) {
        document.getElementById('tutor-action').remove()
        document.getElementById('inactivate-btn').remove()
        document.getElementById('name').innerHTML =
            'Inactive ' +
            subject.charAt(0).toUpperCase() +
            subject.slice(1) +
            ' Class'
    } else {
        document.getElementById('activate-btn').remove()
        document.getElementById('name').innerHTML =
            subject.charAt(0).toUpperCase() + subject.slice(1) + ' Class'
    }
    if (tutor === localStorage.getItem('uid')) {
        if (active) {
            document.getElementById('instructions').innerHTML =
                'Since you are the tutor of this class, you can click on students you want to remove from the class. You can also log your hours with the menu below. Click on students that attended the class to log hours.'
        }
        document.getElementById('tutor').remove()
        document.getElementById('class-mates').remove()
        var blocks = []
        for (student of students) {
            blocks.push([
                student.student,
                student.studentName,
                student.studentEmail,
                'students',
            ])
        }
        if (blocks.length === 0 && active) {
            inactivate()
        }
    } else {
        document.getElementById('instructions').innerHTML =
            'Since you are the student of this class, you can email your tutor through the menu below. Here is also the information about your classmates and tutor.'
        document.getElementById('students').remove()
        var blocks = [
            [
                classData.tutor,
                classData.tutorName,
                classData.tutorEmail,
                'tutor',
            ],
        ]
        var classmate = false
        for (student of students) {
            if (student.student != localStorage.getItem('uid')) {
                classmate = true
                blocks.push([
                    student.student,
                    student.studentName,
                    student.studentEmail,
                    'class-mates',
                ])
            }
        }
        if (!classmate) {
            document.getElementById('class-mates').remove()
        }
    }
    for (blockInfo of blocks) {
        var block = document.createElement('div')
        block.className = 'block'
        block.id = blockInfo[0]
        if (blockInfo[3] === 'students' && active) {
            block.setAttribute('onclick', 'selectPerson(this.id)')
        }
        var titleBlock = document.createElement('h3')
        titleBlock.className = 'title-block'
        titleBlock.innerHTML = blockInfo[1]
        block.append(titleBlock)
        const fields = ['Email: ' + blockInfo[2]]
        for (field of fields) {
            var fieldBlock = document.createElement('p')
            fieldBlock.className = 'block-field'
            fieldBlock.innerHTML = field
            block.append(fieldBlock)
        }
        document.getElementById(blockInfo[3]).appendChild(block)
    }

    document.querySelector('.main-body').classList.remove('temp')
}

classInfo()

async function selectPerson(studentId) {
    document.getElementById(studentId).classList.toggle('selected-person')
    if (selectedStudents.includes(studentId)) {
        const index = selectedStudents.indexOf(studentId)
        selectedStudents.splice(index, 1)
    } else {
        selectedStudents.push(studentId)
    }
    if (selectedStudents.length > 0) {
        document.getElementById('action-selected').classList.remove('temp')
        document.getElementById('tutor-action').classList.remove('temp')
    } else {
        document.getElementById('action-selected').classList.add('temp')
        document.getElementById('tutor-action').classList.add('temp')
    }
}

async function logClass() {
    if (classData === '') {
        return
    }
    const e = document.getElementById('log-hours')
    e.disabled = true
    const date = document.getElementById('date-class')
    const minutes = document.getElementById('minutes-class')
    if (minutes.value >= 300) {
        token('You may only log less than 300 minutes at a time')
        e.disabled = false
        return
    }
    const dateValidate = validate(date)
    const minutesValidate = validate(minutes)
    if (!(dateValidate && minutesValidate)) {
        e.disabled = false
        token(
            'Make sure to fill out all of the fields to log your volunteering!'
        )
        return
    }

    var subject = classData.subject
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

    await db
        .collection('users')
        .doc(localStorage.getItem('uid'))
        .update({
            'volunteer-entries':
                firebase.firestore.FieldValue.arrayUnion(entry),
        })

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/volunteer-log', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            entry: entryStudent,
            tutorEmail: classData.tutorEmail,
            students: students,
        })
    )
    xhr.onload = function () {
        if (this.response === 'false') {
            token('This class no longer exists')
            inactivate()
            return
        }
        token('This class has been logged!')
        document.getElementById('minutes-class').value = ''
        document.getElementById('date-class').value = ''
        e.disabled = false
    }
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

async function inactivate() {
    await db.collection('matches').doc(classId).update({
        inactive: true,
    })
    token('Class is now declared inactive!')
    setTimeout(() => window.location.reload(), 2000)
}

async function activate() {
    await db.collection('matches').doc(classId).update({
        inactive: firebase.firestore.FieldValue.delete(),
    })
    token('Class is now declared active!')
    setTimeout(() => window.location.reload(), 2000)
}

function sendEmail() {
    var emails = ''
    if (localStorage.getItem('uid') === classData.tutor) {
        classData.students.forEach((student) => {
            emails += student.studentEmail + ','
        })
    } else {
        emails = classData.tutorEmail
    }
    parent.location =
        'mailto:' +
        emails +
        '?body=' +
        document.getElementById('email').value +
        '&&subject=Educationist Tutoring Class'
}

async function removeStudent() {
    document.getElementById('remove-btn').disabled = true
    for (student of selectedStudents) {
        var studentInfo = ''
        classData.students.forEach((studentData) => {
            if (studentData.student === student) {
                studentInfo = studentData
            }
        })
        const index = classData.students.indexOf(studentInfo)
        var update = {
            students: firebase.firestore.FieldValue.arrayRemove(studentInfo),
            formerStudents:
                firebase.firestore.FieldValue.arrayUnion(studentInfo),
        }
        await db.collection('matches').doc(classId).update(update)
        document.getElementById(student).remove()
    }
    token('Removed Student')
    document.getElementById('remove-btn').disabled = false
}
