var dataSet = [
    'volunteer Hours',
    'attendance',
    'eid',
    'name',
    'birthday',
    'email',
    'timezone',
    'subjects',
]
async function setUp() {
    const reports = await db
        .collection('reports')
        .where('complete', '!=', true)
        .get()
    if (reports.empty) {
        token('No reports right now!')
        document.querySelector('.reports').remove()
        return
    }
    var counter = 1
    reports.forEach((doc) => {
        var block = document.createElement('div')
        block.className = 'block'
        block.id = doc.id
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = 'Report #' + counter
        block.append(titleBlock)
        const data = doc.data()
        const date = 'Date: ' + data.date.toDate()
        const link =
            'Content: <a href="/content/document?id=' +
            data.document +
            '" target="_blank" rel="noopener noreferrer">Link to Document</a>'
        const text = 'Report: ' + data.text
        const button =
            '<button onclick="complete(this.parentNode)" class="end-report">Declare Complete</button>'
        fields = [date, link, text, button]
        for (field of fields) {
            var fieldBlock = document.createElement('p')
            fieldBlock.className = 'block-field'
            fieldBlock.innerHTML = field
            block.append(fieldBlock)
        }
        document.querySelector('.report-blocks').appendChild(block)
        counter += 1
    })
}

setUp()

async function interview(accept) {
    this.disabled = true
    if (document.getElementById('subject').value === '') {
        token('You must put something in the subject field')
        this.disabled = false
        return
    }
    var snapshot = await db
        .collection('users')
        .where('eid', '==', document.getElementById('eid').value.trim())
        .get()
    if (snapshot.empty) {
        token('That username does not seem to exist.')
        this.disabled = false
        return
    }
    const tutor = snapshot.docs[0]
    const email = tutor.data().email
    const birthday = tutor.data().birthday.toDate().getFullYear()
    if (new Date().getFullYear() - birthday < 13 && accept) {
        token('This user is still under 13, and must be rejected!')
        this.disabled = false
        return
    }
    const id = tutor.id
    var update = {}
    if (accept) {
        var subjects = tutor.data().subjects
        if (subjects === undefined) {
            subjects = [document.getElementById('subject').value]
        } else if (
            !subjects.includes(document.getElementById('subject').value)
        ) {
            subjects.push(document.getElementById('subject').value)
        }
        update = {
            subjects: subjects,
            role: 'tutor',
        }
    } else {
        var subjects = tutor.data().subjects
        if (subjects != undefined) {
            const index = subjects.indexOf(
                document.getElementById('subject').value
            )
            if (index > -1) {
                subjects.splice(index, 1)
            }
            update = {
                subjects: subjects,
            }
        }
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', '/accept', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(
        JSON.stringify({
            uid: localStorage.getItem('uid'),
            email: email,
            accept: accept,
            subject: document.getElementById('subject').value,
        })
    )
    xhr.onload = async function () {
        const response = this.response
        if (response === 'Done!') {
            if (update != {}) {
                await db.collection('users').doc(id).update(update)
            }
            if (accept) {
                token(
                    'User accepted in ' +
                        document.getElementById('subject').value
                )
            } else {
                token(
                    'User rejected in ' +
                        document.getElementById('subject').value
                )
            }
            this.disabled = false
            return
        }
        token('Something went wrong, please try again later!')
    }
}

async function search(e) {
    e.disabled = true
    document.querySelector('.user-data').innerHTML = ''
    if (e.id === 'search-btn') {
        var email = document.getElementById('email').value
        email = email.charAt(0).toLowerCase() + email.slice(1)
        var snapshot = await db
            .collection('users')
            .where('email', '==', email)
            .get()
    } else {
        var username = document.getElementById('username').value.trim()
        var snapshot = await db
            .collection('users')
            .where('eid', '==', username)
            .get()
    }
    if (snapshot.empty) {
        token('That username does not exist')
        e.disabled = false
        return
    }
    var user = snapshot.docs[0].data()
    const volunteerHours = user['volunteer-entries']
    const attendance = user['attendance-entries']

    if (volunteerHours != undefined) {
        var minutes = 0
        for (entry of volunteerHours) {
            minutes += entry.minutes
        }
        user['volunteer Hours'] = minutes + ' Minutes'
    }

    if (attendance != undefined) {
        var minutes = 0
        for (entry of attendance) {
            minutes += entry.minutes
        }
        user.attendance = minutes + ' Minutes'
    }

    user.birthday = user.birthday.toDate().getFullYear()
    for (key of dataSet) {
        if (user[key] == undefined) {
            continue
        }
        var block = document.createElement('div')
        block.className = 'block'
        var titleBlock = document.createElement('h3')
        titleBlock.innerHTML = key.charAt(0).toUpperCase() + key.slice(1)
        block.append(titleBlock)
        var fieldBlock = document.createElement('p')
        fieldBlock.className = 'block-field'
        fieldBlock.innerHTML = user[key]
        block.append(fieldBlock)
        document.querySelector('.user-data').appendChild(block)
    }
    spacer = document.createElement('div')
    spacer.className = 'spacer'
    document.querySelector('.user-data').appendChild(spacer)
    e.disabled = false
}

async function complete(e) {
    const reportId = e.parentNode.id
    if (!e.childNodes[0].classList.contains('confirm')) {
        e.childNodes[0].classList.add('confirm')
        token(
            'If you are sure that you want to mark this task as complete, click again!'
        )
        return
    }
    await db.collection('reports').doc(reportId).update({ complete: true })
    token('Task marked as complete!')
}
