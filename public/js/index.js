var dataSet = ['name', 'birthday', 'email', 'timezone', 'subjects']
var classLinks = {}

async function getData() {
    const uid = localStorage.getItem('uid')
    const userData = await db.collection('users').doc(uid).get()
    localStorage.setItem('timezone', userData.data().timezone)
    localStorage.setItem('role', userData.data().role)
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
        const data = []
        for (entry of volunteerHours) {
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
    data.birthday = data.birthday.toDate().toLocaleString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
    if (data.role != 'student' && data['subjects'] == undefined) {
        createBlock(
            'Subjects',
            [
                'You are not accepted in any subjects. If you believe you are, try to transfer your information first. If not, fill out <a style="text-decoration: underline" href="https://docs.google.com/forms/d/1L0WRzXm20G5SmhCkv2y0ODKYTpUwGkGloOJsXgQFI0c/">this form!</a>',
            ],
            'small'
        )
    }
    dataFields = []
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
        await matchRequests(subjects)
    }

    if (document.querySelector('.matches').innerHTML === '') {
        document.querySelector('.matches').remove()
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
    } else if (size === 'small class') {
        object = '.classes'
    }
    document.querySelector(object).appendChild(block)
}

async function request() {
    document.getElementById('request-btn').disabled = true
    const subject = document.getElementById('subject').value
    if (subject === '') {
        document.getElementById('request-btn').disabled = false
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
                token(
                    'You must apply to teach subjects before signing up for a class. Please do so from the website!'
                )
                return resolve('Done')
            }
            const data = JSON.parse(this.response)
            if (data.length === 0) {
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
                'Click the student boxes to start tutoring a student!'
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
            student:
                localStorage.getItem('role') === 'student' ? 'true' : 'false',
        })
    )
    xhr.onload = function () {
        const data = JSON.parse(this.response)
        if (data.length === 0) {
            document.querySelector('.classes').remove()
            token('You are not currently registered in any classes.')
            return
        }
        document.querySelector('.class-instructions').innerHTML = ''
        const information = document.createElement('h3')
        information.innerText = 'Classes'
        document.querySelector('.class-instructions').appendChild(information)
        const instructions = document.createElement('p')
        instructions.innerHTML =
            'You can declare a class inactive by clicking the respective button. In addition, if you are a tutor for a class, type in the number of minutes you spent in a class in the input section to update your volunteer hours. To add multiple students to a class please email Educationist Tutoring. If you are a tutor, and you want to import an existing class or add a class manually, please fill out <a style="text-decoration: underline" href="https://docs.google.com/forms/d/e/1FAIpQLSf0NZF69Xzn0EGKXeWDs8dG1a45iOS-ZDbxF9b8Mjjv49mdhQ/viewform">this form!</a>'
        document.querySelector('.class-instructions').appendChild(instructions)
        var counter = 1
        var active = false
        var inactiveClasses = []
        for (classItem of data) {
            const data = classItem.data
            if (data.inactive) {
                inactiveClasses.push(classItem)
                continue
            }
            var options = []
            if (
                data.classLink != undefined &&
                data.tutor === localStorage.getItem('uid')
            ) {
                if (classLinks[data.classLink] != undefined) {
                    classLinks[data.classLink].push(classItem.id)
                } else {
                    classLinks[data.classLink] = [classItem.data.studentEmail]
                }
                continue
            }
            options.push('Student: ' + data.studentName)
            options.push('Tutor: ' + data.tutorName)
            options.push('Student Email: ' + data.studentEmail)
            options.push('Tutor Email: ' + data.tutorEmail)
            options.push(
                'Subject: ' +
                    data.subject.charAt(0).toUpperCase() +
                    data.subject.slice(1)
            )
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

        counter = 1
        for (classItem of inactiveClasses) {
            var options = []
            options.push('Student: ' + classItem.data.studentName)
            options.push('Tutor: ' + classItem.data.tutorName)
            options.push('Student Email: ' + classItem.data.studentEmail)
            options.push('Tutor Email: ' + classItem.data.tutorEmail)
            options.push(
                'Subject: ' +
                    classItem.data.subject.charAt(0).toUpperCase() +
                    classItem.data.subject.slice(1)
            )
            createBlock(
                'Inactive Class #' + counter,
                options,
                'small class',
                classItem.id
            )
            counter += 1
        }

        if (!active) {
            const blocks = document.querySelectorAll('.class')
            for (block of blocks) {
                block.style.height = '300px'
            }
        }
        spacer = document.createElement('div')
        spacer.className = 'spacer'
        document.querySelector('.classes').appendChild(spacer)
        const blocks = document.querySelectorAll('.request')
        for (block of blocks) {
            block.addEventListener('click', match)
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
    var subject =
        e.parentNode.previousSibling.previousSibling.innerText.slice(9)
    subject = subject.charAt(0).toLowerCase() + subject.slice(1)
    const entry = {
        date: firebase.firestore.Timestamp.fromMillis(
            new Date(date.value).getTime()
        ),
        minutes: parseInt(minutes.value),
        information: {
            type: 'tutor',
            reference: {
                student:
                    e.parentNode.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling.innerText.slice(
                        9
                    ),
                subject: subject,
                match: e.parentNode.parentNode.id,
            },
        },
    }

    const entryStudent = {
        date: date.value,
        minutes: parseInt(minutes.value),
        information: {
            tutor: e.parentNode.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling.innerText.slice(
                7
            ),
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
            tutorEmail:
                e.parentNode.previousSibling.previousSibling.previousSibling.innerText.slice(
                    13
                ),
            studentEmail:
                e.parentNode.previousSibling.previousSibling.previousSibling.previousSibling.innerText.slice(
                    15
                ),
            extras: classLinks[e.parentNode.parentNode.id],
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
