dataSet = ['name', 'birthday', 'email', 'timezone']

async function getData() {
    const uid = localStorage.getItem('uid')
    const userData = await db.collection('users').doc(uid).get()
    localStorage.setItem('timezone', userData.data().timezone)
    const volunteerHours = await db
        .collection('users')
        .doc(uid)
        .collection('volunteer-entries')
        .get()

    if (!volunteerHours.empty) {
        const data = []
        volunteerHours.forEach((doc) => {
            data.push({
                date: doc.data().date.toDate(),
                minutes: doc.data().minutes,
            })
        })

        data.sort((a, b) => {
            return a.date < b.date ? -1 : a.date == b.date ? 0 : 1
        })

        const hours = []
        const dates = []

        data.forEach((doc) => {
            dates.push(
                doc.date.toLocaleString('default', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })
            )
            hours.push(Number((doc.minutes / 60).toFixed(1)))
        })
        placeData(userData.data(), [dates, hours])
    } else {
        placeData(userData.data(), false)
    }
}

getData()

async function placeData(data, dates) {
    data.birthday = data.birthday.toDate().toLocaleString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
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
        const volunteerHours = data['volunteer-hours']
        const minutes =
            volunteerHours['admin']['total'] +
            volunteerHours['tutor']['total'] +
            volunteerHours['content']['total']
        createBlock('Volunteer Hours', [minutes / 60 + ' Hours'], 'small')
    }

    spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.account').appendChild(spacer)

    if (data.role === 'student') {
        document.querySelector('.matching-request').className =
            'matching-request active'
    } else {
        document.querySelector('.matches').innerHTML = ''
        await matchRequests()
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
}

function createBlock(title, fields, size) {
    var block = document.createElement('div')
    block.className = 'block ' + size
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
    })
    token('You have successfully requested ' + subject)
    document.getElementById('request-btn').disabled = false
}

async function matchRequests() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', '/match-requests', true)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(
            JSON.stringify({
                uid: localStorage.getItem('uid'),
            })
        )
        xhr.onload = function () {
            if (this.response === 'false') {
                logout()
                return
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
                        'Name: ' + request.eid,
                        'Subject: ' +
                            request.subject.charAt(0).toUpperCase() +
                            request.subject.slice(1),
                        'Timezone: ' + request.timezone,
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
    this.removeEventListener('click', match)
    const requestBlock = this
    const eid = this.childNodes[1].innerText.slice(6)
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
