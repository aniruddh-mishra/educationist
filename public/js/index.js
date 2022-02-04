const { degrees, PDFDocument, StandardFonts, rgb } = PDFLib
var dataSet = ['name', 'birthday', 'email', 'timezone', 'subjects']
var classData = {}
const storage = firebase.app().storage('gs://educationist-42b45.appspot.com/')
const storageRef = storage.ref()
const uid = localStorage.getItem('uid')
const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

async function getData() {
    const uid = localStorage.getItem('uid')
    const userData = await db.collection('users').doc(uid).get()
    localStorage.setItem('timezone', userData.data().timezone)
    localStorage.setItem('role', userData.data().role)
    localStorage.setItem('name', userData.data().name)
    localStorage.setItem('email', userData.data().email)
    const subjects = userData.data().subjects
    const age =
        new Date().getFullYear() -
        userData.data().birthday.toDate().getFullYear()
    localStorage.setItem('age', age)
    const volunteerHours = userData.data()['volunteer-entries']
    const attendance = userData.data()['attendance-entries']

    var volunteering = false
    var attendanceData = false

    if (volunteerHours != undefined) {
        var minutes = 0
        const data = []
        for (entry of volunteerHours) {
            if (entry.information.type === 'transfer') {
                minutes = entry.minutes
                continue
            }
            data.push({
                date: entry.date.toDate(),
                minutes: entry.minutes,
            })
        }

        data.sort((a, b) => {
            return a.date < b.date ? -1 : a.date == b.date ? 0 : 1
        })

        const hours = []
        const dates = []

        data.forEach((doc) => {
            dates.push(
                month[doc.date.getUTCMonth()] +
                    ' ' +
                    doc.date.getUTCDate() +
                    ', ' +
                    doc.date.getUTCFullYear()
            )
            minutes += doc.minutes
            hours.push(Number((doc.minutes / 60).toFixed(1)))
        })
        volunteering = [dates, hours, minutes]
    }

    if (attendance != undefined) {
        const data = []
        for (entry of attendance) {
            data.push({
                date: entry.date.toDate(),
                minutes: entry.minutes,
            })
        }

        data.sort((a, b) => {
            return a.date < b.date ? -1 : a.date == b.date ? 0 : 1
        })

        const hours = []
        const dates = []

        var minutes = 0

        data.forEach((doc) => {
            dates.push(
                doc.date.toLocaleString('default', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })
            )
            minutes += doc.minutes
            hours.push(Number((doc.minutes / 60).toFixed(1)))
        })
        attendanceData = [dates, hours, minutes]
    }
    placeData(userData.data(), volunteering, subjects, attendanceData)
}

getData()

async function placeData(data, dates, subjects, attendance) {
    data.birthday = data.birthday.toDate()
    data.birthday =
        month[data.birthday.getUTCMonth()] +
        ' ' +
        data.birthday.getUTCDate() +
        ', ' +
        data.birthday.getUTCFullYear()
    if (data.role != 'student' && data['subjects'] == undefined) {
        createBlock(
            'Subjects',
            [
                'You are not accepted in any subjects. If you believe you are, try to transfer your information first. If not, fill out <a style="text-decoration: underline" href="https://docs.google.com/forms/d/1L0WRzXm20G5SmhCkv2y0ODKYTpUwGkGloOJsXgQFI0c/" target="_blank" rel="noopener noreferrer">this form!</a>',
            ],
            'small'
        )
    }

    if (data['subjects'] != undefined) {
        var subjectsPresent = ''
        for (subject of subjects) {
            subjectsPresent +=
                subject.charAt(0).toUpperCase() + subject.slice(1) + ', '
        }
        data['subjects'] = subjectsPresent.trim().slice(0, -1)
    }

    for (dataField of dataSet) {
        if (data[dataField] == undefined) {
            continue
        }
        createBlock(
            dataField.charAt(0).toUpperCase() + dataField.slice(1),
            [data[dataField]],
            'small'
        )
    }

    if (dates) {
        createBlock(
            'Volunteer Hours',
            [Number((dates[2] / 60).toFixed(1)) + ' Hours'],
            'small'
        )
    }

    if (attendance) {
        createBlock(
            'Total Attendance',
            [Number((attendance[2] / 60).toFixed(1)) + ' Hours'],
            'small'
        )
    }

    spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.account').appendChild(spacer)

    classes()

    if (data.role != 'student') {
        matchRequests(subjects)
    }

    if (dates) {
        createBlock(
            'Volunteer Hours',
            ['<canvas id="volunteerHours"></canvas>'],
            'large'
        )
        new Chart('volunteerHours', {
            type: 'line',
            data: {
                labels: dates[0],
                datasets: [
                    {
                        label: 'Volunteer Hours',
                        pointRadius: 5,
                        pointBackgroundColor: 'white',
                        data: dates[1],
                        borderWidth: 1,
                        backgroundColor: '#38b18a',
                    },
                ],
            },
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                    xAxes: [
                        {
                            display: false,
                        },
                    ],
                },
                layout: {
                    padding: 20,
                },
            },
        })
        document.getElementById('request-certificate').classList.remove('temp')
    } else {
        document.getElementById('request-certificate').remove()
    }

    if (attendance) {
        createBlock(
            'Class Attendance',
            ['<canvas id="attendance"></canvas>'],
            'large'
        )
        new Chart('attendance', {
            type: 'line',
            data: {
                labels: attendance[0],
                datasets: [
                    {
                        label: 'Volunteer Hours',
                        pointRadius: 5,
                        pointBackgroundColor: 'white',
                        data: attendance[1],
                        borderWidth: 1,
                        backgroundColor: '#38b18a',
                    },
                ],
            },
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                    xAxes: [
                        {
                            display: false,
                        },
                    ],
                },
                layout: {
                    padding: 20,
                },
            },
        })
    }

    document.querySelector('.matching-request').classList.remove('temp')
}

function createBlock(title, fields, size, blockId) {
    var block = document.createElement('div')
    block.className = 'block ' + size
    block.id = blockId
    var titleBlock = document.createElement('h3')
    titleBlock.className = 'title-block'
    titleBlock.innerHTML = title
    block.append(titleBlock)
    for (field of fields) {
        var fieldBlock = document.createElement('p')
        fieldBlock.className = 'block-field'
        fieldBlock.innerHTML = field
        block.append(fieldBlock)
    }
    var object = ''
    if (size === 'small') {
        object = '.account'
    } else if (size === 'large') {
        object = '.big-blocks'
    } else if (size === 'small request') {
        object = '.matches'
    } else if (size.includes('small class')) {
        object = '.classes'
    }
    document.querySelector(object).appendChild(block)
}

async function requestClass() {
    document.getElementById('request-btn').disabled = true
    const subject = document.getElementById('subject').value
    if (subject === '') {
        document.getElementById('request-btn').disabled = false
        token('You need to select a subject.')
        return
    }
    if (!document.getElementById('request-btn').classList.contains('confirm')) {
        document.getElementById('request-btn').classList.add('confirm')
        document.getElementById('request-btn').disabled = false
        token(
            'If you want to request a tutor in ' +
                subject +
                ', click the request button again.'
        )
        return
    }
    const snapshot = await db
        .collection('requests')
        .where('eid', '==', localStorage.getItem('eid'))
        .where('subject', '==', subject)
        .get()

    if (!snapshot.empty) {
        token('You have already requested ' + subject)
        document.getElementById('request-btn').disabled = false
        return
    }
    await db.collection('requests').add({
        eid: localStorage.getItem('eid'),
        subject: subject,
        timezone: localStorage.getItem('timezone'),
        age: localStorage.getItem('age'),
    })
    token('You have successfully requested ' + subject)
    document.getElementById('request-btn').disabled = false
}

async function matchRequests(subjects) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', '/match-requests', true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(
            JSON.stringify({
                subjects: subjects,
                eid: localStorage.getItem('eid'),
            })
        )
        xhr.onload = function () {
            if (this.response === 'false') {
                logout()
                return
            } else if (this.response === 'error') {
                document.querySelector('.matches').remove()
                token(
                    'You must apply to teach subjects before signing up for a class. Please do so from the website!'
                )
                return resolve('Done')
            }
            const data = JSON.parse(this.response)
            if (data.length === 0) {
                document.querySelector('.matches').remove()
                token('There are no student requests currently')
                return resolve('Done')
            }
            const information = document.createElement('h3')
            information.innerText = 'Student Requests'
            document
                .querySelector('.match-instructions')
                .appendChild(information)
            const instructions = document.createElement('p')
            instructions.innerText =
                'Click the student boxes to start tutoring a student! If you want to tutor multiple students at once, you may merge classes from the dashboard.'
            document
                .querySelector('.match-instructions')
                .appendChild(instructions)
            var counter = 1
            for (request of data) {
                createBlock(
                    'Student #' + counter,
                    [
                        'EID: ' + request.eid,
                        'Subject: ' +
                            request.subject.charAt(0).toUpperCase() +
                            request.subject.slice(1),
                        'Timezone: ' + request.timezone,
                        'Age: ' + request.age,
                    ],
                    'small request'
                )
                counter += 1
            }
            spacer = document.createElement('div')
            spacer.className = 'spacer'
            document.querySelector('.matches').appendChild(spacer)
            const blocks = document.querySelectorAll('.request')
            for (block of blocks) {
                block.addEventListener('click', match)
            }
            resolve('Done')
        }
    })
}

async function match() {
    if (!this.classList.contains('selected')) {
        this.classList.add('selected')
        token(
            'If you are sure you want to take a class with the selected student, click again.'
        )
        return
    }
    this.removeEventListener('click', match)
    const requestBlock = this
    const eid = this.childNodes[1].innerText.slice(5)
    const subject = this.childNodes[2].innerText.slice(9)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/match-commit', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            tutor: localStorage.getItem('uid'),
            subject: subject,
            student: eid,
        })
    )
    xhr.onload = function () {
        if (this.response == 'false') {
            token('Something went wrong, and your match was not completed!')
            return
        }
        token('Student matched. Check your email!')
        requestBlock.remove()
    }
}

async function classes() {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/classes', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: localStorage.getItem('uid'),
            name: localStorage.getItem('name'),
            email: localStorage.getItem('email'),
            student:
                localStorage.getItem('role') === 'student' ? 'true' : 'false',
        })
    )
    xhr.onload = function () {
        localStorage.removeItem('name')
        localStorage.removeItem('email')
        const data = JSON.parse(this.response)
        if (data.length === 0) {
            document.querySelector('.class-merge').remove()
            document.querySelector('.classes').remove()
            token('You are not currently registered in any classes.')
            return
        }
        if (localStorage.getItem('role') === 'student') {
            document.querySelector('.class-merge').remove()
        }
        document.querySelector('.class-instructions').innerHTML = ''
        const information = document.createElement('h3')
        information.innerText = 'Classes'
        document.querySelector('.class-instructions').appendChild(information)
        const instructions = document.createElement('p')
        instructions.innerHTML =
            'You can declare a class inactive by clicking the respective button. In addition, if you are a tutor for a class, type in the number of minutes you spent in a class in the input section to update your volunteer hours.'
        document.querySelector('.class-instructions').appendChild(instructions)
        var counter = 1
        var active = false
        var inactiveClasses = []
        for (classItem of data) {
            var studentEmail = ''
            var studentName = ''
            const data = classItem.data
            classData[classItem.id] = classItem.data

            for (student of data.students) {
                studentEmail += student.studentEmail + ', '
                studentName += student.studentName + ', '
            }
            studentEmail = studentEmail.trim().slice(0, -1)
            studentName = studentName.trim().slice(0, -1)

            var options = []
            options.push('Student: ' + studentName)
            options.push('Tutor: ' + data.tutorName)
            options.push('Student Email: ' + studentEmail)
            options.push('Tutor Email: ' + data.tutorEmail)
            options.push(
                'Subject: ' +
                    data.subject.charAt(0).toUpperCase() +
                    data.subject.slice(1)
            )

            if (data.inactive) {
                inactiveClasses.push([options, classItem.id])
                continue
            }

            active = true
            const button =
                '<button onclick="inactivate(this.parentNode)" class="end-class">Declare Inactive</button>'
            options.push(button)
            if (data.tutor === localStorage.getItem('uid')) {
                const logger =
                    '<div class="logger">Minutes: <input type="number"></div><div class="logger">Date: <input type="date"></div><button onclick="logHours(this)" class="log">Log Minutes</button>'
                options.push(logger)
            }
            createBlock(
                'Class #' + counter,
                options,
                'small class',
                classItem.id
            )
            counter += 1
        }

        const maxActiveClasses = counter - 1

        counter = 1
        for (classItem of inactiveClasses) {
            createBlock(
                'Inactive Class #' + counter,
                classItem[0],
                'small class',
                classItem[1]
            )
            counter += 1
        }

        if (!active) {
            const blocks = document.querySelectorAll('.class')
            for (block of blocks) {
                block.style.height = '300px'
            }
        } else {
            const blocks = document.querySelectorAll('.class')
            var change = false
            for (block of blocks) {
                var height = 0
                block.childNodes.forEach((child) => {
                    height += child.offsetHeight
                })
                if (height > 350) {
                    change = height + 220 + 'px'
                    break
                }
            }
            if (change != false) {
                for (block of blocks) {
                    block.style.height = change
                }
            }
        }

        spacer = document.createElement('div')
        spacer.className = 'spacer'
        document.querySelector('.classes').appendChild(spacer)
        const blocks = document.querySelectorAll('.request')
        for (block of blocks) {
            block.addEventListener('click', match)
        }

        if (localStorage.getItem('role') != 'student') {
            for (let i = 1; i <= maxActiveClasses; i++) {
                const option = document.createElement('option')
                option.value = i
                option.innerHTML = 'Class #' + i
                document.getElementById('class1').appendChild(option)
                const option2 = document.createElement('option')
                option2.value = i
                option2.innerHTML = 'Class #' + i
                document.getElementById('class2').appendChild(option2)
            }
            document.querySelector('.class-merge').classList.remove('temp')
        }
    }
}

async function inactivate(e) {
    const match = e.parentNode.id
    e.parentNode.lastChild.previousSibling.firstChild.disabled = true
    db.collection('matches').doc(match).update({
        inactive: true,
    })
    token('Class is now declared inactive!')
}

async function logHours(e) {
    e.disabled = true
    const classItem = classData[e.parentNode.parentNode.id]
    const date = e.previousSibling.lastChild
    const minutes = e.previousSibling.previousSibling.lastChild
    if (minutes >= 300) {
        token('You may only log 300 minutes at a time')
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
    var subject = classItem.subject
    const entry = {
        date: firebase.firestore.Timestamp.fromMillis(
            new Date(date.value).getTime()
        ),
        minutes: parseInt(minutes.value),
        information: {
            type: 'tutor',
            reference: {
                students: classItem.students,
                subject: subject,
                match: e.parentNode.parentNode.id,
            },
        },
    }

    const entryStudent = {
        date: date.value,
        minutes: parseInt(minutes.value),
        information: {
            tutor: classItem.tutorName,
            subject: subject,
            match: e.parentNode.parentNode.id,
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
            tutorEmail: classItem.tutorEmail,
            students: classItem.students,
        })
    )
    xhr.onload = function () {
        if (this.response === 'false') {
            token('This class no longer exists')
            inactivate(e.parentNode)
            return
        }
        token('This class has been logged!')
    }
}

async function mergeClasses() {
    document.getElementById('merge-btn').disabled = true
    const class1 = document.getElementById('class1').value.trim()
    const class2 = document.getElementById('class2').value.trim()
    if (class1 === '' || class2 === '') {
        document.getElementById('merge-btn').disabled = false
        token('You must choose two classes to combine.')
        return
    }
    var classID1 = ''
    var classID2 = ''
    document.querySelectorAll('.class').forEach((classItem) => {
        if (classItem.firstChild.innerText === 'Class #' + class1) {
            classID1 = classItem.id
        } else if (classItem.firstChild.innerText === 'Class #' + class2) {
            classID2 = classItem.id
        }
    })

    if (
        classData[classID1].tutor != localStorage.getItem('uid') ||
        classData[classID2].tutor != localStorage.getItem('uid')
    ) {
        token('You must be a tutor in both classes to merge the classes!')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (classID1 === '' || classID2 === '') {
        token('The class IDs must be valid numbers of your classes')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (classID1 === classID2) {
        token('The classes must be different.')
        document.getElementById('merge-btn').disabled = false
        return
    }

    if (!document.getElementById('merge-btn').classList.contains('selected')) {
        token(
            'If you want to merge these two classes please click the merge button again.'
        )
        document.getElementById('merge-btn').classList.add('selected')
        document.getElementById('merge-btn').disabled = false
        return
    }

    const students = classData[classID2].students
    var linkedClasses = classData[classID2].linkedClasses
    if (linkedClasses === undefined) {
        linkedClasses = []
    }
    linkedClasses.push(classID2)

    var newStudents = []
    for (student of students) {
        const newStudent = {
            student: student.student,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
        }
        newStudents.push(newStudent)
    }

    await db
        .collection('matches')
        .doc(classID1)
        .update({
            students: firebase.firestore.FieldValue.arrayUnion(...newStudents),
            linkedClasses: firebase.firestore.FieldValue.arrayUnion(
                ...linkedClasses
            ),
        })

    await db.collection('matches').doc(classID2).delete()
    token('These two classes have been merged')
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

function upload() {
    if (
        document.getElementById('start-date').value === '' ||
        document.getElementById('end-date').value === ''
    ) {
        token('You need to state what dates you want a certificate in')
        return
    } else if (
        document.getElementById('start-date').value >
        document.getElementById('end-date').value
    ) {
        token('The end date needs to be after the start date.')
        return
    }
    document.getElementById('file').click()
}

async function uploadFile() {
    document.getElementById('file-btn').disabled = true
    const fileBtn = document.getElementById('file')
    const file = fileBtn.files[0]
    const size = file.size
    if (size > 5 * 1024 * 1024) {
        token('This file is too large to upload')
        document.getElementById('file-btn').disabled = false
        fileBtn.value = ''
    }
    if (!file.name.includes('pdf')) {
        token('The upload must be a pdf')
        document.getElementById('file-btn').disabled = false
        return
    }
    addCertificateRequest(file, file.name)
}

async function addCertificateRequest(file, name) {
    document.querySelector('progress').classList.remove('temp')
    const uid = localStorage.getItem('uid')
    const requestId = (
        await db.collection('certificates').add({
            uid: uid,
            start: new Date(
                document.getElementById('start-date').value
            ).getTime(),
            end: new Date(document.getElementById('end-date').value).getTime(),
        })
    ).id
    const ref = storageRef.child(
        '/certificates/' + uid + '/' + requestId + '/' + name
    )
    var upload = ref.put(file, {
        contentType: 'application/pdf',
    })
    upload.on('state_change', (snapshot) => {
        const percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        document.querySelector('progress').value = percentage
    })
    token('We will get back to you with a signed certificate!')
}

async function certificate() {
    if (
        document.getElementById('start-date').value === '' ||
        document.getElementById('end-date').value === ''
    ) {
        token('You need to state what dates you want a certificate in')
        return
    } else if (
        document.getElementById('start-date').value >
        document.getElementById('end-date').value
    ) {
        token('The end date needs to be after the start date.')
        return
    }
    document.getElementById('certificate-btn').disabled = true
    const start = new Date(document.getElementById('start-date').value)
    const end = new Date(document.getElementById('end-date').value)
    const pdfBytes = await createPdf(start, end)
    addCertificateRequest(pdfBytes, 'certificate.pdf')
}

async function createPdf(start, end) {
    const user = (
        await db.collection('users').doc(localStorage.getItem('uid')).get()
    ).data()
    const entries = user['volunteer-entries']
    var minutes = 0
    for (entry of entries) {
        const date = entry.date.toDate()
        if (date >= start && date <= end) {
            minutes += entry.minutes
        }
    }
    const url = 'https://cdn.educationisttutoring.org/images/certificate.pdf'
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    const name = user.name
    firstPage.drawText(name, {
        x: width / 2 - name.length * 10,
        y: height / 2 + 17,
        size: 40,
        font: font,
        color: rgb(0, 0, 0),
    })

    minutes = minutes.toFixed(0).toString()
    firstPage.drawText(minutes, {
        x: width / 2 - minutes.length * 7,
        y: height / 2 - 30,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const month = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]

    const range =
        month[start.getUTCMonth()] +
        ' ' +
        start.getUTCDate() +
        ', ' +
        start.getUTCFullYear() +
        ' and ' +
        month[end.getUTCMonth()] +
        ' ' +
        end.getUTCDate() +
        ', ' +
        end.getUTCFullYear()
    firstPage.drawText(range, {
        x: width / 2 - range.length * 5,
        y: height / 2 - 80,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const date = new Date().toLocaleString('default', {
        month: 'long',
        year: 'numeric',
        day: '2-digit',
    })
    firstPage.drawText(date, {
        x: width / 2 - date.length * 5,
        y: height / 2 - 130,
        size: 20,
        font: font,
        color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
}
