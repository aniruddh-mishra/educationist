var dataSet = ['name', 'birthday', 'email', 'timezone', 'subjects']
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

    if (dates) {
        createBlock(
            'Volunteer Hours',
            [
                Number((dates[2] / 60).toFixed(1)) + ' Hours',
                '<a style="text-decoration: underline" href="/classes">More information</a>',
            ],
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

    spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.account').appendChild(spacer)

    if (data.role != 'student') {
        matchRequests(subjects)
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
