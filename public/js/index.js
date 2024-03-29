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
    if (userData.data().discord === undefined) {
        const button = document.createElement('button')
        button.innerHTML = 'Join Our Discord!'
        button.id = 'discord-btn'
        button.setAttribute('onclick', 'discord()')
        document.getElementById('discord-container').appendChild(button)
    } else {
        document.getElementById('discord-container').remove()
    }
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
                '<a style="text-decoration: underline; color: var(--educationist-green);" href="/logs">More information</a>',
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
    myRequests()
}

function createRequestBlock(count, username, age, subject, timezone) {
    var requestBody = document.createElement('tbody')
    var requestRow = document.createElement('tr')

    var requestCount = document.createElement('th')
    requestCount.innerHTML = count
    requestCount.classList.add('request-count')

    var requestName = document.createElement('th')
    requestName.innerHTML = username

    var requestUsername = document.createElement('th')
    requestUsername.innerHTML = username

    var requestAge = document.createElement('th')
    requestAge.innerHTML = age

    var requestSubject = document.createElement('th')
    requestSubject.innerHTML = subject

    var requestTimezone = document.createElement('th')
    requestTimezone.innerHTML = timezone

    var requestButton = document.createElement('th')
    var button = document.createElement('button')
    button.innerHTML = 'MATCH'
    button.addEventListener('click', match)
    button.classList.add('match-me-button')
    requestButton.appendChild(button)

    requestRow.appendChild(requestCount)
    requestRow.appendChild(requestName)
    requestRow.appendChild(requestUsername)
    requestRow.appendChild(requestAge)
    requestRow.appendChild(requestSubject)
    requestRow.appendChild(requestTimezone)
    requestRow.appendChild(requestButton)

    requestBody.appendChild(requestRow)

    document.querySelector('.requests-table').appendChild(requestBody)
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
    } else if (size === 'small myRequest') {
        object = '.my-requests'
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
                createRequestBlock(
                    counter,
                    request.eid,
                    request.age,
                    request.subject,
                    request.timezone
                )

                counter = counter + 1
            }

            spacer = document.createElement('div')
            spacer.className = 'spacer'
            document.querySelector('.matches').appendChild(spacer)

            resolve('Done')
        }
    })
}

async function match() {
    if (!this.classList.contains('selected')) {
        this.classList.add('selected')
        this.innerHTML = 'CLICK AGAIN'
        token(
            'If you are sure you want to take a class with the selected student, click again.'
        )
        return
    }
    this.removeEventListener('click', match)
    const requestBlock = this
    var requestRow = requestBlock.parentNode.parentNode
    const eid = requestRow.childNodes[2].innerText
    const subject = requestRow.childNodes[4].innerText
    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/match-commit', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            tutor: localStorage.getItem('uid'),
            subject: lowerCase(subject),
            student: lowerCase(eid),
        })
    )
    xhr.onload = function () {
        if (this.response == 'false') {
            token('Something went wrong, and your match was not completed!')
            return
        }
        token('Student matched. Check your email!')
        requestRow.remove()
    }
}

async function myRequests() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', '/my-requests', true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(
            JSON.stringify({
                eid: localStorage.getItem('eid'),
            })
        )
        xhr.onload = function () {
            const data = JSON.parse(this.response)
            if (data.length === 0) {
                document.querySelector('.my-requests').remove()
                document.querySelector('.my-instructions').remove()
                return resolve('Done')
            }
            const information = document.createElement('h3')
            information.innerText = 'Requested Classes'
            document.querySelector('.my-instructions').appendChild(information)
            const instructions = document.createElement('p')
            instructions.innerText =
                'These are classes you have already requested. You can delete requests by clicking the delete button.'
            document.querySelector('.my-instructions').appendChild(instructions)
            var counter = 1
            for (request of data) {
                createBlock(
                    'Request #' + counter,
                    [
                        'Subject: ' +
                            request[0].subject.charAt(0).toUpperCase() +
                            request[0].subject.slice(1),
                        '<button class="delete-request-btn" onclick="deleteRequest(this.parentNode.parentNode)"> Delete Request </button>',
                    ],
                    'small myRequest',
                    request[1]
                )
                counter += 1
            }
            spacer = document.createElement('div')
            spacer.className = 'spacer'
            document.querySelector('.my-requests').appendChild(spacer)
            resolve('Done')
        }
    })
}

async function deleteRequest(e) {
    e.remove()
    await db.collection('requests').doc(e.id).delete()
    token('Deleted Request')
}

function discord() {
    window.location.replace('/discord')
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
